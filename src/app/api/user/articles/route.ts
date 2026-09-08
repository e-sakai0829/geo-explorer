import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ articles: [] });
    }

    // ユーザーの組織情報を取得
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!org) {
      return NextResponse.json({ articles: [] });
    }

    const requestedProjectId = req.nextUrl.searchParams.get("projectId");

    // ユーザーのプロジェクトを取得
    let targetProjectIds: string[] = [];
    if (requestedProjectId) {
      const { data: proj } = await supabase
        .from("projects")
        .select("id")
        .eq("id", requestedProjectId)
        .eq("organization_id", org.id)
        .single();
      if (proj) {
        targetProjectIds = [proj.id];
      }
    }

    if (targetProjectIds.length === 0) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("organization_id", org.id);
      targetProjectIds = projects?.map((p) => p.id) || [];
    }

    if (targetProjectIds.length === 0) {
      return NextResponse.json({ articles: [] });
    }

    // aeo_articles テーブルから過去の生成記事を取得
    const { data: articles, error: dbError } = await supabase
      .from("aeo_articles")
      .select("id, project_id, target_prompt, language, title, content_markdown, created_at, status")
      .in("project_id", targetProjectIds)
      .order("created_at", { ascending: false })
      .limit(30);

    if (dbError || !articles) {
      return NextResponse.json({ articles: [] });
    }

    const formattedArticles = articles.map((art) => ({
      id: art.id,
      title: art.title || art.target_prompt || "無題のAEO記事",
      prompt: art.target_prompt || "",
      language: art.language || "ja",
      contentMarkdown: art.content_markdown || "",
      date: art.created_at,
    }));

    return NextResponse.json({ articles: formattedArticles });
  } catch (error: any) {
    console.error("Fetch Articles API Error:", error);
    return NextResponse.json({ articles: [] });
  }
}
