import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { prompt, targetBrand = "Ailo", competitorBrands = ["Speak", "プログリット", "DMM英会話", "ミエルカ"] } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "プロンプトを指定してください。" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません。" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Search Grounding 実行
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text || "";
    let fanoutQueries: string[] = [];
    let citations: Array<{ title: string; url: string; domain: string }> = [];

    const candidate = response.candidates?.[0];
    if (candidate?.groundingMetadata) {
      const gm = candidate.groundingMetadata;
      fanoutQueries = (gm.webSearchQueries as string[]) || [];

      if (gm.groundingChunks) {
        citations = gm.groundingChunks.map((chunk: any) => {
          const uri = chunk.web?.uri || "";
          let domain = "";
          try {
            domain = new URL(uri).hostname;
          } catch {
            domain = uri;
          }
          return {
            title: chunk.web?.title || domain,
            url: uri,
            domain: domain,
          };
        });
      }
    }

    // ブランド言及の判定
    const targetMentioned = rawText.toLowerCase().includes(targetBrand.toLowerCase());
    const mentionedCompetitors = competitorBrands.filter((c: string) => 
      c.trim() && rawText.toLowerCase().includes(c.toLowerCase())
    );

    // ギャップ判定
    let gapStatus = "中立";
    if (targetMentioned) {
      gapStatus = "自社言及あり（優良）";
    } else if (mentionedCompetitors.length > 0) {
      gapStatus = "要対策（競合のみ言及）";
    }

    // 奪取難易度 (LLM-Difficulty: 1〜100) の簡易算定
    // 公式ドメインや大手（.go.jp, wikipedia, 大手ポータル）が多いほど難易度が高く、ブログや一般サイトが多いほど低く算定
    let difficultyScore = 45;
    const hasGov = citations.some(c => c.domain.includes(".go.jp") || c.domain.includes(".ac.jp"));
    const hasWiki = citations.some(c => c.domain.includes("wikipedia.org"));
    if (hasGov) difficultyScore += 30;
    if (hasWiki) difficultyScore += 15;
    if (citations.length < 5) difficultyScore -= 15;
    difficultyScore = Math.max(15, Math.min(95, difficultyScore));

    // トピック抽出
    const topics: string[] = [];
    const lines = rawText.split("\n");
    for (const line of lines) {
      const clean = line.trim();
      if (clean.startsWith("###") || clean.startsWith("##") || clean.startsWith("【") || clean.match(/^[1-5]\./)) {
        topics.push(clean.replace(/[#*【】]/g, "").trim());
      }
    }

    return NextResponse.json({
      prompt,
      rawText,
      fanoutQueries,
      citations,
      targetBrand,
      targetMentioned,
      mentionedCompetitors,
      gapStatus,
      difficultyScore,
      topics: topics.slice(0, 6),
      analyzedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: error.message || "分析処理中にエラーが発生しました。" }, { status: 500 });
  }
}
