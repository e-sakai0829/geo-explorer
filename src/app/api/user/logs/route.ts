import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ logs: [] });
    }

    // ユーザーの組織情報を取得
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!org) {
      return NextResponse.json({ logs: [] });
    }

    // ユーザーのプロジェクトを取得
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .eq("organization_id", org.id);

    if (!projects || projects.length === 0) {
      return NextResponse.json({ logs: [] });
    }

    const projectIds = projects.map((p) => p.id);

    // プロジェクトに紐づくプロンプト一覧を取得
    const { data: prompts } = await supabase
      .from("tracked_prompts")
      .select("id, prompt_text, created_at, last_scanned_at")
      .in("project_id", projectIds)
      .order("last_scanned_at", { ascending: false })
      .limit(30);

    if (!prompts || prompts.length === 0) {
      return NextResponse.json({ logs: [] });
    }

    const promptIds = prompts.map((p) => p.id);

    // 各プロンプトの最新ログを取得
    const { data: logs } = await supabase
      .from("prompt_analysis_logs")
      .select("id, prompt_id, brand_mentioned, brand_cited, raw_response, created_at, fanout_queries, citation_sources, rank")
      .in("prompt_id", promptIds)
      .order("created_at", { ascending: false });

    // スキャンログとプロンプト情報をマッピング
    const formattedLogs = (prompts || []).map((p) => {
      const log = (logs || []).find((l) => l.prompt_id === p.id);
      return {
        id: p.id,
        prompt: p.prompt_text,
        date: p.last_scanned_at || p.created_at,
        brandMentioned: log ? log.brand_mentioned : false,
        brandCited: log ? log.brand_cited : false,
        rawResponse: log ? log.raw_response : "",
        fanoutQueries: log ? log.fanout_queries : [],
        citationSources: log ? log.citation_sources : [],
        rank: log?.rank ?? null,
      };
    });

    return NextResponse.json({ logs: formattedLogs });
  } catch (error: any) {
    console.error("Fetch Logs API Error:", error);
    return NextResponse.json({ logs: [] });
  }
}
