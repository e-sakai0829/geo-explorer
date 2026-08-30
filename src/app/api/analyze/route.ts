import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    // 1. 認証・ユーザーチェック（解析実行には無料登録・ログインが必須）
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { 
          error: "リアルタイム解析を実行するには無料アカウント登録・ログインが必要です。新規登録で毎月10クエリ無料スキャンがご利用いただけます。",
          loginRequired: true 
        }, 
        { status: 401 }
      );
    }

    let orgId: string | null = null;
    let creditsRemaining = 10;

    // ユーザーの組織情報を取得
    const { data: org } = await supabase
      .from("organizations")
      .select("id, plan, monthly_credits, used_credits")
      .eq("user_id", user.id)
      .single();

    if (org) {
      orgId = org.id;
      // アトミックなクレジット消費チェック
      const { data: creditConsumed, error: rpcError } = await supabase.rpc("consume_credit", { org_id: org.id });

      if (rpcError) {
        console.error("consume_credit RPC error:", rpcError);
      } else if (!creditConsumed) {
        return NextResponse.json(
          { 
            error: "今月の調査クレジット上限に達しました。プランをアップグレードしてください。",
            upgradeRequired: true,
            currentCredits: org.monthly_credits,
            usedCredits: org.used_credits,
          }, 
          { status: 403 }
        );
      }
      creditsRemaining = Math.max(0, org.monthly_credits - (org.used_credits + 1));
    }

    const { 
      prompt, 
      brandName = "自社ブランド", 
      competitors = [],
      targetLocale = "ja"
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "調査対象のプロンプトを入力してください。" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません。" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 4. ロケール別のSearch Grounding指示
    let scanPrompt = "";
    if (targetLocale === "zh-TW") {
      scanPrompt = `請針對以下繁體中文搜尋詞，檢索最新台灣及香港地區之 Google 搜尋結果，並以 Google AI Overviews 方式輸出精準摘要、推薦品牌及關鍵引用來源：\n\n查詢詞: "${prompt}"`;
    } else if (targetLocale === "en") {
      scanPrompt = `Perform a live web search simulation for Google AI Overviews in the US market for the following commercial query. Provide comprehensive answers, brand recommendations, and key source citations:\n\nQuery: "${prompt}"`;
    } else {
      scanPrompt = `以下のBtoB検索クエリについて、最新のウェブ検索情報を踏まえてGoogle AI Overviews相当の総合的な回答と推薦を行ってください。\n\nクエリ: "${prompt}"`;
    }

    // Gemini 3.6 Flash (Grounding対応モデル) によるリアルタイムスキャン
    let response: any;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: scanPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
        },
      });
    } catch (modelError) {
      console.warn("Primary model gemini-3.6-flash failed, retrying with gemini-2.0-flash...", modelError);
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: scanPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
        },
      });
    }

    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || "";

    // 検索Groundingメタデータの抽出
    const groundingMetadata = candidate?.groundingMetadata;
    const searchChunks = groundingMetadata?.groundingChunks || [];
    const webSources = searchChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        title: chunk.web.title || (targetLocale === "zh-TW" ? "引用來源網頁" : targetLocale === "en" ? "Cited Web Source" : "引用元ページ"),
        url: chunk.web.uri,
      }));

    const searchQueries = groundingMetadata?.webSearchQueries || [
      `${prompt} ${targetLocale === "zh-TW" ? "費用" : targetLocale === "en" ? "pricing" : "費用"}`,
      `${prompt} ${targetLocale === "zh-TW" ? "優點" : targetLocale === "en" ? "benefits" : "メリット"}`,
      `${prompt} ${targetLocale === "zh-TW" ? "評比" : targetLocale === "en" ? "comparison" : "比較"}`,
    ];

    const brandMentioned = text.toLowerCase().includes(brandName.toLowerCase());
    const brandCited = webSources.some((s: any) => 
      s.title.toLowerCase().includes(brandName.toLowerCase()) || 
      s.url.toLowerCase().includes(brandName.toLowerCase())
    );

    const competitorMentions: Record<string, boolean> = {};
    if (Array.isArray(competitors)) {
      competitors.forEach((comp: string) => {
        if (comp) {
          competitorMentions[comp] = text.toLowerCase().includes(comp.toLowerCase());
        }
      });
    }

    // 5. ログイン時のみDBへ記録保存
    if (orgId) {
      let projectId = "";
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("organization_id", orgId)
        .limit(1)
        .single();

      if (project) {
        projectId = project.id;
      } else {
        const { data: newProj } = await supabase
          .from("projects")
          .insert({
            organization_id: orgId,
            name: brandName,
            domain: "https://example.com",
            competitors: competitors,
          })
          .select("id")
          .single();
        projectId = newProj?.id || "";
      }

      if (projectId) {
        const { data: tp } = await supabase
          .from("tracked_prompts")
          .insert({
            project_id: projectId,
            prompt_text: prompt,
            target_locale: targetLocale,
            last_scanned_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (tp?.id) {
          await supabase
            .from("prompt_analysis_logs")
            .insert({
              prompt_id: tp.id,
              ai_overview_present: true,
              brand_mentioned: brandMentioned,
              brand_cited: brandCited,
              raw_response: text,
              fanout_queries: searchQueries,
              citation_sources: webSources,
              competitor_mentions: competitorMentions,
            });
        }
      }
    }

    return NextResponse.json({
      prompt,
      brandName,
      brandMentioned,
      brandCited,
      aiResponse: text,
      fanoutQueries: searchQueries,
      citationSources: webSources,
      competitorMentions,
      creditsRemaining,
    });
  } catch (error: any) {
    console.error("Analysis API Error:", error);
    return NextResponse.json({ error: error.message || "解析中にエラーが発生しました。" }, { status: 500 });
  }
}
