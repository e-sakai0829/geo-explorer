import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { aggregateObservations, type ObservationRow } from "@/lib/observation-stats";
import { isUuid, normalizeObservationLocale, OBSERVATION_MODELS } from "@/lib/observation-contract";

// Supabase defaults to a bounded result set: every query must page before aggregation.
async function allRows(makeQuery: () => any): Promise<any[]> {
  const rows: any[] = [];
  for (let start = 0; start < 20000; start += 500) {
    const { data, error } = await makeQuery().range(start, start + 499);
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error("DATABASE_UNAVAILABLE");
    rows.push(...data);
    if (data.length < 500) return rows;
  }
  throw new Error("OBSERVATION_SCOPE_TOO_LARGE");
}
export async function GET(req: NextRequest) {
  try {
    const db = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const q = req.nextUrl.searchParams;
    const projectId = q.get("projectId") || q.get("project");
    const modelName = q.get("model") || OBSERVATION_MODELS[0];
    let locale;
    try { locale = normalizeObservationLocale(q.get("locale") || "ja-JP"); } catch { return NextResponse.json({ error: "Invalid locale" }, { status: 400 }); }
    if (!isUuid(projectId) || (q.get("surface") && q.get("surface") !== "gemini_api") || (q.get("scoreVersion") && q.get("scoreVersion") !== "v2") || !(OBSERVATION_MODELS as readonly string[]).includes(modelName))
      return NextResponse.json({ error: "Invalid observation scope" }, { status: 400 });
    const { data: org, error: orgError } = await db.from("organizations").select("id").eq("user_id", user.id).maybeSingle();
    if (orgError) throw orgError;
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 403 });
    const { data: project, error: projectError } = await db.from("projects").select("id").eq("organization_id", org.id).eq("id", projectId).maybeSingle();
    if (projectError) throw projectError;
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const prompts = await allRows(() => db.from("tracked_prompts").select("id").eq("project_id", projectId).order("id"));
    const end = new Date(), start = new Date(end); start.setUTCDate(start.getUTCDate() - 30);
    const scope = { promptIds: prompts.map(p => p.id), surface: "gemini_api", modelName, locale, periodStart: start.toISOString(), periodEnd: end.toISOString() };
    const rows: ObservationRow[] = [];
    // Bound the URL length of PostgREST's IN filter while preserving the complete population.
    for (let index = 0; index < scope.promptIds.length; index += 100) {
      rows.push(...await allRows(() => db.from("prompt_analysis_logs")
        .select("id,prompt_id,surface,model_name,score_version,locale,outcome,error_code,target_ats_score,competitor_ats_scores,rank,aio_status,measured_at,direct_mention_score,citation_domain_score,fanout_coverage_score,diagnostic_advice,primary_source_type,fanout_queries,brand_cited")
        .in("prompt_id", scope.promptIds.slice(index, index + 100)).eq("surface", scope.surface).eq("model_name", scope.modelName).eq("score_version", "v2").eq("locale", scope.locale)
        .lt("measured_at", scope.periodEnd).order("measured_at", { ascending: false }).order("id", { ascending: false })));
    }
    return NextResponse.json(aggregateObservations(rows, scope));
  } catch (error: any) {
    const schemaPending = ["42703", "PGRST204"].includes(error?.code) && /surface|model_name|score_version|locale|outcome|measured_at/.test(error?.message || "");
    return NextResponse.json({ error: schemaPending ? "観測データの更新準備中です。" : "観測データを取得できませんでした。", code: schemaPending ? "OBSERVATION_SCHEMA_PENDING" : "STATS_UNAVAILABLE" }, { status: 503 });
  }
}
