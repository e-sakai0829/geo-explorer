import { SupabaseClient } from "@supabase/supabase-js";

export interface ProjectData {
  id: string;
  name: string;
  domain: string;
  competitors: string[];
  organization_id: string;
}

/**
 * プロジェクトへのアクセス権限を厳密に検証する共通ヘルパー。
 * RLSだけでなくApp層でも .eq("organization_id", orgId) を明示して二重防波堤を敷く。
 * 他組織のIDや不正なIDが渡された場合は null を返し、呼び出し元で一律 404 を返却して列挙攻撃を防ぐ。
 */
export async function requireProjectAccess(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string
): Promise<ProjectData | null> {
  if (!projectId || !orgId) return null;

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, domain, competitors, organization_id")
    .eq("id", projectId)
    .eq("organization_id", orgId)
    .single();

  if (error || !project) {
    return null;
  }

  return project as ProjectData;
}
