import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid, normalizeObservationLocale } from "@/lib/observation-contract";
export type ObservationSurface = "gemini_api" | "google_aio_serp" | "legacy_unknown";
export type ObservationOutcome = "success" | "failure" | "unmeasured" | "unknown";
export type ScoreVersion = "v1" | "v2";
export interface WriteObservationLogParams {
  logId: string; promptId: string; surface: ObservationSurface; modelName: string;
  scoreVersion: ScoreVersion; locale: string; outcome: ObservationOutcome; measuredAt: string;
  errorCode?: string | null; errorMessage?: string | null;
  targetAtsScore?: number | null; directMentionScore?: number | null; citationDomainScore?: number | null; fanoutCoverageScore?: number | null;
  competitorAtsScores?: Record<string, number | null> | null;
  primarySourceType?: string | null; diagnosticAdvice?: any;
  brandMentioned?: boolean; brandCited?: boolean; rawResponse?: string | null;
  fanoutQueries?: string[]; citationSources?: any[]; competitorMentions?: Record<string, boolean>;
  engine?: string; rank?: number | null; aioStatus?: string; winLoss?: string; aiOverviewPresent?: boolean;
}
function score(value: unknown, max: number): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > max) throw new Error("Invalid finite integer observation score");
  return value;
}
export function buildObservationPayload(p: WriteObservationLogParams) {
  if (!isUuid(p.logId) || !isUuid(p.promptId)) throw new Error("Invalid observation log/prompt UUID");
  if (!["v1", "v2"].includes(p.scoreVersion) || !["gemini_api", "google_aio_serp", "legacy_unknown"].includes(p.surface)
      || !["success", "failure", "unmeasured", "unknown"].includes(p.outcome)) throw new Error("Invalid observation enum");
  if (typeof p.modelName !== "string" || typeof p.locale !== "string") throw new Error("Invalid observation metadata");
  if (typeof p.measuredAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(p.measuredAt) || !Number.isFinite(Date.parse(p.measuredAt)) || new Date(p.measuredAt).toISOString() !== p.measuredAt) throw new Error("Invalid observation timestamp (canonical UTC required)");
  if (p.scoreVersion === "v2" && (p.surface === "legacy_unknown" || ["", "unknown"].includes(p.modelName.trim().toLowerCase()) || p.outcome === "unknown")) throw new Error("Invalid v2 metadata");
  const locale = p.scoreVersion === "v2" ? normalizeObservationLocale(p.locale) : p.locale.trim();
  const successful = p.outcome === "success";
  if (successful && p.targetAtsScore != null && (p.directMentionScore == null || p.citationDomainScore == null || p.fanoutCoverageScore == null || p.targetAtsScore !== p.directMentionScore + p.citationDomainScore + p.fanoutCoverageScore)) throw new Error("Incomplete or inconsistent ATS components");
  const competitors = successful ? Object.fromEntries(Object.entries(p.competitorAtsScores || {}).map(([name, value]) => [name, score(value, 100)])) : {};
  const rank = !successful || p.rank == null ? null : score(p.rank, 100);
  if (rank === 0) throw new Error("Rank must be positive or null");
  const aioStatus = p.aioStatus ?? "not_shown";
  if (!["not_shown", "shown_recommended", "shown_not_recommended"].includes(aioStatus)) throw new Error("Invalid observation status");
  if (!["gemini", "chatgpt", "ai_mode", "perplexity"].includes(p.engine ?? "gemini")) throw new Error("Invalid engine");
  if (!["win", "loss", "draw", "not_applicable"].includes(p.winLoss ?? "not_applicable")) throw new Error("Invalid win/loss status");
  if (p.fanoutQueries !== undefined && (!Array.isArray(p.fanoutQueries) || p.fanoutQueries.some(q => typeof q !== "string"))) throw new Error("Invalid fanout queries");
  const errorCode = !successful ? (p.errorCode || "OBSERVATION_UNAVAILABLE") : null;
  return {
    id: p.logId, prompt_id: p.promptId, surface: p.surface, model_name: p.modelName.trim(), score_version: p.scoreVersion,
    locale, outcome: p.outcome, measured_at: p.measuredAt,
    // Never store arbitrary provider error messages (which may contain request/credential data).
    error_code: errorCode && /^[A-Z0-9_]{1,64}$/.test(errorCode) ? errorCode : null,
    error_message: successful ? null : "Observation unavailable. See protected operational logs.",
    target_ats_score: successful ? score(p.targetAtsScore, 100) : null,
    direct_mention_score: successful ? score(p.directMentionScore, 40) : null,
    citation_domain_score: successful ? score(p.citationDomainScore, 40) : null,
    fanout_coverage_score: successful ? score(p.fanoutCoverageScore, 20) : null,
    competitor_ats_scores: successful ? competitors : {},
    primary_source_type: successful ? p.primarySourceType ?? null : null,
    diagnostic_advice: successful ? p.diagnosticAdvice ?? null : null,
    brand_mentioned: successful && p.brandMentioned === true,
    brand_cited: successful && p.brandCited === true,
    raw_response: successful ? p.rawResponse ?? "" : "", fanout_queries: successful ? p.fanoutQueries ?? [] : [], citation_sources: successful ? p.citationSources ?? [] : [],
    competitor_mentions: successful ? p.competitorMentions ?? {} : {}, engine: p.engine ?? "gemini", rank: successful ? rank : null,
    // Compatibility fields describe response presentation only; surface is authoritative.
    aio_status: successful ? aioStatus : "not_shown", win_loss: successful ? p.winLoss ?? "not_applicable" : "not_applicable",
    ai_overview_present: p.surface === "google_aio_serp" && successful && p.aiOverviewPresent === true,
  };
}
export async function writeObservationLog(supabase: SupabaseClient<any, any, any>, params: WriteObservationLogParams): Promise<{success: boolean; logId?: string; error?: string}> {
  const payload = buildObservationPayload(params);
  try {
    const { data, error } = await supabase.from("prompt_analysis_logs").insert(payload).select("id").single();
    if (error || data?.id !== params.logId) {
      console.error("OBSERVATION_SAVE_FAILED", { logId: params.logId, model: params.modelName });
      return { success: false, logId: params.logId, error: "OBSERVATION_SAVE_FAILED" };
    }
    return { success: true, logId: data.id };
  } catch {
    console.error("OBSERVATION_SAVE_FAILED", { logId: params.logId, model: params.modelName });
    return { success: false, logId: params.logId, error: "OBSERVATION_SAVE_FAILED" };
  }
}
