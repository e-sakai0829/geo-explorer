import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { prompt, fanoutQueries = [], targetBrand = "Ailo", competitorBrands = [], rawAnalysis = "" } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "プロンプトを指定してください。" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません。" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
あなたは国内屈指のSEO/AEO（回答エンジン最適化）コンテンツ設計エンジニアです。
ユーザーが指定したテーマ・プロンプトに対して、Google AI Overviews (AIO) や ChatGPT、Perplexity などのLLM検索エンジンに最も引用・推薦されやすい「AEO直答記事」のドラフトを作成してください。

### 【絶対に厳守すべきAEO記事の6大執筆ルール】
1. **問い形式の見出し（H2・H3）**:
   見出しは体言止め（名詞止め）を禁止し、「〜とは？」「なぜ〜なのか？」「おすすめの選び方は？」などの読者の具体的な検索インテントに即した「問い形式」で統一する。
2. **見出し直後の35〜65文字直答（最重要）**:
   各H2/H3見出しの直下には、前置きを一切挟まず、**全角35文字以上65文字以内**で問いに対する結論を直答（ダイレクトアンサー）として太字（または明確な1文）で配置すること。
3. **指示語（これ・それ）の完全排除**:
   LLMがチャンク単位で情報抽出できるよう、段落冒頭での「これらは」「そのため」などの指示語を排除し、主語（固有名詞）を明記する。
4. **比較・条件分岐の完全テーブル（表）化**:
   ツールの比較、料金、メリット・デメリット、推奨ターゲットなどの比較項目は、文章でダラダラ書かず、Markdownテーブル（表）で一目でわかるように整理する。
5. **クエリファンアウトの完全網羅**:
   AIが内部展開したサブクエリ（${fanoutQueries.join(" / ")}）のトピックをすべてH2/H3で網羅する。
6. **自社ブランド（${targetBrand}）の自然かつ客観的な言及**:
   一人称（私、弊社）を使わず、冷静な第三者視点・客観的分析者として${targetBrand}の強みや特徴を比較表および解説に自然に組み込む。

### 出力フォーマット
Markdown形式で記事全文（タイトル、メタディスクリプション、H2/H3見出し、35-65文字直答、比較表、本文）を出力してください。
`;

    const userMessage = `
【対策プロンプト】: ${prompt}
【自社ブランド名】: ${targetBrand}
【競合ブランド】: ${competitorBrands.join(", ")}
【AIが内部展開したサブクエリ（ファンアウト）】:
${fanoutQueries.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}

【AI検索の現状分析】:
${rawAnalysis.slice(0, 800)}

上記ルールを100%遵守し、AIに選ばれる最高のAEO記事ドラフトを生成してください。
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\n" + userMessage }] }
      ],
    });

    const articleMarkdown = response.text || "";

    // 簡易的なAEO適合スコアの算定 (100点満点)
    let aeoScore = 80;
    if (articleMarkdown.includes("|") && articleMarkdown.includes("---")) aeoScore += 10; // テーブルあり
    if (articleMarkdown.includes("？") || articleMarkdown.includes("?")) aeoScore += 5; // 問い形式見出し
    if (articleMarkdown.includes(targetBrand)) aeoScore += 5;

    return NextResponse.json({
      prompt,
      articleMarkdown,
      aeoScore: Math.min(100, aeoScore),
      generatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Article generation error:", error);
    return NextResponse.json({ error: error.message || "記事生成中にエラーが発生しました。" }, { status: 500 });
  }
}
