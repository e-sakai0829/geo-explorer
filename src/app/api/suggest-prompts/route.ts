import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1"]);

function isPrivateOrBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(h)) return true;
  if (h === "169.254.169.254") return true; // クラウドメタデータエンドポイント
  if (/^10\.\d+\.\d+\.\d+$/.test(h)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(h)) return true;
  if (h.endsWith(".local")) return true;
  return false;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJsonArray(text: string): any[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "AI提案機能の利用にはログインが必要です。", loginRequired: true },
        { status: 401 }
      );
    }

    const { url, brandName = "自社ブランド" } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "対象サイトのURLを入力してください。" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "URLの形式が正しくありません。" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol) || isPrivateOrBlockedHost(parsedUrl.hostname)) {
      return NextResponse.json({ error: "このURLは解析対象として利用できません。" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません。" }, { status: 500 });
    }

    let pageText = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const pageRes = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: { "User-Agent": "GEOExplorerBot/1.0 (+https://geo-explorer.app)" },
      });
      clearTimeout(timeout);
      if (pageRes.ok) {
        const html = await pageRes.text();
        pageText = stripHtml(html).slice(0, 12000);
      }
    } catch (fetchError) {
      console.warn("suggest-prompts: page fetch failed, continuing with URL only", fetchError);
    }

    const ai = new GoogleGenAI({ apiKey });

    const instruction = `あなたはLLMO/GEO対策の専門コンサルタントです。以下のWebサイト情報をもとに、
このサイトが「AI検索（Google AI Overviews / ChatGPT等）でおすすめとして紹介されるべき」
商用検索プロンプトを10個提案してください。

対象サイトURL: ${parsedUrl.toString()}
ブランド名（想定）: ${brandName}
サイト本文抜粋:
"""
${pageText || "(本文取得不可のためURL・ドメイン名から推測)"}
"""

出力条件:
- 実際の見込み客がAIに投げかけそうな自然な検索意図の文（「◯◯ おすすめ」「◯◯ 比較」「◯◯ 中小企業」等）を混ぜる
- category は「おすすめ系」「比較系」「業種別」「課題解決系」「価格・費用系」等から選ぶか適切な日本語で命名する
- promptText は実際にAIへ投げる完全な質問文（例:「"XXX"と検索する人におすすめのツール名を優先度をつけて3つ教えてください。」形式）にする
- 出力は他の説明文を含めず、以下のJSON配列のみを返す:

[
  { "category": "string", "keyword": "string", "promptText": "string", "searchIntent": "string", "importance": "high" | "medium" | "low" }
]`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: instruction,
        config: { temperature: 0.4 },
      });
    } catch (modelError) {
      console.warn("suggest-prompts: primary model failed, retrying with gemini-2.0-flash", modelError);
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: instruction,
        config: { temperature: 0.4 },
      });
    }

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const suggestions = extractJsonArray(text)
      .filter((s: any) => s && typeof s.promptText === "string" && s.promptText.trim().length > 0)
      .slice(0, 10)
      .map((s: any) => ({
        category: typeof s.category === "string" && s.category.trim() ? s.category.trim() : "未分類",
        keyword: typeof s.keyword === "string" ? s.keyword.trim() : "",
        promptText: s.promptText.trim(),
        searchIntent: typeof s.searchIntent === "string" ? s.searchIntent.trim() : "",
        importance: ["high", "medium", "low"].includes(s.importance) ? s.importance : "medium",
      }));

    if (suggestions.length === 0) {
      return NextResponse.json(
        { error: "AIによるプロンプト提案の生成に失敗しました。時間をおいて再度お試しください。" },
        { status: 502 }
      );
    }

    return NextResponse.json({ suggestions, sourceUrl: parsedUrl.toString() });
  } catch (error: any) {
    console.error("Suggest Prompts API Error:", error);
    return NextResponse.json({ error: error.message || "提案生成中にエラーが発生しました。" }, { status: 500 });
  }
}
