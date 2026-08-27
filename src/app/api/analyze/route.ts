import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    // 1. 認証チェック
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "ログインが必要です。ログイン後に再度お試しください。" }, 
        { status: 401 }
      );
    }

    // 2. ユーザーの組織とクレジット残高を取得
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, plan, monthly_credits, used_credits")
      .eq("user_id", user.id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "組織情報が見つかりません。サポートへお問い合わせください。" }, 
        { status: 404 }
      );
    }

    // クレジット残高チェック（原価保護・粗利維持）
    if (org.used_credits >= org.monthly_credits) {
      return NextResponse.json(
        { 
          error: "今月の調査クレジット上限に達しました。プランをアップグレードして追加枠を取得してください。",
          upgradeRequired: true,
          currentCredits: org.monthly_credits,
          usedCredits: org.used_credits
        }, 
        { status: 403 }
      );
    }

    const { 
      prompt, 
      brandName = "Ailo", 
      competitors = ["Speak", "プログリット", "DMM英会話", "ビズメイツ"],
      targetLocale = "ja-JP"
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "調査対象のプロンプトを入力してください。" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません。" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 3. Gemini 3.7 Flash + Google Search Grounding によるリアルタイムスキャン
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `以下のBtoB検索クエリについて、最新のウェブ検索情報を踏まえてGoogle AI Overviews相当の総合的な回答と推薦を行ってください。\n\nクエリ: "${prompt}"`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || "";

    // 検索Groundingメタデータの抽出
    const groundingMetadata = candidate?.groundingMetadata;
    const searchChunks = groundingMetadata?.groundingChunks || [];
    const webSources = searchChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        title: chunk.web.title || "引用元ページ",
        url: chunk.web.uri,
      }));

    // 検索クエリ（ファンアウト）の抽出
    const searchQueries = groundingMetadata?.webSearchQueries || [
      `${prompt} 費用`,
      `${prompt} メリット`,
      `${prompt} 比較`,
    ];

    // 自社および競合の言及判定
    const brandMentioned = text.toLowerCase().includes(brandName.toLowerCase());
    const brandCited = webSources.some((s: any) => 
      s.title.toLowerCase().includes(brandName.toLowerCase()) || 
      s.url.toLowerCase().includes(brandName.toLowerCase())
    );

    const competitorMentions: Record<string, boolean> = {};
    competitors.forEach((comp: string) => {
      competitorMentions[comp] = text.toLowerCase().includes(comp.toLowerCase());
    });

    // 4. 実クレジット消費の記録（used_credits + 1）
    await supabase
      .from("organizations")
      .update({ 
        used_credits: org.used_credits + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", org.id);

    // 5. ユーザーのプロジェクト取得または作成
    let projectId = "";
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("organization_id", org.id)
      .limit(1)
      .single();

    if (project) {
      projectId = project.id;
    } else {
      const { data: newProj } = await supabase
        .from("projects")
        .insert({
          organization_id: org.id,
          name: brandName,
          domain: "https://example.com",
          competitors: competitors,
        })
        .select("id")
        .single();
      projectId = newProj?.id || "";
    }

    // 6. 追跡プロンプトおよび解析ログを実DBに保存
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

    return NextResponse.json({
      prompt,
      brandName,
      brandMentioned,
      brandCited,
      aiResponse: text,
      fanoutQueries: searchQueries,
      citationSources: webSources,
      competitorMentions,
      creditsRemaining: org.monthly_credits - (org.used_credits + 1),
    });
  } catch (error: any) {
    console.error("Analysis API Error:", error);
    return NextResponse.json({ error: error.message || "解析中にエラーが発生しました。" }, { status: 500 });
  }
}
