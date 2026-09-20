import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { executeObservedScan, requireObservationSchema } from "@/lib/observed-scan";
import { isUuid, normalizeObservationLocale, observationV2Enabled } from "@/lib/observation-contract";

export async function POST(req: NextRequest) {
  try {
    const db = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "ログインが必要です。", loginRequired: true }, { status: 401 });
    if (!observationV2Enabled()) return NextResponse.json({ error: "観測機能の更新準備中です。", code: "OBSERVATION_DISABLED" }, { status: 503 });
    let body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
    const { prompt, projectId, category = "未分類", targetLocale = "ja" } = body || {};
    let locale: string;
    try { locale = normalizeObservationLocale(targetLocale); } catch { return NextResponse.json({ error: "Invalid locale" }, { status: 400 }); }
    if (!isUuid(projectId) || typeof prompt !== "string" || !prompt.trim() || prompt.length > 10000 || typeof category !== "string")
      return NextResponse.json({ error: "プロジェクトと有効なプロンプトを指定してください。" }, { status: 400 });
    const { data: org, error: orgError } = await db.from("organizations").select("id,monthly_credits,used_credits").eq("user_id", user.id).maybeSingle();
    if (orgError) throw new Error("DATABASE_UNAVAILABLE");
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 403 });
    if (!Number.isFinite(org.used_credits) || !Number.isFinite(org.monthly_credits)) throw new Error("DATABASE_UNAVAILABLE");
    if (org.used_credits >= org.monthly_credits) return NextResponse.json({ error: "今月の調査クレジット上限に達しました。", upgradeRequired: true }, { status: 403 });
    const { data: project, error: projectError } = await db.from("projects").select("id,name,domain,competitors").eq("id", projectId).eq("organization_id", org.id).maybeSingle();
    if (projectError) throw new Error("DATABASE_UNAVAILABLE");
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("SCAN_UNAVAILABLE");
    await requireObservationSchema(db);
    const aliases = locale === "ja-JP" ? [locale, "ja"] : locale === "en-US" ? [locale, "en"] : [locale];
    const { data: existing, error: lookupError } = await db.from("tracked_prompts").select("id").eq("project_id", projectId).eq("prompt_text", prompt).in("target_locale", aliases).order("id").limit(1).maybeSingle();
    if (lookupError) throw new Error("DATABASE_UNAVAILABLE");
    let promptId = existing?.id;
    if (!promptId) {
      const { data: created, error } = await db.from("tracked_prompts").insert({ project_id: projectId, prompt_text: prompt, target_locale: locale, category }).select("id").single();
      if (error || !created?.id) throw new Error("DATABASE_UNAVAILABLE");
      promptId = created.id;
    }
    const { raw, evaluation: e, outcome } = await executeObservedScan(db, { promptId, prompt, targetBrand: project.name, targetDomain: project.domain,
      competitors: Array.isArray(project.competitors) ? project.competitors.filter((c: unknown): c is string => typeof c === "string" && !!c.trim()) : [], locale, apiKey });
    // Existing credit operation is retained. Atomic reservation is explicitly outside Phase 0.
    const { error: creditError } = await db.rpc("consume_credit", { org_id: org.id });
    if (creditError) throw new Error("CREDIT_UPDATE_FAILED");
    const { error: trackingError } = await db.from("tracked_prompts").update({ last_scanned_at: raw.measuredAt }).eq("id", promptId);
    if (trackingError) throw new Error("TRACKING_UPDATE_FAILED");
    return NextResponse.json({ prompt, brandName: project.name, brandMentioned: e.brandMentioned, brandCited: e.brandCited,
      aiResponse: raw.text, fanoutQueries: raw.searchQueries, citationSources: raw.webSources, competitorMentions: e.competitorMentions,
      creditsRemaining: Math.max(0, org.monthly_credits - org.used_credits - 1), rank: e.rank, aioStatus: e.aioStatus, winLoss: e.winLoss,
      outcome, promptId, logId: raw.logId, measuredAt: raw.measuredAt, surface: "gemini_api", modelName: raw.modelName, scoreVersion: "v2", locale,
      consultantAdvice: { overallDiagnosis: outcome === "unmeasured" ? "回答を取得できず未計測です。" : e.brandMentioned ? "今回のGemini API回答内にブランドの言及があります。" : "今回のGemini API回答内にブランドの言及は確認できません。",
        citationStrategy: e.brandCited ? "今回の参照元に公式ドメインがあります。" : "今回の参照元に公式ドメインは確認できません。", actionPillars: [] },
      ats: { targetATS: outcome === "success" ? e.ats.targetATS : null, breakdown: outcome === "success" ? e.ats.targetBreakdown : null,
        competitorATSMap: outcome === "success" ? e.ats.competitorATSMap : {}, diagnosticAdvice: e.ats.diagnosticAdvice } });
  } catch (error) {
    const known = ["DATABASE_UNAVAILABLE", "SCAN_UNAVAILABLE", "OBSERVATION_SCHEMA_UNAVAILABLE", "OBSERVATION_SAVE_FAILED", "CREDIT_UPDATE_FAILED", "TRACKING_UPDATE_FAILED", "EXTERNAL_API_ERROR"];
    const code = error instanceof Error && known.includes(error.message) ? error.message : "SCAN_UNAVAILABLE";
    return NextResponse.json({ error: "解析処理を完了できませんでした。保存状況を確認してから再実行してください。", code }, { status: code === "EXTERNAL_API_ERROR" ? 502 : 503 });
  }
}
