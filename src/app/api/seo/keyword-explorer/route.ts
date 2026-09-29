import { NextRequest, NextResponse } from 'next/server';
import { callDataForSeo, DataForSeoError } from '@/lib/dataforseo';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { formatKeywordExplorerResult, isKeywordExplorerResult, normalizeKeyword, type KeywordExplorerResult } from '@/lib/seo-keyword-explorer';

export const runtime = 'nodejs';
export const maxDuration = 30;

const memory = new Map<string, KeywordExplorerResult>();
const pending = new Map<string, Promise<KeywordExplorerResult>>();
const DAY = 86400000;
const noStore = { 'Cache-Control': 'private, no-store' };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });
const fresh = (value: KeywordExplorerResult) => {
  const age = Date.now() - Date.parse(value.fetchedAt);
  return age >= 0 && age < (value.warnings.length ? 300000 : 7 * DAY);
};
function remember(value: KeywordExplorerResult) {
  memory.delete(value.keyword);
  memory.set(value.keyword, value);
  if (memory.size > 100) memory.delete(memory.keys().next().value!);
}

async function authenticatedUser(req: NextRequest): Promise<string | null> {
  const header = req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    try {
      const { data } = await createAdminClient().auth.getUser(header.slice(7));
      if (data.user) return data.user.id;
    } catch { /* Try cookie authentication. */ }
  }
  try {
    const { data } = await (await createServerSupabaseClient()).auth.getUser();
    return data.user?.id ?? null;
  } catch { return null; }
}

async function retrieve(keyword: string): Promise<KeywordExplorerResult> {
  const input = { keyword, location_code: 2392, language_code: 'ja' };
  const attempts = await Promise.allSettled([
    callDataForSeo('dataforseo_labs/google/keyword_overview/live', [{ keywords: [keyword], location_code: 2392, language_code: 'ja' }]),
    callDataForSeo('dataforseo_labs/google/related_keywords/live', [{ ...input, depth: 1, limit: 8 }]),
    callDataForSeo('serp/google/organic/live/advanced', [{ ...input, depth: 10 }]),
  ]);
  if (attempts.every(attempt => attempt.status === 'rejected')) {
    throw attempts[0].status === 'rejected' ? attempts[0].reason : new DataForSeoError('PROVIDER_UNAVAILABLE', 503);
  }
  const names = ['KW概要', '関連KW', '検索上位サイト'];
  const warnings = attempts.flatMap((attempt, index) => attempt.status === 'rejected' ? [`${names[index]}を取得できませんでした。`] : []);
  return formatKeywordExplorerResult(keyword,
    attempts[0].status === 'fulfilled' ? attempts[0].value : null,
    attempts[1].status === 'fulfilled' ? attempts[1].value : null,
    attempts[2].status === 'fulfilled' ? attempts[2].value : null,
    warnings);
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticatedUser(req);
    if (!user) return json({ error: 'ログインが必要です。' }, 401);
    if (process.env.SEO_KEYWORD_EXPLORER_ENABLED !== 'true')
      return json({ error: 'KWエクスプローラーは準備中です。', code: 'KEYWORD_EXPLORER_DISABLED' }, 503);
    const betaUsers = new Set((process.env.SEO_BETA_USER_IDS ?? '').split(',').map(id => id.trim()).filter(Boolean));
    if (!betaUsers.has(user)) return json({ error: 'SEO分析βの利用対象外です。' }, 403);
    const db = createAdminClient();
    const { data: org, error: orgError } = await db.from('organizations').select('plan').eq('user_id', user).maybeSingle();
    if (orgError || !org) return json({ error: 'プランを確認できません。' }, 503);
    if (org.plan === 'free') return json({ error: '無料プランでは概要チェックをご利用ください。' }, 403);
    let keyword: string;
    try { keyword = normalizeKeyword((await req.json()).keyword); }
    catch { return json({ error: '2〜80文字のキーワードを入力してください。' }, 400); }

    const cached = memory.get(keyword);
    if (cached && fresh(cached)) return json({ ...cached, cached: true });
    const inFlight = pending.get(keyword);
    if (inFlight) return json({ ...await inFlight, cached: false });
    const { data: dbRow, error: cacheError } = await db.from('seo_keyword_explorer_cache')
      .select('data').eq('target_keyword', keyword).abortSignal(AbortSignal.timeout(2500)).maybeSingle();
    if (cacheError) throw new DataForSeoError('CACHE_UNAVAILABLE', 503);
    if (isKeywordExplorerResult(dbRow?.data, keyword) && fresh(dbRow.data)) {
      remember(dbRow.data);
      return json({ ...dbRow.data, cached: true });
    }
    const { data: claim, error: claimError } = await db.rpc('reserve_seo_keyword_explorer', { p_keyword: keyword, p_user: user });
    if (claimError || !claim || typeof claim !== 'object') throw new DataForSeoError('CACHE_UNAVAILABLE', 503);
    if (claim.status === 'cached') {
      if (!isKeywordExplorerResult(claim.data, keyword)) throw new DataForSeoError('CACHE_UNAVAILABLE', 503);
      remember(claim.data);
      return json({ ...claim.data, cached: true });
    }
    if (claim.status === 'limited') throw new DataForSeoError('RATE_LIMITED', 429);
    if (claim.status === 'busy' || claim.status === 'cooldown') throw new DataForSeoError('PROVIDER_COOLDOWN', 503);
    if (claim.status !== 'reserved' || typeof claim.token !== 'string' || !/^[0-9a-f-]{36}$/i.test(claim.token))
      throw new DataForSeoError('CACHE_UNAVAILABLE', 503);

    const token = claim.token;
    const work = (async () => {
      try {
        const result = await retrieve(keyword);
        if (!isKeywordExplorerResult(result, keyword)) throw new DataForSeoError('PROVIDER_INVALID_RESULT', 502);
        const { data: saved, error: saveError } = await db.rpc('finish_seo_keyword_explorer', { p_keyword: keyword, p_token: token, p_data: result });
        if (saveError || saved !== true) throw new DataForSeoError('CACHE_UNAVAILABLE', 503);
        remember(result);
        return result;
      } catch (error) {
        try { await db.rpc('fail_seo_keyword_explorer', { p_keyword: keyword, p_token: token }); } catch { /* Lease expires. */ }
        throw error;
      } finally { pending.delete(keyword); }
    })();
    pending.set(keyword, work);
    return json({ ...await work, cached: false });
  } catch (error) {
    const code = error instanceof DataForSeoError ? error.code : 'KEYWORD_EXPLORER_UNAVAILABLE';
    const status = error instanceof DataForSeoError ? error.status : 503;
    const messages: Record<string, string> = {
      CACHE_UNAVAILABLE: '保存先を確認できません。有料APIの取得は停止しています。',
      RATE_LIMITED: 'SEO分析の取得上限に達しました。時間をおいて再実行してください。',
      PROVIDER_COOLDOWN: '同じKWの取得中か、直前の失敗後の待機中です。',
      PROVIDER_NOT_CONFIGURED: 'DataForSEOの接続設定を確認できません。',
      PROVIDER_HTTP_402: 'DataForSEOの残高不足です。',
    };
    return json({ error: messages[code] ?? 'KWデータを取得できませんでした。', code }, status);
  }
}
