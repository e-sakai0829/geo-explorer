/**
 * GEOスキャン共通エンジン
 * /api/analyze（手動スキャン）と /api/cron/weekly-scan（週次自動スキャン）の
 * 両方から呼び出す共通ロジックを1箇所に集約し、ATSスコアの算出方法が
 * 画面ごとに食い違う（＝ダッシュボードの数値に根拠がない）事態を防ぐ。
 */
import { randomUUID } from "node:crypto";
import { normalizeObservationLocale, OBSERVATION_MODELS } from "@/lib/observation-contract";
import { GoogleGenAI } from "@google/genai";
import {
  calculateATS,
  matchesOfficialHost,
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
  modelName: string;
  logId: string;
  measuredAt: string;
}

/**
 * Google Search Grounding 対応 Gemini モデルでのライブスキャン実行。
 * 主モデルが利用不可の場合は互換モデルへ自動フォールバックする。
 * 実際に成功したモデル名（実モデル名）を返却し、固定保存や推測を排除する。
 */
export interface ScanAttempt { modelName: string; logId: string; measuredAt: string; raw?: GeminiScanRaw; errorCode?: string; }
export async function runGeminiScan(scanPrompt: string, apiKey: string, onAttempt?: (attempt: ScanAttempt) => Promise<void>): Promise<GeminiScanRaw> {
  const ai = new GoogleGenAI({ apiKey });
  for (const modelName of OBSERVATION_MODELS) {
    const logId = randomUUID();
    let response: any, failed = false;
    try { response = await ai.models.generateContent({ model: modelName, contents: scanPrompt, config: { tools: [{ googleSearch: {} }], temperature: 0.2 } }); }
    catch { failed = true; }
    const measuredAt = new Date().toISOString();
    if (failed) { await onAttempt?.({ modelName, logId, measuredAt, errorCode: 'EXTERNAL_API_ERROR' }); continue; }
    const candidate = response?.candidates?.[0];
    const text = (Array.isArray(candidate?.content?.parts) ? candidate.content.parts : []).filter((p: any) => p && typeof p.text === 'string' && !p.thought).map((p: any) => p.text).join('\n');
    const metadata = candidate?.groundingMetadata;
    const webSources = (Array.isArray(metadata?.groundingChunks) ? metadata.groundingChunks : []).filter((c: any) => c && typeof c.web?.uri === 'string').map((c: any) => ({ title: typeof c.web.title === 'string' ? c.web.title : '', url: c.web.uri }));
    const searchQueries = (Array.isArray(metadata?.webSearchQueries) ? metadata.webSearchQueries : []).filter((q: unknown) => typeof q === 'string');
    const raw = { text, webSources, searchQueries, modelName, logId, measuredAt };
    // Persistence/evaluation failures must not trigger another billable model call.
    await onAttempt?.({ modelName, logId, measuredAt, raw });
    return raw;
  }
  throw new Error('EXTERNAL_API_ERROR');
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
  if (!normalizedName) return { rank: 0, mentionedInText: false };
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
    if (m && currentOrdinal > 0 && line.toLowerCase().includes(normalizedName)) {
      return { rank: currentOrdinal, mentionedInText: true };
    }
  }

  return { rank: 0, mentionedInText: true };
}

export interface ScanEvaluationInput {
  targetBrand: string;
  targetDomain: string;
  competitors: string[];
  /** 競合の公式ドメインマップ（登録されている場合、対称採点として公式ドメイン引用を同等に判定） */
  competitorDomains?: Record<string, string>;
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
  const { targetBrand, targetDomain, competitors, competitorDomains, scanText, webSources, searchQueries } = input;

  const cleanCompetitors = (competitors || []).filter(Boolean);

  const targetEstimate = estimateRank(scanText, targetBrand);
  const brandMentioned = targetEstimate.mentionedInText;
  const brandCited = webSources.some(s => matchesOfficialHost(s.url, targetDomain));

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
  if (cleanCompetitors.length > 0 && cleanCompetitors.every(c => competitorDomains?.[c])) {
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
    competitorDomains,
    aiResponseText: scanText,
    brandMentions,
    citations,
    // 単発スキャンではファンアウト網羅率を実測できないため、
    // 空配列を渡す。未計測はNULLであり0点や架空の10点にしない。
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
  targetLocale = normalizeObservationLocale(targetLocale);
  if (targetLocale === "zh-TW") {
    return `請針對以下繁體中文商務搜尋詞，結合即時 Google 搜尋結果，提供客觀專業的比較排名、推薦品牌清單（附帶推薦理由）及關鍵引用來源：\n\n查詢詞: "${prompt}"`;
  }
  if (targetLocale === "en-US") {
    return `Perform an authoritative web search analysis using Google Search grounding for the following commercial query. Provide ranked brand recommendations (with specific reasons), comparative highlights, and key source citations:\n\nQuery: "${prompt}"`;
  }
  return `以下の商用・BtoB検索クエリについて、Googleウェブ検索連携（Grounding）を踏まえて最新の市場実態を反映した客観的な比較・ランキング解説（おすすめ上位企業/サービスと選定理由）、および引用元URLを提示してください。\n\nクエリ: "${prompt}"`;
}

export const DEFAULT_ENGINE: LLMEngine = "gemini";
