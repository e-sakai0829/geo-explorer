import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { runGeminiScan, buildScanPrompt, evaluateScan, DEFAULT_ENGINE } from "@/lib/scan-engine";

// バッチ処理のため静的最適化・レスポンスキャッシュを無効化し、実行時間上限を延長する
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// 1回の起動あたりに処理する最大プロンプト件数（サーバーレス関数のタイムアウト・
// Gemini APIレート制限を考慮した安全上限）。上限を超えた分は次回起動で処理される。
const MAX_PROMPTS_PER_RUN = 50;

/**
 * 週次自動スキャンバッチ。
 * 実務Excel（LLMOモニタリング）の「毎週◯曜日更新」運用をアプリ内で再現する。
 * Vercel Cron から呼び出す想定（vercel.json 参照）。CRON_SECRET が設定されている場合、
 * Vercel Cron は Authorization: Bearer <CRON_SECRET> ヘッダーを自動付与するため、
 * ここで検証することで第三者からの不正起動を防ぐ。
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません。" }, { status: 500 });
  }

  const supabase = createAdminClient();

  const { data: prompts, error: promptsError } = await supabase
    .from("tracked_prompts")
    .select("id, prompt_text, category, target_locale, project_id, check_frequency")
    .neq("check_frequency", "manual")
    .order("last_scanned_at", { ascending: true, nullsFirst: true })
    .limit(MAX_PROMPTS_PER_RUN);

  if (promptsError) {
    console.error("weekly-scan: failed to fetch prompts", promptsError);
    return NextResponse.json({ error: promptsError.message }, { status: 500 });
  }

  if (!prompts || prompts.length === 0) {
    return NextResponse.json({ processed: 0, message: "対象プロンプトがありません。" });
  }

  const projectIds = Array.from(new Set(prompts.map((p) => p.project_id)));
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, domain, competitors")
    .in("id", projectIds);

  const projectMap = new Map((projects || []).map((p) => [p.id, p]));

  const results: Array<{ promptId: string; status: "ok" | "error"; error?: string }> = [];

  // Gemini APIのレート制限を考慮し、並列実行せず順次処理する
  for (const p of prompts) {
    const project = projectMap.get(p.project_id);
    if (!project) {
      results.push({ promptId: p.id, status: "error", error: "project not found" });
      continue;
    }

    try {
      const targetLocale = p.target_locale || "ja";
      const scanPrompt = buildScanPrompt(p.prompt_text, targetLocale);
      const { text, webSources, searchQueries } = await runGeminiScan(scanPrompt, apiKey);

      const evaluation = evaluateScan({
        targetBrand: project.name || "自社ブランド",
        targetDomain: project.domain || "",
        competitors: Array.isArray(project.competitors) ? project.competitors : [],
        scanText: text,
        webSources,
        searchQueries,
      });

      await supabase.from("prompt_analysis_logs").insert({
        prompt_id: p.id,
        ai_overview_present: evaluation.aioStatus !== "not_shown",
        brand_mentioned: evaluation.brandMentioned,
        brand_cited: evaluation.brandCited,
        raw_response: text,
        fanout_queries: searchQueries,
        citation_sources: webSources,
        competitor_mentions: evaluation.competitorMentions,
        target_ats_score: evaluation.ats.targetATS,
        competitor_ats_scores: evaluation.ats.competitorATSMap,
        direct_mention_score: evaluation.ats.targetBreakdown.directMentionScore,
        citation_domain_score: evaluation.ats.targetBreakdown.citationDomainScore,
        fanout_coverage_score: evaluation.ats.targetBreakdown.fanoutCoverageScore,
        primary_source_type: evaluation.ats.diagnosticAdvice.primary_source_type,
        diagnostic_advice: evaluation.ats.diagnosticAdvice,
        engine: DEFAULT_ENGINE,
        rank: evaluation.rank,
        aio_status: evaluation.aioStatus,
        win_loss: evaluation.winLoss,
      });

      await supabase
        .from("tracked_prompts")
        .update({ last_scanned_at: new Date().toISOString() })
        .eq("id", p.id);

      results.push({ promptId: p.id, status: "ok" });
    } catch (err: any) {
      console.error(`weekly-scan: failed for prompt ${p.id}`, err);
      results.push({ promptId: p.id, status: "error", error: err.message });
    }
  }

  const okCount = results.filter((r) => r.status === "ok").length;
  return NextResponse.json({
    processed: results.length,
    succeeded: okCount,
    failed: results.length - okCount,
    results,
  });
}
