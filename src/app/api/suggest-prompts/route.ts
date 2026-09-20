import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { safeFetch, validateUrl } from "@/lib/safe-fetch";

export const runtime = "nodejs";

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
    if (typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "対象サイトのURLを入力してください。" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = validateUrl(url);
    } catch (validationErr: any) {
      return NextResponse.json(
        { error: `このURLは解析対象として利用できません: ${validationErr.message}` },
        { status: 400 }
      );
    }

    let pageText = "";
    try {
      const fetchResult = await safeFetch(parsedUrl.toString(), {
        timeoutMs: 10000,
        signal: req.signal,
      });

      if (fetchResult.status < 200 || fetchResult.status >= 300) {
        return NextResponse.json(
          { error: `対象URLの取得に失敗しました (HTTP ${fetchResult.status} ${fetchResult.statusText})。有効なWebページURLを指定してください。` },
          { status: 400 }
        );
      }

      const contentType = (fetchResult.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
      if (contentType && !["text/html", "application/xhtml+xml", "text/plain"].includes(contentType)) {
        return NextResponse.json({ error: "本文を読み取れるWebページURLを指定してください。" }, { status: 400 });
      }
      pageText = stripHtml(fetchResult.body).slice(0, 12000);
      if (!pageText || req.signal?.aborted) {
        return NextResponse.json({ error: "対象ページの本文を取得できないか、処理が中断されました。" }, { status: 400 });
      }
    } catch (fetchError: any) {
      console.warn("suggest-prompts: safeFetch failed", fetchError.message);
      // SSRFや接続失敗時は有料Gemini APIを呼び出さず、安全に400エラーで停止する（意図しない課金を防止）
      return NextResponse.json(
        { error: `対象Webページの安全な取得に失敗したため、AI提案の処理を中止しました: ${fetchError.message}` },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません。" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const instruction = `あなたはLLMO/GEO対策の専門コンサルタントです。以下のWebサイト情報をもとに、
このサイトが「AI検索（Google AI Overviews / Gemini / ChatGPT等）でおすすめ上位として紹介されるべき」
商用検索プロンプトを10個提案してください。

対象サイトURL: ${parsedUrl.toString()}
ブランド名（想定）: ${brandName}
サイト本文抜粋:
"""
${pageText}
"""

出力条件（最重要）:
- 【完全ランキング・順位比較形式に統一】10個すべてのプロンプトを、AIに「おすすめ上位ランキング」「人気比較ランキング」形式で回答させる質問文にしてください（例:「◯◯のおすすめツールをランキング形式で上位5社教えてください」「◯◯の人気サービスを比較してランキング順に特徴を解説してください」等）。後のGEOコンサルティングにおいて、AI回答内での言及順位（1位〜5位）を明確に測定・改善提案できる構造にします。
- category は「おすすめランキング」「比較・順位」「業種別ランキング」「課題解決・導入比較」「費用対効果ランキング」等から適切な日本語で命名する
- promptText はユーザーがAIへ投げる完全な質問文にする（すべて明確にランキング・順位・おすすめ上位を尋ねる自然なビジネス質問文）
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
