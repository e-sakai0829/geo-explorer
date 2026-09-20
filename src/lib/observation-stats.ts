export interface ObservationScope { surface: string; modelName: string; locale: string; promptIds: string[]; periodStart: string; periodEnd: string; }
export interface ObservationRow {
  id: string; prompt_id: string; surface: string; model_name: string; score_version: string; locale: string;
  outcome: string; measured_at: string; target_ats_score: number | null;
  direct_mention_score?: number | null; citation_domain_score?: number | null; fanout_coverage_score?: number | null;
  competitor_ats_scores?: Record<string, number | null>; brand_cited?: boolean; aio_status?: string; rank?: number | null;
  error_code?: string; fanout_queries?: string[]; diagnostic_advice?: any; primary_source_type?: string;
}
const finite = (n: unknown, max = 100): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= max;
const avg = (values: unknown[], max = 100) => {
  const nums = values.filter((n): n is number => finite(n, max));
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
};
const order = (a: ObservationRow, b: ObservationRow) => Date.parse(b.measured_at) - Date.parse(a.measured_at) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
const queries = (r: ObservationRow) => [...new Set((Array.isArray(r.fanout_queries) ? r.fanout_queries : []).filter(q => typeof q === "string").map(q => q.trim()).filter(Boolean))];
export function aggregateObservations(rows: ObservationRow[], scope: ObservationScope) {
  const ids = new Set(scope.promptIds);
  const logs = rows.filter(r => ids.has(r.prompt_id) && r.surface === scope.surface && r.model_name === scope.modelName && r.locale === scope.locale && r.score_version === "v2"
    && ["success", "failure", "unmeasured"].includes(r.outcome) && Number.isFinite(Date.parse(r.measured_at)) && Date.parse(r.measured_at) < Date.parse(scope.periodEnd)).sort(order);
  const groups = new Map<string, ObservationRow[]>();
  logs.forEach(r => {
    if (!groups.has(r.prompt_id)) groups.set(r.prompt_id, []);
    groups.get(r.prompt_id)!.push(r);
  });
  const successes = [...groups.values()].map(group => group.find(r => r.outcome === "success")).filter((r): r is ObservationRow => !!r).sort(order);
  const recentAttemptWarnings = [...groups.values()].filter(group => group[0].outcome !== "success").map(group => ({ hasWarning: true,
    promptId: group[0].prompt_id, outcome: group[0].outcome, measuredAt: group[0].measured_at,
    errorCode: group[0].error_code ?? null, errorMessage: "直近の観測を完了できませんでした。",
    lastSuccessMeasuredAt: group.find(r => r.outcome === "success")?.measured_at ?? null }));
  const periodLogs = logs.filter(r => Date.parse(r.measured_at) >= Date.parse(scope.periodStart));
  const comparisons: Record<string, { selfScore: number; competitorScore: number; sampleCount: number }> = {};
  const names = new Set(successes.flatMap(r => Object.keys(r.competitor_ats_scores || {})));
  names.forEach(name => {
    const paired = successes.filter(r => finite(r.target_ats_score) && finite(r.competitor_ats_scores?.[name]));
    if (paired.length) comparisons[name] = { selfScore: avg(paired.map(r => r.target_ats_score))!, competitorScore: avg(paired.map(r => r.competitor_ats_scores![name]))!, sampleCount: paired.length };
  });
  const top = Object.entries(comparisons).sort((a, b) => b[1].competitorScore - a[1].competitorScore || a[0].localeCompare(b[0]))[0];
  const ranked = successes.filter(r => finite(r.rank) && r.rank > 0);
  const decisive = successes.filter(r => finite(r.target_ats_score) && Object.values(r.competitor_ats_scores || {}).some(n => finite(n)));
  const citationRows = successes.filter(r => typeof r.brand_cited === "boolean");
  const buckets = new Map<string, Map<string, ObservationRow>>();
  periodLogs.filter(r => r.outcome === "success").forEach(r => {
    const d = new Date(r.measured_at); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
    const week = d.toISOString().slice(0, 10);
    if (!buckets.has(week)) buckets.set(week, new Map());
    if (!buckets.get(week)!.has(r.prompt_id)) buckets.get(week)!.set(r.prompt_id, r);
  });
  const latest = successes[0];
  const previous = latest ? groups.get(latest.prompt_id)!.filter(r => r.outcome === "success")[1] : undefined;
  const currentSet = new Set(latest ? queries(latest) : []), previousSet = new Set(previous ? queries(previous) : []);
  return {
    hasScanData: successes.length > 0, surface: scope.surface, modelName: scope.modelName, scoreVersion: "v2", locale: scope.locale,
    periodStart: scope.periodStart, periodEnd: scope.periodEnd, atsScore: avg(successes.map(r => r.target_ats_score)),
    successfulPromptCount: successes.length, validScoreCount: successes.filter(r => finite(r.target_ats_score)).length,
    competitorTopAtsScore: top?.[1].competitorScore ?? null, comparisonSelfAtsScore: top?.[1].selfScore ?? null, comparisonSampleCount: top?.[1].sampleCount ?? 0,
    competitorScores: Object.fromEntries(Object.entries(comparisons).map(([name, value]) => [name, value.competitorScore])), comparisons,
    atsBreakdown: successes.length ? { directMentionScore: avg(successes.map(r => r.direct_mention_score), 40), citationDomainScore: avg(successes.map(r => r.citation_domain_score), 40), fanoutCoverageScore: avg(successes.map(r => r.fanout_coverage_score), 20) } : null,
    citationRate: citationRows.length ? citationRows.filter(r => r.brand_cited).length / citationRows.length : null,
    domainCoverageRate: citationRows.length ? citationRows.filter(r => r.brand_cited).length / citationRows.length : null,
    vsPromptWinRate: decisive.length ? decisive.filter(r => r.target_ats_score! > Math.max(...Object.values(r.competitor_ats_scores || {}).filter((n): n is number => finite(n)))).length / decisive.length : null,
    avgRank: ranked.length ? Math.round(ranked.reduce((sum, r) => sum + r.rank!, 0) / ranked.length * 10) / 10 : null,
    failureRate: periodLogs.length ? periodLogs.filter(r => r.outcome === "failure").length / periodLogs.length : null,
    recordedAttemptCount: periodLogs.length, unmeasuredCount: periodLogs.filter(r => r.outcome === "unmeasured").length,
    recentAttemptWarnings, recentAttemptWarning: recentAttemptWarnings[0] ?? null,
    diagnosticAdvice: latest?.diagnostic_advice ?? null, primarySourceType: latest?.primary_source_type ?? null, fanoutQueries: [...currentSet],
    fanoutDiff: latest && previous ? { promptId: latest.prompt_id, currentMeasuredAt: latest.measured_at, previousMeasuredAt: previous.measured_at,
      added: [...currentSet].filter(q => !previousSet.has(q)), kept: [...currentSet].filter(q => previousSet.has(q)), dropped: [...previousSet].filter(q => !currentSet.has(q)), previousCount: previousSet.size, currentCount: currentSet.size } : null,
    trend: [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, bucket]) => {
      const rs = [...bucket.values()];
      return { periodLabel: week, periodStart: week, geminiRecommendRate: rs.filter(r => r.aio_status === "shown_recommended").length / rs.length,
        chatgptRecommendRate: null, competitorAvgRecommendRate: null, promptTotalCount: rs.length, atsScore: avg(rs.map(r => r.target_ats_score)),
        validScoreCount: rs.filter(r => finite(r.target_ats_score)).length, avgRank: null, domainCoverageRate: null, vsPromptWinRate: null };
    }),
  };
}
