import { NextRequest, NextResponse } from 'next/server';
import { DataForSeoError, getSiteExplorerData, normalizeDomain, isSiteExplorerResult, type SiteExplorerResult } from '@/lib/dataforseo';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const maxDuration = 30;
const DAY = 86400000;
const memory = new Map<string, SiteExplorerResult>();
const pending = new Map<string, Promise<SiteExplorerResult>>();

function remember(data: SiteExplorerResult) {
  memory.delete(data.domain);
  memory.set(data.domain, data);
  if (memory.size > 100) memory.delete(memory.keys().next().value!);
}
function age(data: SiteExplorerResult) { return Date.now() - Date.parse(data.fetchedAt); }
function fresh(data: SiteExplorerResult) { return age(data) >= 0 && age(data) < (data.warnings.length ? 300000 : 7 * DAY); }
function json(data: unknown, status = 200, retryAfter?: number) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store', ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}) } });
}
type Admin = ReturnType<typeof createAdminClient>;
type Claim = { status?: string; token?: string; data?: unknown };

async function userId(req: NextRequest): Promise<string | null> {
  const header = req.headers?.get('authorization');
  if (header?.startsWith('Bearer ')) {
    try {
      const { data } = await createAdminClient().auth.getUser(header.slice(7));
      if (data.user) return data.user.id;
    } catch { /* Cookie authentication may still succeed. */ }
  }
  try {
    const { data } = await (await createServerSupabaseClient()).auth.getUser();
    return data.user?.id ?? null;
  } catch { return null; }
}

async function claim(db: Admin, domain: string, user: string): Promise<Claim> {
  const { data, error } = await db.rpc('reserve_seo_site_explorer', { p_domain: domain, p_user: user });
  if (error || !data || typeof data !== 'object') throw new DataForSeoError('CACHE_UNAVAILABLE', 503);
  return data as Claim;
}

export async function GET(req: NextRequest) {
  try {
    const user = await userId(req);
    if (!user) return json({ error: 'ログインが必要です。' }, 401);
    if (process.env.SEO_SITE_EXPLORER_V3_ENABLED !== 'true')
      return json({ error: 'SEO分析機能の更新準備中です。', code: 'SEO_V3_DISABLED' }, 503);
    let domain: string;
    try { domain = normalizeDomain(new URL(req.url).searchParams.get('domain') ?? ''); }
    catch { return json({ error: '有効な公開ドメインを入力してください。' }, 400); }

    const cached = memory.get(domain);
    if (cached && fresh(cached)) return json({ ...cached, cached: true, cacheSource: 'memory' });
    let stale = cached;
    try {
      // Local single-flight avoids duplicate work in one process. The DB lease is the
      // authority across processes and is mandatory before any paid provider call.
      const inFlight = pending.get(domain);
      if (inFlight) return json({ ...await inFlight, cached: false });

      const db = createAdminClient();
      const { data: dbRow, error: dbError } = await db.from('seo_site_explorer_cache')
        .select('data').eq('target_domain', domain).abortSignal(AbortSignal.timeout(2500)).maybeSingle();
      if (dbError) throw new DataForSeoError('CACHE_UNAVAILABLE', 503);
      if (isSiteExplorerResult(dbRow?.data, domain)) {
        if (fresh(dbRow.data)) { remember(dbRow.data); return json({ ...dbRow.data, cached: true, cacheSource: 'supabase' }); }
        if (!stale || Date.parse(dbRow.data.fetchedAt) > Date.parse(stale.fetchedAt)) stale = dbRow.data;
      }

      const reservation = await claim(db, domain, user);
      if (reservation.status === 'cached') {
        if (!isSiteExplorerResult(reservation.data, domain)) throw new DataForSeoError('CACHE_UNAVAILABLE', 503);
        remember(reservation.data);
        return json({ ...reservation.data, cached: true, cacheSource: 'supabase' });
      }
      if (reservation.status === 'limited') throw new DataForSeoError('RATE_LIMITED', 429);
      if (reservation.status === 'busy' || reservation.status === 'cooldown') throw new DataForSeoError('PROVIDER_COOLDOWN', 503);
      if (reservation.status !== 'reserved' || !/^[0-9a-f-]{36}$/i.test(reservation.token ?? ''))
        throw new DataForSeoError('CACHE_UNAVAILABLE', 503);
      const token = reservation.token!;
      const work = (async () => {
        try {
          const result = await getSiteExplorerData(domain);
          if (!isSiteExplorerResult(result, domain)) throw new DataForSeoError('PROVIDER_INVALID_RESULT', 502);
          const { data: saved, error: saveError } = await db.rpc('finish_seo_site_explorer', { p_domain: domain, p_token: token, p_data: result });
          if (saveError || saved !== true) throw new DataForSeoError('CACHE_UNAVAILABLE', 503);
          remember(result);
          return result;
        } catch (error) {
          try { await db.rpc('fail_seo_site_explorer', { p_domain: domain, p_token: token }); }
          catch { /* The lease expires automatically if the request is interrupted. */ }
          throw error;
        } finally { pending.delete(domain); }
      })();
      pending.set(domain, work);
      return json({ ...await work, cached: false });
    } catch (error) {
      if (stale && age(stale) >= 0 && age(stale) < 30 * DAY)
        return json({ ...stale, cached: true, stale: true, warnings: [...stale.warnings, '再取得できないため、過去の取得データを表示しています。'] });
      throw error;
    }
  } catch (error) {
    const status = error instanceof DataForSeoError ? error.status : 503;
    const code = error instanceof DataForSeoError ? error.code : 'SEO_UNAVAILABLE';
    const messages: Record<string, string> = {
      CACHE_UNAVAILABLE: '検索データの保存先を確認できません。現在は有料APIの取得を停止しています。',
      PROVIDER_NOT_CONFIGURED: '検索データの取得設定を確認できません。',
      PROVIDER_COOLDOWN: '別の取得が進行中か、直前の失敗後の待機中です。しばらくして再実行してください。',
      RATE_LIMITED: '取得回数の上限に達しました。時間をおいて再実行してください。',
      PROVIDER_HTTP_402: '検索データの提供元で残高不足が発生しました。',
    };
    return json({ error: messages[code] ?? 'データを取得できませんでした。時間をおいて再実行してください。', code }, status, code === 'PROVIDER_COOLDOWN' ? 3 : undefined);
  }
}
