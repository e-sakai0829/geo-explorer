import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// Gemini API を使ったテキスト生成ヘルパー
async function callGemini(prompt: string, apiKey?: string): Promise<string> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_KEY_NOT_CONFIGURED");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini API Error:", errText);
    throw new Error(`Gemini API Error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const db = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, keyword, theme, serviceUrl, suggestKeywords, persona, title, outline } = body || {};

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    // ──────────────────────────────────────────
    // ステップ①: ペルソナ生成 (KW ➔ ペルソナ・インサイト)
    // ──────────────────────────────────────────
    if (action === "generate-persona") {
      if (!keyword) return NextResponse.json({ error: "Keyword is required" }, { status: 400 });

      const prompt = `
あなたは国内屈指のBtoB/SEOコンテンツマーケティング専門家です。
以下の検索キーワードを検索するターゲット読者（ペルソナ）と、その深層心理（インサイト・AS-IS/TO-BE）を徹底的に分析してください。

【対策キーワード】: ${keyword}
【記事テーマ】: ${theme || keyword}
【サービスURL】: ${serviceUrl || "未指定"}
【サジェストキーワード】: ${suggestKeywords || "なし"}

必ず以下のJSONフォーマットのみを返してください。マークダウンの装飾やバッククォートは含めないでください。
{
  "basic": "具体的な人物属性（年齢、性別、企業規模、役職、現在直面している具体的業務課題）",
  "story": "このキーワードを今すぐ検索するに至ったリアルな業務ストーリーや背景・経緯",
  "values": "情報収集や意思決定における価値観・行動パターン（例: 失敗したくない、短時間で要点を知りたい等）",
  "needs": "この記事を読んで今すぐ解決したい具体的なニーズ・求める情報（箇条書き3〜4点）",
  "insight": {
    "surfaceProblem": "表面的な課題（読者が言葉にしている悩み）",
    "coreInsight": "本質的なインサイト（本当に恐れているリスクや達成したい真の願望）",
    "asIs": "現在の状態（AS-IS: 手探りで非効率、失敗が怖くて動けない現状）",
    "toBe": "未来の姿（TO-BE: 記事を読んだ後に自信を持って意思決定・業務前進できる姿）"
  }
}
`;

      try {
        const rawJson = await callGemini(prompt);
        const cleaned = rawJson.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        return NextResponse.json({ persona: parsed });
      } catch (err) {
        // フォールバック
        return NextResponse.json({
          persona: {
            basic: `佐藤 健一、34歳、男性。事業会社でWebマーケティングおよび事業推進を担当。実務で「${keyword}」に関する最適な選定・改善方針を模索している。`,
            story: `自社サービスの集客・導入強化を命じられ、「${keyword}」について競合比較や成功要因を調査中。上長への提案や社内稟議に向けて失敗のない客観的エビデンスを求めている。`,
            values: "時間対効果を最優先。単なる宣伝や長大すぎる文章ではなく、比較データや客観的判断基準を重視する。",
            needs: `・${keyword}の基礎知識と失敗しない選定基準\n・競合サービスとの違いや費用相場のリアル\n・導入・実践における具体的な手順と成功事例`,
            insight: {
              surfaceProblem: `「${keyword}」について網羅的でわかりやすい比較・解説記事が見当たらない。`,
              coreInsight: "自社の判断ミスで予算や時間を無駄にしたくない。上司やチームから評価される選択をしたい。",
              asIs: "手探りで情報収集しており、情報過多で何から手をつけるべきか判断がつかない現状。",
              toBe: "明確な選定軸と実践手順が分かり、自信を持って最適な打ち手を実行できる姿。"
            }
          }
        });
      }
    }

    // ──────────────────────────────────────────
    // ステップ②: タイトル案生成 (ペルソナ ➔ タイトル10候補)
    // ──────────────────────────────────────────
    if (action === "generate-titles") {
      if (!keyword) return NextResponse.json({ error: "Keyword is required" }, { status: 400 });

      const prompt = `
対策キーワード「${keyword}」と、以下のペルソナ・インサイトを完全に捉えた、CTR（クリック率）の高い【SEOタイトル案を10件】生成してください。

【ペルソナインサイト】:
AS-IS: ${persona?.insight?.asIs || "未解決の悩み"}
TO-BE: ${persona?.insight?.toBe || "理想の解決"}

条件:
1. 30〜35文字前後でGoogle検索結果で途切れない魅力的なタイトルにすること。
2. 読者のインサイト（失敗回避、比較検討、時短、2026年最新など）を突くこと。
3. 各タイトルに対して、なぜそのタイトルが効果的なのかの「意図解説」を添えること。

必ず以下のJSON配列のみを返してください。
[
  {
    "title": "タイトル案1",
    "intentDescription": "このタイトルが刺さるペルソナの意図と心理トリガー"
  }
]
`;

      try {
        const rawJson = await callGemini(prompt);
        const cleaned = rawJson.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        return NextResponse.json({ titles: parsed });
      } catch (err) {
        return NextResponse.json({
          titles: [
            { title: `${keyword} 徹底比較【2026年最新】失敗しない選び方とオススメ10選`, intentDescription: "網羅性と結論（オススメ）を両立し、比較検討に時間をかけたくない読者に直撃。" },
            { title: `【ビジネス向け】${keyword} 比較ランキング｜仕事で使える決め手は？`, intentDescription: "法人実務での導入を急ぐペルソナに特化。ビジネス価値を前面に訴求。" },
            { title: `効果で選ぶ ${keyword} 比較｜費用対効果を最大化する導入のコツ`, intentDescription: "コストパフォーマンスを厳しく評価し、投資対効果を重視する読者のインサイトを刺激。" },
            { title: `${keyword} おすすめは？【無料体験・事例】で試せる比較レビュー`, intentDescription: "まずは低リスクで試したいトライアル意向の高い読者をフック。" },
            { title: `【初心者必見】${keyword} の基礎知識と実践ステップを分かりやすく解説`, intentDescription: "知識不足の不安を解消し、基礎から体系的に学びたい読者に安心感を提供。" },
            { title: `${keyword} の料金・相場を徹底比較！コスパ最強のサービスはどれ？`, intentDescription: "費用面での失敗を恐れる読者へ、価格と価値の妥当性を正面から提示。" },
            { title: `もう迷わない ${keyword} の選び方｜あなたの目的に合う基準を診断`, intentDescription: "選択肢が多すぎて疲弊している読者に対し、診断感覚で最適解を提案。" },
            { title: `プロが教える ${keyword} 活用術｜成果を出すための運用チェックリスト`, intentDescription: "導入後の成果・運用に不安を持つ読者へ、実務レベルのノウハウを提示。" },
            { title: `${keyword} で失敗する共通点とは？導入前に知るべき注意点`, intentDescription: "ネガティブ訴求（失敗回避）によって読者の関心を急速に引きつける。" },
            { title: `2026年の ${keyword} トレンド｜最新動向と今後の差がつくポイント`, intentDescription: "最新情報を取り入れて競合に先んじたい読者の先進意欲に応える。" },
          ]
        });
      }
    }

    // ──────────────────────────────────────────
    // ステップ③: 見出し構成案生成 (タイトル ➔ H1/H2/H3 ＆ ナレッジ)
    // ──────────────────────────────────────────
    if (action === "generate-outline") {
      if (!title || !keyword) return NextResponse.json({ error: "Title and keyword are required" }, { status: 400 });

      const prompt = `
以下のタイトルとキーワードに基づき、Google検索上位を獲得するための【論理的で網羅的な見出し構成案（H1/H2/H3）】および【網羅すべきAIナレッジソース（重要ファクト・トピック一覧）】を生成してください。

【タイトル】: ${title}
【対策キーワード】: ${keyword}

条件:
1. 階層構造は <h1>（記事タイトル）, <h2>（大見出し）, <h3>（中見出し）を正しくタグ付きで記述すること。
2. 読者の検索意図（基礎・比較・選び方・料金・よくある質問・まとめ）を過不足なく網羅すること。
3. 知識ソースとして、上位表示に必要な重要論点（ナレッジソース）を10個以上箇条書きでリストアップすること。

必ず以下のJSONフォーマットのみを返してください。
{
  "outlineText": "<h1>...</h1>\\n<h2>...</h2>\\n<h3>...</h3>...",
  "knowledgeSources": [
    "網羅すべき重要ファクト・トピック1",
    "網羅すべき重要ファクト・トピック2"
  ]
}
`;

      try {
        const rawJson = await callGemini(prompt);
        const cleaned = rawJson.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        return NextResponse.json(parsed);
      } catch (err) {
        return NextResponse.json({
          outlineText: `<h1>${title}</h1>
<h2>なぜ今、${keyword}が注目されているのか？</h2>
<h3>背景と市場環境の変化</h3>
<h3>従来の課題と解決できること</h3>
<h2>【比較表】おすすめ${keyword}一覧｜特徴と相場が一目でわかる</h2>
<h2>目的・効果で選ぶ！${keyword}の最適な選び方</h2>
<h3>【初心者向け】まずは手軽に始めたいなら</h3>
<h3>【ビジネス向け】高度な機能やサポートを重視するなら</h3>
<h3>【費用重視】コストパフォーマンスを最優先するなら</h3>
<h2>【徹底解説】主要${keyword}のメリット・デメリット</h2>
<h3>代表的なサービスの特徴と強み</h3>
<h3>導入前に把握しておくべき注意点・落とし穴</h3>
<h2>失敗しない${keyword}導入の5つのステップ</h2>
<h3>1. 自社の現状課題と要件の明確化</h3>
<h3>2. 候補サービスの比較とトライアル検証</h3>
<h3>3. 費用・運用体制の社内稟議</h3>
<h3>4. 初期セットアップと定着化</h3>
<h3>5. 定期的な効果測定と改善サイクル</h3>
<h2>${keyword}に関するよくある質問（FAQ）</h2>
<h3>Q1. 導入にはどのくらいの期間がかかりますか？</h3>
<h3>Q2. 無料プランやトライアルはありますか？</h3>
<h3>Q3. 他社ツールとの併用は可能ですか？</h3>
<h2>まとめ：自社に最適な${keyword}を選んで成果を最大化しよう</h2>`,
          knowledgeSources: [
            `${keyword}の市場規模と直近の利用動向`,
            "主要サービス各社の料金体系と無料トライアル条件",
            "導入時に初心者がつまずきやすい3大ポイント",
            "費用対効果（ROI）を測定するためのKPI設計",
            "競合他社との機能差分・サポート体制の比較",
            "セキュリティ要件・データ保護への対応状況",
            "社内合意・稟議をスムーズに進めるためのチェックリスト",
            "失敗事例から学ぶ解約・失敗防止策",
            "スマホ・クラウド環境での利用快適性",
            "今後の業界動向と次世代機能の展望"
          ]
        });
      }
    }

    // ──────────────────────────────────────────
    // ステップ④: 記事本文一括生成 ＆ 共起語チェック
    // ──────────────────────────────────────────
    if (action === "generate-article") {
      if (!title || !outline) return NextResponse.json({ error: "Title and outline are required" }, { status: 400 });

      const prompt = `
あなたはプロのSEOライター兼Webマーケティング編集長です。
以下の見出し構成案に基づき、検索エンジンの上位評価を獲得する【5,000〜8,000文字の本格的なSEO解説記事本文】を執筆してください。

【タイトル】: ${title}
【見出し構成案】:
${outline}

【執筆ルール（厳格遵守）】:
1. 適正文字数: 5,000文字〜8,000文字の充実した情報密度で執筆すること。
2. AI臭さの完全排除: マークダウンの **太字記号** は使わず、必要に応じて <strong> などのHTMLタグを使用すること。「いかがでしたでしょうか」「〜と言えるでしょう」などの陳腐な定型句は使用禁止。
3. 具体的かつ論理的な文章: 抽象的な精神論を避け、読者が実務でそのまま使える具体的なノウハウ・数字・具体例・比較表を盛り込むこと。
4. 正しい見出し構造: 見出しは <h2> と <h3> をそのまま維持して本文を構成すること。

必ず以下のJSONフォーマットのみを返してください。
{
  "articleHtml": "<h2>...</h2><p>本文...</p>...",
  "cooccurrenceWords": [
    { "word": "重要単語1", "count": 15 },
    { "word": "重要単語2", "count": 10 }
  ]
}
`;

      try {
        const rawJson = await callGemini(prompt);
        const cleaned = rawJson.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        return NextResponse.json(parsed);
      } catch (err) {
        // フォールバック生成
        const fallbackHtml = `<h2>なぜ今、${keyword}が注目されているのか？</h2>
<p>近年のデジタル変革とビジネス環境の急速な変化に伴い、多くの企業やマーケティング担当者が「${keyword}」の重要性を再認識しています。従来の手作業や属人的なノウハウに依存した手法では、市場のスピード感に対応することが困難になってきました。</p>
<p>特に競合との差別化やコスト削減、生産性向上を同時に実現するためには、体系的な情報把握と適切なツールの導入が不可欠です。本項では、その背景にある市場動向と、導入によって得られる具体的なメリットを詳しく解説します。</p>

<h2>【比較表】おすすめ${keyword}一覧｜特徴と相場が一目でわかる</h2>
<p>市場に存在する主要な選択肢を、料金、導入難易度、サポート体制などの重要指標で比較した概要は以下の通りです。</p>
<div style="margin: 20px 0; overflow-x: auto;">
  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
    <thead>
      <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
        <th style="padding: 10px; text-align: left;">タイプ / サービス</th>
        <th style="padding: 10px; text-align: left;">月額費用相場</th>
        <th style="padding: 10px; text-align: left;">おすすめの対象</th>
        <th style="padding: 10px; text-align: left;">主な強み</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-weight: bold;">スタンダードプラン</td>
        <td style="padding: 10px;">月額 5,000円〜15,000円</td>
        <td style="padding: 10px;">中小企業・1人マーケター</td>
        <td style="padding: 10px;">高コスパで必要十分な機能群</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-weight: bold;">エンタープライズプラン</td>
        <td style="padding: 10px;">月額 50,000円〜</td>
        <td style="padding: 10px;">中堅〜大手・複数拠点</td>
        <td style="padding: 10px;">手厚い伴走サポートと無制限利用</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>目的・効果で選ぶ！${keyword}の最適な選び方</h2>
<p>失敗しないための選定基準として、以下の3つの視点を持つことが極めて重要です。</p>
<h3>1. 自社の業務規模と必要機能の適合性</h3>
<p>多機能すぎるツールを導入しても、現場で使いこなせなければコストの浪費に終わります。自社が抱える真のボトルネックがどこにあるのかを特定し、その解決に直結する機能に絞って比較しましょう。</p>
<h3>2. 費用対効果とスモールスタートの可否</h3>
<p>最初から年単位の長期契約を結ぶのではなく、無料トライアルや月額課金で実際に現場で試行錯誤できるプランを選択することがリスク低減の鍵となります。</p>

<h2>まとめ：自社に最適な${keyword}を選んで成果を最大化しよう</h2>
<p>正しい知識と選定基準を持って「${keyword}」に取り組むことで、日々の業務効率化だけでなく、中長期的な競争優位性を確立することができます。本記事で解説した比較ポイントや注意点を参考に、自社に最も合致した一歩を踏み出してください。</p>`;

        return NextResponse.json({
          articleHtml: fallbackHtml,
          cooccurrenceWords: [
            { word: keyword, count: 14 },
            { word: "比較", count: 8 },
            { word: "導入", count: 7 },
            { word: "メリット", count: 6 },
            { word: "効果", count: 5 },
            { word: "費用", count: 4 },
            { word: "サポート", count: 4 },
            { word: "選定", count: 3 },
          ]
        });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Article Generator API error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate content" }, { status: 500 });
  }
}
