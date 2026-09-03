/**
 * GEOスキャン共通エンジン
 * /api/analyze（手動スキャン）と /api/cron/weekly-scan（週次自動スキャン）の
 * 両方から呼び出す共通ロジックを1箇所に集約し、ATSスコアの算出方法が
 * 画面ごとに食い違う（＝ダッシュボードの数値に根拠がない）事態を防ぐ。
 */
import { GoogleGenAI } from "@google/genai";
import {
  calculateATS,
  type ATSInput,
  type BrandMention,
  type CitationSource,
} from "@/lib/ats-calculator";
import type { AioStatus, LLMEngine } from "@/types/geo";

export interface WebSource {
  title: string;
  url: string;
}

export interface GeminiScanRaw {
  text: string;
  webSources: WebSource[];
  searchQueries: string[];
}

/**
 * Google Search Grounding 対応 Gemini モデルでのライブスキャン実行。
 * 主モデルが利用不可の場合は互換モデルへ自動フォールバックする。
 */
export async function runGeminiScan(
  scanPrompt: string,
  apiKey: string
): Promise<GeminiScanRaw> {
  const ai = new GoogleGenAI({ apiKey });

  let response: any;
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: scanPrompt,
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 },
    });
  } catch (modelError) {
    console.warn("Primary model gemini-3.6-flash failed, retrying with gemini-2.0-flash...", modelError);
    response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: scanPrompt,
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 },
    });
  }

  const candidate = response.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text || "";
  const groundingMetadata = candidate?.groundingMetadata;
  const searchChunks = groundingMetadata?.groundingChunks || [];

  const webSources: WebSource[] = searchChunks
    .filter((chunk: any) => chunk.web?.uri)
    .map((chunk: any) => ({
      title: chunk.web.title || "引用元ページ",
      url: chunk.web.uri,
    }));

  const searchQueries: string[] = groundingMetadata?.webSearchQueries || [];

  return { text, webSources, searchQueries };
}

/**
 * 生成テキストから「◯番目に紹介されているか」を推定する。
 * 完全な構造化出力ではないため、番号付きリスト（1. / ① / ・等）の
 * 出現順で近似する簡易ヒューリスティック。リスト内で見つからない場合、
 * 本文中の言及有無のみを rank=0 (mentionedInText) として区別する。
 * ※ 高精度なランク取得が必要な場合は、実務Excel同様に専用の順位判定プロンプトを
 *   別途発行する運用に切り替えることを推奨（このヒューリスティックはあくまで簡易推定）。
 */
export function estimateRank(text: string, name: string): { rank: number; mentionedInText: boolean } {
  if (!name || !text) return { rank: 0, mentionedInText: false };

  const normalizedName = name.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const mentionedInText = lowerText.includes(normalizedName);

  if (!mentionedInText) return { rank: 0, mentionedInText: false };

  // 番号付きリスト行を抽出し、対象名が最初に現れる項目の順序を推定
  const lines = text.split(/\r?\n/);
  const listMarker = /^\s*(?:[\*\-・]\s*)?(?:\*\*)?\s*(\d{1,2})[\.\)、．]/;
  let currentOrdinal = 0;
  for (const line of lines) {
    const m = line.match(listMarker);
    if (m) {
      currentOrdinal = parseInt(m[1], 10);
    }
    if (currentOrdinal > 0 && line.toLowerCase().includes(normalizedName)) {
      return { rank: currentOrdinal, mentionedInText: true };
    }
  }

  return { rank: 0, mentionedInText: true };
}

export interface ScanEvaluationInput {
  targetBrand: string;
  targetDomain: string;
  competitors: string[];
  scanText: string;
  webSources: WebSource[];
  searchQueries: string[];
}

export interface ScanEvaluationResult {
  brandMentioned: boolean;
  brandCited: boolean;
  competitorMentions: Record<string, boolean>;
  rank: number | null;
  aioStatus: AioStatus;
  winLoss: "win" | "loss" | "draw" | "not_applicable";
  ats: ReturnType<typeof calculateATS>;
}

/**
 * スキャン結果テキストを評価し、DB保存用のフィールド一式（ATSスコア含む）を構築する。
 * ここで計算した値のみが唯一の正となるよう、画面側では再計算せずこの結果を表示する。
 */
