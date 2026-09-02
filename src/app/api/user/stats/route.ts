import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { DashboardStats, MonthlyLLMReport } from "@/types/geo";

interface DashboardStatsWithBreakdown extends DashboardStats {
  atsBreakdown: { directMentionScore: number; citationDomainScore: number; fanoutCoverageScore: number } | null;
}

const EMPTY_STATS: DashboardStatsWithBreakdown = {
  hasScanData: false,
  atsScore: null,
  competitorTopAtsScore: null,
  citationRate: null,
  vsPromptWinRate: null,
  avgRank: null,
  domainCoverageRate: null,
  trend: [],
  atsBreakdown: null,
};

/** 日付から ISO週（月曜始まり）のラベル（週の月曜日 YYYY-MM-DD）を求める */
function weekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay(); // 0=Sun
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  return monday.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(EMPTY_STATS);
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!org) return NextResponse.json(EMPTY_STATS);

    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .eq("organization_id", org.id);

    if (!projects || projects.length === 0) return NextResponse.json(EMPTY_STATS);
    const projectIds = projects.map((p) => p.id);

    const { data: prompts } = await supabase
      .from("tracked_prompts")
      .select("id")
      .in("project_id", projectIds);

    if (!prompts || prompts.length === 0) return NextResponse.json(EMPTY_STATS);
    const promptIds = prompts.map((p) => p.id);

    const { data: logs } = await supabase
      .from("prompt_analysis_logs")
      .select(
        "prompt_id, engine, brand_cited, competitor_mentions, target_ats_score, competitor_ats_scores, rank, aio_status, win_loss, scanned_at, direct_mention_score, citation_domain_score, fanout_coverage_score"
      )
      .in("prompt_id", promptIds)
      .order("scanned_at", { ascending: true });

    if (!logs || logs.length === 0) return NextResponse.json(EMPTY_STATS);

    // ATSスコア（直近最大20件の平均。null/未算出は除外）
    const recentAts = logs
      .slice(-20)
      .map((l) => l.target_ats_score)
      .filter((v): v is number => typeof v === "number" && v > 0);
    const atsScore = recentAts.length > 0
      ? Math.round(recentAts.reduce((a, b) => a + b, 0) / recentAts.length)
      : null;

    const avg = (vals: (number | null | undefined)[]): number => {
      const nums = vals.filter((v): v is number => typeof v === "number");
      return nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
    };
    const recentLogsForBreakdown = logs.slice(-20);
    const atsBreakdown = recentAts.length > 0
      ? {
          directMentionScore: avg(recentLogsForBreakdown.map((l) => l.direct_mention_score)),
          citationDomainScore: avg(recentLogsForBreakdown.map((l) => l.citation_domain_score)),
          fanoutCoverageScore: avg(recentLogsForBreakdown.map((l) => l.fanout_coverage_score)),
        }
      : null;

    let competitorTopAtsScore: number | null = null;
    logs.slice(-20).forEach((l) => {
      const map = (l.competitor_ats_scores || {}) as Record<string, number>;
      Object.values(map).forEach((v) => {
        if (typeof v === "number" && (competitorTopAtsScore === null || v > competitorTopAtsScore)) {
          competitorTopAtsScore = v;
        }
      });
    });

    const citationRate = logs.filter((l) => l.brand_cited).length / logs.length;

    const decisiveLogs = logs.filter((l) => l.win_loss === "win" || l.win_loss === "loss" || l.win_loss === "draw");
    const vsPromptWinRate = decisiveLogs.length > 0
      ? decisiveLogs.filter((l) => l.win_loss === "win").length / decisiveLogs.length
      : null;

    const rankedLogs = logs.filter((l): l is typeof l & { rank: number } => typeof l.rank === "number" && l.rank > 0);
    const avgRank = rankedLogs.length > 0
      ? Math.round((rankedLogs.reduce((a, b) => a + b.rank, 0) / rankedLogs.length) * 10) / 10
      : null;

    const promptIdsWithCitation = new Set(logs.filter((l) => l.brand_cited).map((l) => l.prompt_id));
    const promptIdsScanned = new Set(logs.map((l) => l.prompt_id));
    const domainCoverageRate = promptIdsScanned.size > 0
      ? promptIdsWithCitation.size / promptIdsScanned.size
      : null;

    // 週次トレンド集計
    const weekMap = new Map<string, { gemini: boolean[]; chatgpt: boolean[]; competitor: boolean[] }>();
    logs.forEach((l) => {
      const wk = weekLabel(l.scanned_at);
      if (!weekMap.has(wk)) weekMap.set(wk, { gemini: [], chatgpt: [], competitor: [] });
      const bucket = weekMap.get(wk)!;
      const recommended = l.aio_status === "shown_recommended";
      if (l.engine === "chatgpt") bucket.chatgpt.push(recommended);
      else bucket.gemini.push(recommended);

      const compMentions = Object.values((l.competitor_mentions || {}) as Record<string, boolean>);
      compMentions.forEach((m) => bucket.competitor.push(!!m));
    });

    const rate = (arr: boolean[]): number | null =>
      arr.length > 0 ? arr.filter(Boolean).length / arr.length : null;

    const trend: MonthlyLLMReport[] = Array.from(weekMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([wk, bucket]) => ({
        periodLabel: wk,
        periodStart: wk,
        geminiRecommendRate: rate(bucket.gemini),
        chatgptRecommendRate: rate(bucket.chatgpt),
        competitorAvgRecommendRate: rate(bucket.competitor),
        promptTotalCount: bucket.gemini.length + bucket.chatgpt.length,
        avgRank: null,
        domainCoverageRate: null,
        vsPromptWinRate: null,
      }));

    const stats: DashboardStatsWithBreakdown = {
      hasScanData: true,
      atsScore,
      competitorTopAtsScore,
      citationRate,
      vsPromptWinRate,
      avgRank,
      domainCoverageRate,
      trend,
      atsBreakdown,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Stats API Error:", error);
    return NextResponse.json(EMPTY_STATS);
  }
}
