import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isUuid, normalizeObservationLocale, OBSERVATION_MODELS } from "@/lib/observation-contract";

// History is a bounded list of actual successful observations, never placeholder prompt rows.
export async function GET(req: NextRequest) {
  try {
    const db = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const projectId = req.nextUrl.searchParams.get("projectId");
    const model = req.nextUrl.searchParams.get("model") || OBSERVATION_MODELS[0];
    let locale;
    try { locale = normalizeObservationLocale(req.nextUrl.searchParams.get("locale") || "ja-JP"); } catch { return NextResponse.json({ error: "Invalid locale" }, { status: 400 }); }
    if (!isUuid(projectId) || !(OBSERVATION_MODELS as readonly string[]).includes(model)) return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    const { data: org, error: orgError } = await db.from("organizations").select("id").eq("user_id", user.id).maybeSingle();
    if (orgError) throw orgError;
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 403 });
    const { data: project, error: projectError } = await db.from("projects").select("id").eq("id", projectId).eq("organization_id", org.id).maybeSingle();
    if (projectError) throw projectError;
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const { data, error } = await db.from("prompt_analysis_logs")
      .select("id,prompt_id,brand_mentioned,brand_cited,raw_response,fanout_queries,citation_sources,rank,surface,model_name,score_version,locale,outcome,measured_at,tracked_prompts!inner(prompt_text,project_id)")
      .eq("tracked_prompts.project_id", projectId).eq("surface", "gemini_api").eq("score_version", "v2").eq("model_name", model).eq("locale", locale).eq("outcome", "success")
      .order("measured_at", { ascending: false }).order("id", { ascending: false }).limit(30);
    if (error) throw error;
    return NextResponse.json({ logs: (data || []).map((l: any) => ({ id: l.id, promptId: l.prompt_id, prompt: l.tracked_prompts.prompt_text,
      date: l.measured_at, measuredAt: l.measured_at, surface: l.surface, modelName: l.model_name, scoreVersion: l.score_version, locale: l.locale, outcome: l.outcome,
      brandMentioned: l.brand_mentioned, brandCited: l.brand_cited, rawResponse: l.raw_response, fanoutQueries: l.fanout_queries, citationSources: l.citation_sources, rank: l.rank })) });
  } catch { return NextResponse.json({ error: "履歴を取得できませんでした。" }, { status: 503 }); }
}
