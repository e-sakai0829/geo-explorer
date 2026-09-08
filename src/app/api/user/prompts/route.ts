import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { requireProjectAccess } from "@/lib/require-project";

async function resolveProjectId(supabase: any, userId: string, requestedId?: string | null, brandName?: string) {
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("user_id", userId)
    .single();
  if (!org) return null;

  if (requestedId) {
    const valid = await requireProjectAccess(supabase, org.id, requestedId);
    if (!valid) return null;
    return valid.id;
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (project) return project.id as string;

  const { data: newProject } = await supabase
    .from("projects")
    .insert({ organization_id: org.id, name: brandName || "自社ブランド" })
    .select("id")
    .single();

  return newProject?.id || null;
}

/** 登録済みプロンプト一覧の取得（プロンプト設定シート相当） */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ prompts: [] });

    const reqProjectId = req.nextUrl.searchParams.get("projectId") || req.nextUrl.searchParams.get("project");
    const projectId = await resolveProjectId(supabase, user.id, reqProjectId);
    if (!projectId) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { data: prompts } = await supabase
      .from("tracked_prompts")
      .select("id, prompt_text, category, keyword, search_intent, importance, check_frequency, last_scanned_at, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    return NextResponse.json({ prompts: prompts || [] });
  } catch (error: any) {
    console.error("Prompts GET Error:", error);
    return NextResponse.json({ prompts: [] });
  }
}

/** プロンプトの新規登録（単発 or bulk: { prompts: [...] } ) */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "プロンプト登録にはログインが必要です。" }, { status: 401 });
    }

    const body = await req.json();
    const items = Array.isArray(body.prompts) ? body.prompts : [body];

    const targetProjectId = body.projectId || req.nextUrl.searchParams.get("projectId") || req.nextUrl.searchParams.get("project");
    const projectId = await resolveProjectId(supabase, user.id, targetProjectId, body.brandName);
    if (!projectId) {
      return NextResponse.json({ error: "プロジェクトの特定に失敗しました。" }, { status: 404 });
    }

    const rows = items
      .filter((item: any) => item?.promptText)
      .map((item: any) => ({
        project_id: projectId,
        prompt_text: item.promptText,
        category: item.category || "未分類",
        keyword: item.keyword || null,
        search_intent: item.searchIntent || null,
        importance: item.importance || "medium",
        check_frequency: item.checkFrequency || "weekly",
      }));

    if (rows.length === 0) {
      return NextResponse.json({ error: "登録するプロンプトがありません。" }, { status: 400 });
    }

    const { data, error } = await supabase.from("tracked_prompts").insert(rows).select("id");
    if (error) throw error;

    return NextResponse.json({ success: true, inserted: data?.length || 0 });
  } catch (error: any) {
    console.error("Prompts POST Error:", error);
    return NextResponse.json({ error: error.message || "登録に失敗しました。" }, { status: 500 });
  }
}

/** プロンプトの編集（カテゴリ・重要度等） */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, promptText, category, keyword, searchIntent, importance, checkFrequency } = await req.json();
    if (!id) return NextResponse.json({ error: "idが必要です。" }, { status: 400 });

    const update: Record<string, any> = {};
    if (promptText !== undefined) update.prompt_text = promptText;
    if (category !== undefined) update.category = category;
    if (keyword !== undefined) update.keyword = keyword;
    if (searchIntent !== undefined) update.search_intent = searchIntent;
    if (importance !== undefined) update.importance = importance;
    if (checkFrequency !== undefined) update.check_frequency = checkFrequency;

    const { error } = await supabase.from("tracked_prompts").update(update).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** プロンプトの削除 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "idが必要です。" }, { status: 400 });

    const { error } = await supabase.from("tracked_prompts").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
