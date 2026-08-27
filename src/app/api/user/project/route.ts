import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "未認証です。" }, { status: 401 });
    }

    // ユーザーの組織とプロジェクトを取得
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, plan, monthly_credits, used_credits")
      .eq("user_id", user.id)
      .single();

    if (!org) {
      return NextResponse.json({ error: "組織が見つかりません。" }, { status: 404 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, name, domain, competitors")
      .eq("organization_id", org.id)
      .limit(1)
      .single();

    return NextResponse.json({
      organization: org,
      project: project || {
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
      return NextResponse.json({ error: "未認証です。" }, { status: 401 });
    }

    const { name, domain, competitors } = await req.json();

    // 組織を取得または作成
    let orgId = "";
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (org) {
      orgId = org.id;
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
        .select("id")
        .single();
      orgId = newOrg?.id || "";
    }

    if (!orgId) {
      return NextResponse.json({ error: "組織の特定に失敗しました。" }, { status: 500 });
    }

    // プロジェクトを UPSERT
    const { data: existingProject } = await supabase
      .from("projects")
      .select("id")
      .eq("organization_id", orgId)
      .limit(1)
      .single();

    if (existingProject) {
      await supabase
        .from("projects")
        .update({
          name,
          domain,
          competitors: Array.isArray(competitors) ? competitors : competitors.split(",").map((s: string) => s.trim()),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProject.id);
    } else {
      await supabase
        .from("projects")
        .insert({
          organization_id: orgId,
          name,
          domain,
          competitors: Array.isArray(competitors) ? competitors : competitors.split(",").map((s: string) => s.trim()),
        });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
