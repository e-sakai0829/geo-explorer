import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { 
      prompt, 
      brandName = "Ailo", 
      fanoutQueries = [], 
      targetLanguage = "ja" 
    } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません。" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 言語別のプロンプト生成指示
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
AEO直答ライティング規則：
1. 各H2見出しは必ず「問い形式（Q. 〜とは？ / 〜の相場は？）」にする。
2. 各H2の直下に必ず「35〜65文字以内の結論直答（Direct Answer）」を配置する（前置きなしで結論・数値を即答）。
3. 記事内に必ず1つ以上のMarkdown比較表（料金、機能、メリット比較）を含める。
4. 自社ブランド（${brandName}）の優位性を客観的に提示する。
5. 以下のクエリファンアウト（AI内部展開サブクエリ）を網羅する：${fanoutQueries.join(", ")}
`;
    }

    const systemPrompt = `
You are an elite AEO (Answer Engine Optimization) & LLMO Content Architect.
Your mission is to generate high-authority structured content designed to be cited and recommended by Google AI Overviews, Gemini, and ChatGPT.

${languageInstruction}

Format the output in clean, valid Markdown.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate an authoritative AEO article for target topic: "${prompt}" focusing on brand "${brandName}".`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const markdown = response.text || "";

    return NextResponse.json({
      article: markdown,
      language: targetLanguage,
      wordCount: markdown.length,
    });
  } catch (error: any) {
    console.error("Generate Article API Error:", error);
    return NextResponse.json({ error: error.message || "記事生成中にエラーが発生しました。" }, { status: 500 });
  }
}
