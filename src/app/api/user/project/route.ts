import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "設定の保存にはログインが必要です。" }, { status: 401 });
    }

    // ユーザーの組織を取得
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, plan, monthly_credits, used_credits")
      .eq("user_id", user.id)
      .single();

    if (!org) {
      return NextResponse.json({ error: "組織が見つかりません。" }, { status: 404 });
    }

    // 組織に属する全プロジェクトを取得
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, domain, competitors, created_at")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: true });

    const requestedProjectId = req.nextUrl.searchParams.get("projectId") || req.nextUrl.searchParams.get("project");
    let currentProject = null;

    if (projects && projects.length > 0) {
      if (requestedProjectId) {
        currentProject = projects.find((p) => p.id === requestedProjectId) || projects[0];
      } else {
        currentProject = projects[0];
      }
    }

    return NextResponse.json({
      organization: org,
      projects: projects || [],
      project: currentProject || {
        name: "自社ブランド",
        domain: "https://example.com",
        competitors: ["競合A", "競合B"],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "設定の保存にはログインが必要です。ログイン後に再度お試しください。" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, name, domain, competitors, isNew } = body;

    // 組織を取得または作成
    let orgId = "";
    let plan = "starter";
    const { data: org } = await supabase
      .from("organizations")
      .select("id, plan")
      .eq("user_id", user.id)
      .single();

    if (org) {
      orgId = org.id;
      plan = (org.plan || "starter").toLowerCase();
    } else {
      const { data: newOrg } = await supabase
        .from("organizations")
        .insert({
          user_id: user.id,
          name: name || "マイ組織",
          plan: "starter",
          monthly_credits: 10,
          used_credits: 0,
        })
        .select("id, plan")
        .single();
      orgId = newOrg?.id || "";
      plan = (newOrg?.plan || "starter").toLowerCase();
    }

    if (!orgId) {
      return NextResponse.json({ error: "組織の特定に失敗しました。" }, { status: 500 });
    }

    const formattedCompetitors = Array.isArray(competitors)
      ? competitors
      : typeof competitors === "string"
      ? competitors.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    // 新規作成の場合、または既存プロジェクトIDがない場合は上限チェック
    if (isNew || !projectId) {
      // 1. アトミックRPC実行（TOCTOU防止）
      const { data: rpcResult, error: rpcError } = await supabase.rpc("create_project_with_limit", {
        org_id: orgId,
        proj_name: name || "新規サイト",
        proj_domain: domain || "https://example.com",
        proj_competitors: formattedCompetitors,
      });

      if (!rpcError && rpcResult) {
        if (rpcResult.error === "PROJECT_LIMIT_REACHED") {
          return NextResponse.json(
            {
              error: `現在の${plan.toUpperCase()}プランでは最大${rpcResult.maxProjects}サイトまで登録可能です。複数サイトを管理するにはGrowthプラン（最大3サイト）またはAgencyプラン（無制限）へアップグレードしてください。`,
              code: "PROJECT_LIMIT_REACHED",
              currentCount: rpcResult.currentCount,
              maxProjects: rpcResult.maxProjects,
            },
            { status: 403 }
          );
        }
        if (rpcResult.success && rpcResult.project) {
          return NextResponse.json({ success: true, project: rpcResult.project, isNew: true });
        }
      }

      // フォールバック（RPC未定義時の標準チェック）
      const maxProjects = plan === "agency" ? 999 : plan === "growth" ? 3 : 1;
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);

      const currentCount = count ?? 0;
      if (currentCount >= maxProjects) {
        return NextResponse.json(
          {
            error: `現在の${plan.toUpperCase()}プランでは最大${maxProjects}サイトまで登録可能です。複数サイトを管理するにはGrowthプラン（最大3サイト）またはAgencyプラン（無制限）へアップグレードしてください。`,
            code: "PROJECT_LIMIT_REACHED",
            currentCount,
            maxProjects,
          },
          { status: 403 }
        );
      }

      // 新規プロジェクトの登録
      const { data: createdProject, error: insertError } = await supabase
        .from("projects")
        .insert({
          organization_id: orgId,
          name: name || "新規サイト",
          domain: domain || "https://example.com",
          competitors: formattedCompetitors,
        })
        .select("id, name, domain, competitors")
        .single();

      if (insertError) throw insertError;
      return NextResponse.json({ success: true, project: createdProject, isNew: true });
    }

    // 既存プロジェクトの更新 (projectId が指定されている場合)
    const { data: targetProject } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("organization_id", orgId)
      .single();

    if (!targetProject) {
      return NextResponse.json({ error: "指定されたプロジェクトが見つかりません。" }, { status: 404 });
    }

    await supabase
      .from("projects")
      .update({
        name,
        domain,
        competitors: formattedCompetitors,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    return NextResponse.json({ success: true, projectId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
