import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { isUuid } from '@/lib/observation-contract';
import { normalizeDomain, isSiteExplorerResult, type SiteExplorerResult } from '@/lib/dataforseo';
import { GET as getSiteExplorer } from '@/app/api/seo/site-explorer/route';
import { buildKeywordGap, type GapDomain, type GapKeyword, type GapSummary } from '@/lib/seo-keyword-gap';

export const runtime = 'nodejs';
export const maxDuration = 60;
export type MierucaDomainSummary = GapSummary;
export type MierucaKeywordItem = GapKeyword;

const noStore = { 'Cache-Control': 'private, no-store' };
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: noStore }); }

export async function GET(req: NextRequest) {
  try {
    const db = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) return json({ error: 'ログインが必要です。' }, 401);

    const projectId = req.nextUrl.searchParams.get('projectId');
    if (!projectId || !isUuid(projectId)) return json({ error: 'プロジェクトを選択してください。' }, 400);
    const { data: org, error: orgError } = await db.from('organizations')
      .select('id').eq('user_id', user.id).maybeSingle();
    if (orgError || !org) return json({ error: '組織を確認できませんでした。' }, 403);
    const { data: project, error: projectError } = await db.from('projects')
      .select('id, name, domain, competitors, competitor_domains')
      .eq('id', projectId).eq('organization_id', org.id).maybeSingle();
    if (projectError || !project) return json({ error: 'プロジェクトを確認できませんでした。' }, 404);

    let ownDomain: string;
    try { ownDomain = normalizeDomain(project.domain ?? ''); }
    catch { return json({ error: 'プロジェクトに有効な自社ドメインを登録してください。' }, 422); }
    const rawCompetitors = Array.isArray(project.competitor_domains) ? project.competitor_domains : [];
    const competitorNames = Array.isArray(project.competitors) ? project.competitors : [];
    const domains: GapDomain[] = [{ domain: ownDomain, name: project.name || '自社サイト', color: '#10b981' }];
    for (let i = 0; i < rawCompetitors.length && domains.length < 3; i++) {
      if (typeof rawCompetitors[i] !== 'string' || !rawCompetitors[i].trim()) continue;
      let domain: string;
      try { domain = normalizeDomain(rawCompetitors[i]); }
      catch { return json({ error: `競合${i + 1}のドメインを修正してください。` }, 422); }
      if (domains.some(item => item.domain === domain)) continue;
      domains.push({ domain, name: typeof competitorNames[i] === 'string' && competitorNames[i].trim()
        ? competitorNames[i].trim() : domain, color: domains.length === 1 ? '#f59e0b' : '#06b6d4' });
    }
    if (domains.length < 2) return json({ error: '競合ドメインを1社以上登録してください。' }, 422);

    // Invoke the existing authenticated, DB-leased Site Explorer boundary.
    // No direct provider call may bypass its shared cache or hourly cost guard.
    const results = await Promise.all(domains.map(async ({ domain }) => {
      const url = new URL('/api/seo/site-explorer', req.url);
      url.searchParams.set('domain', domain);
      const response = await getSiteExplorer(new NextRequest(url, { headers: req.headers }));
      const payload = await response.json();
      if (!response.ok) throw { status: response.status, message: payload.error };
      const stale = payload.stale === true;
      if (!isSiteExplorerResult(payload, domain) || payload.warnings.some((warning: string) => warning.startsWith('キーワードデータを取得できませんでした')))
        throw { status: 503, message: 'キーワードデータを取得できませんでした。' };
      return { report: payload as SiteExplorerResult, stale };
    }));
    const gap = buildKeywordGap(domains, results.map(result => result.report));
    return json({
      ...gap, theme: project.name || ownDomain,
      author: user.email?.split('@')[0] || '—',
      date: new Date().toISOString().slice(0, 10), country: 'Google 日本・日本語',
      source: 'DataForSEO', keywordLimitPerDomain: 100,
      stale: results.some(result => result.stale),
      coverageNote: '各ドメインの推定流入上位100件を比較。未掲載の順位は圏外ではなく未確認です。',
    });
  } catch (error) {
    const failure = error as { status?: number; message?: string };
    const status = [401, 403, 429, 503].includes(failure.status ?? 0) ? failure.status! : 503;
    return json({ error: typeof failure.message === 'string' ? failure.message : '競合データを取得できませんでした。' }, status);
  }
}
