import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { runGeminiScan, buildScanPrompt, evaluateScan, DEFAULT_ENGINE } from "@/lib/scan-engine";

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

    let orgObj: any = null;

    // ユーザーの組織情報を取得
    const { data: org } = await supabase
      .from("organizations")
      .select("id, plan, monthly_credits, used_credits")
      .eq("user_id", user.id)
      .single();

    if (org) {
      orgObj = org;
      // 事前のクレジット上限チェック（消費はまだ行わない）
      if (org.used_credits >= org.monthly_credits) {
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
    }

    const {
      prompt,
      brandName = "自社ブランド",
      competitors = [],
      targetLocale = "ja",
      category = "未分類",
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "調査対象のプロンプトを入力してください。" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません。" }, { status: 500 });
    }

    // プロジェクトの登録ドメイン（自社サイト直接引用の判定に使用）
    let targetDomain = "";
    if (orgObj) {
      const { data: projectForDomain } = await supabase
        .from("projects")
        .select("domain")
        .eq("organization_id", orgObj.id)
        .limit(1)
        .single();
      targetDomain = projectForDomain?.domain || "";
    }

    const scanPrompt = buildScanPrompt(prompt, targetLocale);
    const { text, webSources, searchQueries: groundedQueries } = await runGeminiScan(scanPrompt, apiKey);

    const searchQueries = groundedQueries.length > 0 ? groundedQueries : [
      `${prompt} ${targetLocale === "zh-TW" ? "費用" : targetLocale === "en" ? "pricing" : "費用"}`,
      `${prompt} ${targetLocale === "zh-TW" ? "優點" : targetLocale === "en" ? "benefits" : "メリット"}`,
      `${prompt} ${targetLocale === "zh-TW" ? "評比" : targetLocale === "en" ? "comparison" : "比較"}`,
    ];

    // 共通エンジンでの評価（ATSスコア・順位推定・AIO表出状態・勝敗判定を一元計算）
    const evaluation = evaluateScan({
      targetBrand: brandName,
      targetDomain,
      competitors: Array.isArray(competitors) ? competitors : [],
      scanText: text,
      webSources,
      searchQueries,
    });

    const { brandMentioned, brandCited, competitorMentions, rank, aioStatus, winLoss, ats } = evaluation;

    // 5. AIスキャン成功後のみ、アトミックにクレジットを消費してログ記録
    if (orgObj) {
      orgId = orgObj.id;
      const { data: creditConsumed } = await supabase.rpc("consume_credit", { org_id: orgObj.id });
      creditsRemaining = Math.max(0, orgObj.monthly_credits - (orgObj.used_credits + 1));

      let projectId = "";
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("organization_id", orgObj.id)
        .limit(1)
        .single();

      if (project) {
        projectId = project.id;
      } else {
        const { data: newProj } = await supabase
          .from("projects")
          .insert({
            organization_id: orgObj.id,
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
            category,
            last_scanned_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (tp?.id) {
          await supabase
            .from("prompt_analysis_logs")
            .insert({
              prompt_id: tp.id,
              ai_overview_present: aioStatus !== "not_shown",
              brand_mentioned: brandMentioned,
              brand_cited: brandCited,
              raw_response: text,
              fanout_queries: searchQueries,
              citation_sources: webSources,
              competitor_mentions: competitorMentions,
              target_ats_score: ats.targetATS,
              competitor_ats_scores: ats.competitorATSMap,
              direct_mention_score: ats.targetBreakdown.directMentionScore,
              citation_domain_score: ats.targetBreakdown.citationDomainScore,
              fanout_coverage_score: ats.targetBreakdown.fanoutCoverageScore,
              primary_source_type: ats.diagnosticAdvice.primary_source_type,
              diagnostic_advice: ats.diagnosticAdvice,
              engine: DEFAULT_ENGINE,
              rank,
              aio_status: aioStatus,
              win_loss: winLoss,
            });
        }
      }
    }

    // 5. GEO専門コンサルタントによる自動診断＆対策アドバイスの構築
    const consultantAdvice = {
      overallDiagnosis: brandMentioned 
        ? `ブランド「${brandName}」はAIのナレッジ空間で正しく認知・推薦されており、検索ニーズとのポジショニングは良好です。` 
        : `ブランド「${brandName}」はAI回答内で十分認知されていません。「${prompt}」に関連する自社の強みをAIに学ばせるコンテンツ強化が必要です。`,
      citationStrategy: brandCited
        ? `【良好】公式ドメインが直接参照元（Web Card）として獲得できています。現在のAEO構造を維持・拡張してください。`
        : `【要対策】AI回答内でブランドが言及されているものの、参照元Webカードは他社メディア（ニュース・比較サイト等）が占有しています。自社サイト内に「AIが直答として抽出できる構造化コンテンツ」を掲載し、引用枠を奪還してください。`,
      actionPillars: [
        {
          title: "1. 一次情報構造＆基本SEOの徹底",
          desc: "自社サイトに「JSON-LD構造化データ (Organization, FAQPage)」を導入し、AIクローラーが自社の専門性を正しく解析できるセマンティックHTML（H2/H3）を徹底します。"
        },
        {
          title: "2. 比較サイト・外部メディアへのサイテーション露出",
          desc: "AIは自社サイトだけでなく第三者メディアの言及を重視します。業界比較サイト（無料掲載含む）、PR TIMES、NewsPicks等への出稿努力を行い、外部露出（サイテーション）を増やします。"
        },
        {
          title: "3. AEO直答（Direct Answer）Q&Aフォーマットの導入",
          desc: "コンテンツの見出しを「Q. 〜とは？」等の自然言語の問い形式にし、その直下に「35〜65文字の結論・定義（即答）」を配置してAI Overviewsへの直接引用率を最大化します。"
        },
        {
          title: "4. 構造化テーブル（表）による比較データの提示",
          desc: "サービスの特徴・価格・強みを段落文章だけでなく「1行HTML/Markdownテーブル（表）」として整理し、AIが機械的に比較カード化しやすい構造にします。"
        }
      ]
    };

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
      consultantAdvice,
      rank,
      aioStatus,
      winLoss,
      ats: {
        targetATS: ats.targetATS,
        breakdown: ats.targetBreakdown,
        competitorATSMap: ats.competitorATSMap,
        diagnosticAdvice: ats.diagnosticAdvice,
      },
    });
  } catch (error: any) {
    console.error("Analysis API Error:", error);
    return NextResponse.json({ error: error.message || "解析中にエラーが発生しました。" }, { status: 500 });
  }
}
