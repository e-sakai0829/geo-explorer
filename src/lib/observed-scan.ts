import type { SupabaseClient } from "@supabase/supabase-js";
import { buildScanPrompt, evaluateScan, runGeminiScan, type ScanEvaluationResult } from "@/lib/scan-engine";
import { writeObservationLog } from "@/lib/observation-writer";
import { isUuid, normalizeObservationLocale } from "@/lib/observation-contract";

export async function requireObservationSchema(db: SupabaseClient) {
  const { error } = await db.from("prompt_analysis_logs").select("id,surface,model_name,score_version,locale,outcome,measured_at").limit(0);
  if (error) throw new Error("OBSERVATION_SCHEMA_UNAVAILABLE");
}
export async function executeObservedScan(db: SupabaseClient, input: {
  promptId: string; prompt: string; targetBrand: string; targetDomain: string; competitors: string[]; locale: string; apiKey: string;
  competitorDomains?: Record<string, string>;
}) {
  if (!isUuid(input.promptId)) throw new Error("INVALID_PROMPT_ID");
  const locale = normalizeObservationLocale(input.locale);
  let evaluation: ScanEvaluationResult | undefined;
  let outcome: "success" | "unmeasured" = "unmeasured";
  const raw = await runGeminiScan(buildScanPrompt(input.prompt, locale), input.apiKey, async attempt => {
    const base = { logId: attempt.logId, promptId: input.promptId, surface: "gemini_api" as const,
      modelName: attempt.modelName, scoreVersion: "v2" as const, locale, measuredAt: attempt.measuredAt };
    let result;
    if (!attempt.raw) result = await writeObservationLog(db, { ...base, outcome: "failure", errorCode: attempt.errorCode });
    else {
      evaluation = evaluateScan({ targetBrand: input.targetBrand, targetDomain: input.targetDomain, competitors: input.competitors,
        competitorDomains: input.competitorDomains, scanText: attempt.raw.text, webSources: attempt.raw.webSources, searchQueries: attempt.raw.searchQueries });
      outcome = attempt.raw.text.trim() ? "success" : "unmeasured";
      const e = evaluation;
      result = await writeObservationLog(db, { ...base, outcome, errorCode: outcome === "unmeasured" ? "NO_OBSERVATION" : null,
        brandMentioned: e.brandMentioned, brandCited: e.brandCited, rawResponse: attempt.raw.text,
        fanoutQueries: attempt.raw.searchQueries, citationSources: attempt.raw.webSources, competitorMentions: e.competitorMentions,
        targetAtsScore: e.ats.targetATS, competitorAtsScores: e.ats.competitorATSMap,
        directMentionScore: e.ats.targetBreakdown.directMentionScore, citationDomainScore: e.ats.targetBreakdown.citationDomainScore,
        fanoutCoverageScore: e.ats.targetBreakdown.fanoutCoverageScore,
        primarySourceType: e.ats.diagnosticAdvice.primary_source_type, diagnosticAdvice: e.ats.diagnosticAdvice,
        rank: e.rank, aioStatus: e.aioStatus, winLoss: e.winLoss,
      });
    }
    if (!result.success) throw new Error("OBSERVATION_SAVE_FAILED");
  });
  return { raw, evaluation: evaluation!, outcome: outcome as "success" | "unmeasured", locale };
}
