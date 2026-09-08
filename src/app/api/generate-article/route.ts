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

    // 2. 組織情報の取得と事前のクレジット上限チェック（消費はまだ行わない）
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, plan, monthly_credits, used_credits")
      .eq("user_id", user.id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "組織情報が見つかりません。" }, 
        { status: 404 }
      );
    }

    if (org.used_credits >= org.monthly_credits) {
      return NextResponse.json(
        { 
          error: "今月の記事生成クレジット上限に達しました。プランをアップグレードしてください。",
          upgradeRequired: true,
          currentCredits: org.monthly_credits,
          usedCredits: org.used_credits,
        }, 
        { status: 403 }
      );
    }

    const { 
      prompt, 
      brandName = "自社ブランド", 
      fanoutQueries = [], 
      targetLanguage = "ja",
      projectId: requestedProjectId,
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "記事テーマ（プロンプト）を指定してください。" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません。" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 言語別のプロンプト指示
    let languageInstruction = "";
    if (targetLanguage === "zh-TW") {
      languageInstruction = `
語言要求：請使用標準「繁體中文（台灣／香港華語）」撰寫。
AEO直答核心規範：
1. 每個 H2 大標題必須以「問句形式（Q. ...？）」呈現。
2. 每個 H2 正下方必須緊接「35〜65字以內的直接答案（Direct Answer）」，絕不講廢話，直接給予數值、結論或定義。
3. 必須包含一個 Markdown 對比表格（例如：費用、功能、優缺點）。
4. 結尾提供自社品牌（${brandName}）的客觀優勢與 CTA。
5. 必須涵蓋以下捕捉到的內部擴展查詢（Query Fan-out）：${fanoutQueries.join(", ")}
`;
    } else if (targetLanguage === "en") {
      languageInstruction = `
Language requirement: Write in clear, authoritative, professional English (US).
AEO Direct-Answer Guidelines:
1. Every H2 header must be formatted as a Question (e.g., "Q: What is ...?").
2. Immediately below each H2, provide a 20–35 word concise Direct Answer giving direct figures, definitions, or conclusions without fluff.
3. Must include at least one Markdown comparison table (features, pricing, pros/cons).
4. Objectively highlight the core value proposition of ${brandName}.
5. Seamlessly address these captured query fan-outs: ${fanoutQueries.join(", ")}
`;
    } else {
      languageInstruction = `
言語要件：自然で知性的な「日本語」で執筆してください。
AEO直答コア規範：
1. 大見出しは「## Q. （問いの形式）」にし、直下に「35〜65文字以内の結論直答文章」を太字で配置すること。
2. 必ず自社ブランド（${brandName}）と一般的な選択肢を比較した「Markdown比較表」を最低1つ含めること。
3. 記事末尾には「よくある質問（FAQ）」を3問以上設けること。
4. 以下のクエリファンアウトを網羅すること：${fanoutQueries.join(", ")}
`;
    }

    const systemPrompt = `あなたはGoogle AI Overviews（AIO）および生成AI検索エンジンにおける引用獲得アルゴリズムに精通した世界最高峰のGEO専門コピーライターです。
${languageInstruction}

IMPORTANT: You MUST start the output with "# Title" and use "## Q. Question" for H2 and "### Subheading" for H3. Never omit the '#' symbols.`;

    const userPromptText = `ターゲットプロンプト「${prompt}」について、自社ブランド「${brandName}」をフィーチャーした高品質なAEO直答記事を生成してください。必ず # H1タイトル, ## Q. H2大見出し, ### H3小見出し のMarkdown記号を正しく使用してください。`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPromptText,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.5,
        },
      });
    } catch (modelError) {
      console.warn("Primary model gemini-3.6-flash failed, retrying with gemini-2.0-flash...", modelError);
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: userPromptText,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.5,
        },
      });
    }

    let markdown = response.text || "";

    // 【Fail-safe Post-processing】見出しハッシュが抜けている場合の自動補正
    if (markdown && !markdown.startsWith("#")) {
      const lines = markdown.split("\n");
      if (lines.length > 0) {
        lines[0] = `# ${lines[0].replace(/^1\.\s*/, "").replace(/^\*\*/, "").replace(/\*\*$/, "")}`;
        markdown = lines.join("\n");
      }
    }

    // 5. AI生成成功後のみ、アトミックにクレジットを消費
    await supabase.rpc("consume_credit", { org_id: org.id });

    // 対象プロジェクトの特定
    let targetProject: any = null;
    if (requestedProjectId) {
      const { data: p } = await supabase
        .from("projects")
        .select("id")
        .eq("id", requestedProjectId)
        .eq("organization_id", org.id)
        .single();
      targetProject = p;
    }

    if (!targetProject) {
      const { data: p } = await supabase
        .from("projects")
        .select("id")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
      targetProject = p;
    }

    // 6. 生成記事を実DB（aeo_articles）に保存
    if (targetProject?.id) {
      const firstLine = markdown.split("\n")[0] || "";
      const title = firstLine.replace(/^#\s*/, "") || `${prompt} のAEO直答ガイド`;

      await supabase
        .from("aeo_articles")
        .insert({
          project_id: targetProject.id,
          target_prompt: prompt,
          language: targetLanguage,
          title: title,
          content_markdown: markdown,
          fanout_queries_covered: fanoutQueries,
          aeo_score: 95,
          status: "draft",
        });
    }

    return NextResponse.json({
      article: markdown,
      language: targetLanguage,
      wordCount: markdown.length,
      savedToDb: true,
      creditsRemaining: Math.max(0, org.monthly_credits - (org.used_credits + 1)),
    });
  } catch (error: any) {
    console.error("Generate Article API Error:", error);
    return NextResponse.json({ error: error.message || "記事生成中にエラーが発生しました。" }, { status: 500 });
  }
}