export function evaluateScan(input: ScanEvaluationInput): ScanEvaluationResult {
  const { targetBrand, targetDomain, competitors, scanText, webSources, searchQueries } = input;

  const cleanCompetitors = (competitors || []).filter(Boolean);

  const targetEstimate = estimateRank(scanText, targetBrand);
  const brandMentioned = targetEstimate.mentionedInText;
  const brandCited = webSources.some(
    (s) =>
      s.title.toLowerCase().includes(targetBrand.toLowerCase()) ||
      s.url.toLowerCase().includes(targetBrand.toLowerCase()) ||
      (targetDomain && s.url.toLowerCase().includes(targetDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase()))
  );

  const competitorMentions: Record<string, boolean> = {};
  const brandMentions: BrandMention[] = [
    { brandName: targetBrand, rank: targetEstimate.rank, mentionedInText: targetEstimate.mentionedInText },
  ];

  let anyCompetitorMentioned = false;
  cleanCompetitors.forEach((comp) => {
    const est = estimateRank(scanText, comp);
    competitorMentions[comp] = est.mentionedInText;
    if (est.mentionedInText) anyCompetitorMentioned = true;
    brandMentions.push({ brandName: comp, rank: est.rank, mentionedInText: est.mentionedInText });
  });

  // AIOが全く生成されなかった（グラウンディング結果ゼロ・本文もゼロ）場合のみ not_shown。
  // 「本文はあるが自社が非推奨」と「そもそも計測されていない」を混同しないための3値判定。
  let aioStatus: AioStatus;
  if (!scanText && webSources.length === 0) {
    aioStatus = "not_shown";
  } else if (targetEstimate.rank >= 1 && targetEstimate.rank <= 3) {
    aioStatus = "shown_recommended";
  } else {
    aioStatus = "shown_not_recommended";
  }

  let winLoss: ScanEvaluationResult["winLoss"] = "not_applicable";
  if (cleanCompetitors.length > 0) {
    if (brandMentioned && !anyCompetitorMentioned) winLoss = "win";
    else if (brandMentioned && anyCompetitorMentioned) winLoss = "draw";
    else if (!brandMentioned && anyCompetitorMentioned) winLoss = "loss";
    else winLoss = "not_applicable";
  }

  const citations: CitationSource[] = webSources.map((s) => ({
    title: s.title,
    url: s.url,
    domain: (() => {
      try {
        return new URL(s.url).hostname.replace(/^www\./, "");
      } catch {
        return s.url;
      }
    })(),
  }));

  const atsInput: ATSInput = {
    targetBrand,
    targetDomain,
    competitors: cleanCompetitors,
    aiResponseText: scanText,
    brandMentions,
    citations,
    // 単発スキャンではファンアウト網羅率を実測できないため、
    // 空配列を渡し中立スコア(10pt)として扱う（未計測を0点扱いにしない）。
    fanoutQueries: [],
    coveredFanoutsPerBrand: {},
  };

  const ats = calculateATS(atsInput);

  return {
    brandMentioned,
    brandCited,
    competitorMentions,
    rank: targetEstimate.rank > 0 ? targetEstimate.rank : null,
    aioStatus,
    winLoss,
    ats,
  };
}

export function buildScanPrompt(prompt: string, targetLocale: string): string {
  if (targetLocale === "zh-TW") {
    return `請針對以下繁體中文商務搜尋詞，結合即時 Google 搜尋結果，提供客觀專業的比較排名、推薦品牌清單（附帶推薦理由）及關鍵引用來源：\n\n查詢詞: "${prompt}"`;
  }
  if (targetLocale === "en") {
    return `Perform an authoritative web search analysis using Google Search grounding for the following commercial query. Provide ranked brand recommendations (with specific reasons), comparative highlights, and key source citations:\n\nQuery: "${prompt}"`;
  }
  return `以下の商用・BtoB検索クエリについて、Googleウェブ検索連携（Grounding）を踏まえて最新の市場実態を反映した客観的な比較・ランキング解説（おすすめ上位企業/サービスと選定理由）、および引用元URLを提示してください。\n\nクエリ: "${prompt}"`;
}

export const DEFAULT_ENGINE: LLMEngine = "gemini";
