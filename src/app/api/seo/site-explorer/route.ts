import { NextRequest, NextResponse } from 'next/server';
import { DataForSeoError, getSiteExplorerData, normalizeDomain, isSiteExplorerResult, type SiteExplorerResult } from '@/lib/dataforseo';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
const TTL = 7 * 86400000;
const memory = new Map<string, SiteExplorerResult>();
const pending = new Map<string, Promise<SiteExplorerResult>>();
const budgets = new Map<string, { count: number; until: number }>();
const failures = new Map<string, number>();
function remember(data: SiteExplorerResult) {
  memory.delete(data.domain);
  memory.set(data.domain, data);
  if (memory.size > 100) memory.delete(memory.keys().next().value!);
}
function age(data: SiteExplorerResult) { return Date.now() - Date.parse(data.fetchedAt); }
function fresh(data: SiteExplorerResult) { return age(data) >= 0 && age(data) < (data.warnings.length ? 300000 : TTL); }
function json(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } }); }

export async function GET(req: NextRequest) {
  try {
    const auth = await createServerSupabaseClient();
    const { data: { user }, error } = await auth.auth.getUser();
    if (error || !user) return json({ error: 'ログインが必要です。' }, 401);
    let domain: string;
    try { domain = normalizeDomain(new URL(req.url).searchParams.get('domain') ?? ''); }
    catch { return json({ error: '有効な公開ドメインを入力してください。' }, 400); }
    // A query parameter must never bypass the paid-request cache.
    const cached = memory.get(domain);
    if (cached && fresh(cached)) return json({ ...cached, cached: true, cacheSource: 'memory' });
    let stale = cached;
    let db: ReturnType<typeof createAdminClient> | null = null;
    try {
      db = createAdminClient();
      const { data, error } = await db.from('seo_site_explorer_cache').select('data').eq('target_domain', domain).abortSignal(AbortSignal.timeout(2500)).maybeSingle();
      if (!error && isSiteExplorerResult(data?.data, domain)) {
        if (fresh(data.data)) { remember(data.data); return json({ ...data.data, cached: true, cacheSource: 'supabase' }); }
        if (!stale || Date.parse(data.data.fetchedAt) > Date.parse(stale.fetchedAt)) stale = data.data;
      }
    } catch { /* DB cache is optional; memory and stale data remain available. */ }
    try {
      let work = pending.get(domain);
      if (!work) {
        const now = Date.now();
        for (const [key, value] of budgets) if (value.until <= now) budgets.delete(key);
        for (const [key, until] of failures) if (until <= now) failures.delete(key);
        if (failures.has(domain)) throw new DataForSeoError('PROVIDER_COOLDOWN', 503);
        const budget = budgets.get(user.id) ?? { count: 0, until: now + 3600000 };
        // Local protection only. A durable account quota is needed for a global cost ceiling.
        if (budget.count >= 5 || budgets.size >= 1000 || pending.size >= 5) throw new DataForSeoError('RATE_LIMITED', 429);
        budget.count++;
        budgets.set(user.id, budget);
        work = (async () => {
          try {
            const result = await getSiteExplorerData(domain);
            remember(result);
            if (db && result.warnings.length === 0) {
              try {
                const { error } = await db.from('seo_site_explorer_cache').upsert({ target_domain: domain, data: result, updated_at: result.fetchedAt }, { onConflict: 'target_domain' }).abortSignal(AbortSignal.timeout(2500));
                if (error) console.warn('[SEO cache] persistence unavailable');
              } catch { console.warn('[SEO cache] persistence unavailable'); }
            }
            return result;
          } catch (error) {
            failures.set(domain, Date.now() + 60000);
            if (failures.size > 100) failures.delete(failures.keys().next().value!);
            throw error;
          } finally { pending.delete(domain); }
        })();
        pending.set(domain, work);
      }
      return json({ ...await work, cached: false });
    } catch (error) {
      if (stale && age(stale) >= 0 && age(stale) < 30 * 86400000) return json({ ...stale, cached: true, stale: true, warnings: [...stale.warnings, '再取得に失敗したため、過去の取得データを表示しています。'] });
      throw error;
    }
  } catch (error) {
    const status = error instanceof DataForSeoError ? error.status : 503;
    return json({ error: status === 429 ? '取得回数の上限に達しました。時間をおいて再実行してください。' : 'データを取得できませんでした。時間をおいて再実行してください。', code: error instanceof DataForSeoError ? error.code : 'SEO_UNAVAILABLE' }, status);
  }
}
