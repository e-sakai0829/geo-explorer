import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { executeObservedScan, requireObservationSchema } from "@/lib/observed-scan";
import { observationV2Enabled } from "@/lib/observation-contract";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !secret.trim()) return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!observationV2Enabled()) return NextResponse.json({ error: "Observation disabled" }, { status: 503 });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
  try {
    const db = createAdminClient();
    await requireObservationSchema(db);
    const { data: prompts, error } = await db.from("tracked_prompts").select("id,prompt_text,target_locale,project_id,check_frequency").neq("check_frequency", "manual").order("last_scanned_at", { ascending: true, nullsFirst: true }).limit(60);
    if (error) throw new Error("DATABASE_UNAVAILABLE");
    if (!prompts?.length) return NextResponse.json({ processed: 0, succeeded: 0, failed: 0, results: [] });
    const { data: projects, error: projectError } = await db.from("projects").select("id,name,domain,competitors").in("id", [...new Set(prompts.map(p => p.project_id))]);
    if (projectError) throw new Error("DATABASE_UNAVAILABLE");
    const results: Array<{ promptId: string; status: string; error?: string }> = [];
    for (const p of prompts) {
      try {
        const project = projects?.find(project => project.id === p.project_id);
        if (!project) throw new Error("PROJECT_UNAVAILABLE");
        const { raw, outcome } = await executeObservedScan(db, { promptId: p.id, prompt: p.prompt_text, targetBrand: project.name, targetDomain: project.domain,
          competitors: Array.isArray(project.competitors) ? project.competitors.filter((c: unknown): c is string => typeof c === "string" && !!c.trim()) : [], locale: p.target_locale, apiKey });
        const { error: updateError } = await db.from("tracked_prompts").update({ last_scanned_at: raw.measuredAt }).eq("id", p.id);
        if (updateError) throw new Error("TRACKING_UPDATE_FAILED");
        results.push({ promptId: p.id, status: outcome === "success" ? "ok" : "unmeasured" });
      } catch {
        // Provider attempts are recorded by executeObservedScan with their actual model.
        results.push({ promptId: p.id, status: "error", error: "SCAN_INCOMPLETE" });
      }
      await sleep(800);
    }
    return NextResponse.json({ processed: results.length, succeeded: results.filter(r => r.status === "ok").length,
      failed: results.filter(r => r.status === "error").length, unmeasured: results.filter(r => r.status === "unmeasured").length, results });
  } catch { return NextResponse.json({ error: "Observation database unavailable" }, { status: 503 }); }
}
