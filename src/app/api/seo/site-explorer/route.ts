import { NextRequest, NextResponse } from "next/server";
import { getSiteExplorerData, normalizeDomain, SiteExplorerResult } from "@/lib/dataforseo";
import { createAdminClient } from "@/lib/supabase-admin";

// メモリ内キャッシュ (Supabaseと二重の保護でAPIコストを徹底防御)
const MEMORY_CACHE = new Map<string, { data: SiteExplorerResult; expiresAt: number }>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7日間保持

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawDomain = searchParams.get("domain") || "daiwa-logi.co.jp";
    const refresh = searchParams.get("refresh") === "true";
    const domain = normalizeDomain(rawDomain);

    if (!domain) {
      return NextResponse.json({ error: "ドメインが指定されていません。" }, { status: 400 });
    }

    const now = Date.now();

    // 1. 強制リフレッシュでない場合、メモリキャッシュを確認
    if (!refresh) {
      const mem = MEMORY_CACHE.get(domain);
      if (mem && mem.expiresAt > now) {
        return NextResponse.json({
          ...mem.data,
          cached: true,
          cacheSource: "memory"
        });
      }
    }

    // 2. Supabase DB キャッシュを確認 (管理者権限)
    let supabase: any = null;
    try {
      supabase = createAdminClient();
    } catch (e) {
      // ローカル環境等でSUPABASE_SERVICE_ROLE_KEYがない場合も安全にスキップ
    }

    if (!refresh && supabase) {
      try {
        const { data: dbRow, error } = await supabase
          .from("seo_site_explorer_cache")
          .select("data, updated_at")
          .eq("target_domain", domain)
          .single();

        if (!error && dbRow && dbRow.data) {
          const updatedAt = new Date(dbRow.updated_at).getTime();
          if (now - updatedAt < CACHE_TTL_MS) {
            MEMORY_CACHE.set(domain, { data: dbRow.data, expiresAt: updatedAt + CACHE_TTL_MS });
            return NextResponse.json({
              ...dbRow.data,
              cached: true,
              cacheSource: "supabase",
              updatedAt: dbRow.updated_at
            });
          }
        }
      } catch (dbErr) {
        // DBキャッシュ未作成等の場合はそのままAPIコールへ継続
      }
    }

    // 3. DataForSEO API を実行
    console.log(`[DataForSEO] Fetching live metrics for domain: ${domain}`);
    const result = await getSiteExplorerData(domain);

    // 4. メモリキャッシュへ保存
    MEMORY_CACHE.set(domain, { data: result, expiresAt: now + CACHE_TTL_MS });

    // 5. Supabase キャッシュテーブルへ保存 (非同期・テーブルが存在する場合)
    if (supabase) {
      try {
        await supabase
          .from("seo_site_explorer_cache")
          .upsert({
            target_domain: domain,
            data: result,
            updated_at: new Date().toISOString()
          }, { onConflict: "target_domain" });
      } catch (upsertErr) {
        console.warn("[DataForSEO Cache] Supabase upsert skipped:", upsertErr);
      }
    }

    return NextResponse.json({
      ...result,
      cached: false
    });

  } catch (err: any) {
    console.error("[DataForSEO API Error]", err);
    return NextResponse.json(
      { error: err.message || "DataForSEO API通信エラーが発生しました。" },
      { status: 500 }
    );
  }
}
