// Offline regression tests: all network and auth boundaries are replaced explicitly.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = process.env.SEO_APP_ROOT || path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
function load(relative, mocks = {}, globals = {}) {
  const module = { exports: {} };
  const file = path.join(root, relative);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    throw new Error('Unmocked import: ' + name);
  }, console, URL, URLSearchParams, Buffer, AbortSignal, AbortController, Date, Error, setTimeout, clearTimeout,
  process: { env: { DATAFORSEO_API_LOGIN: 'offline-test', DATAFORSEO_API_PASSWORD: 'offline-test', SEO_SITE_EXPLORER_V3_ENABLED: 'true' } },
  fetch: async () => { throw new Error('NETWORK_FORBIDDEN'); }, ...globals }, { filename: file });
  return module.exports;
}
let passed = 0;
function check(name, run) { run(); passed++; console.log('PASS', name); }
const chart = load('src/lib/seo-chart.ts');
for (const value of [0, 1, 2, 3, 4, 5, 100, 10001, 1e8, 3e9, 1e15, Number.MAX_VALUE, Infinity, NaN, -1]) {
  check('scale ' + value, () => {
    const result = chart.calculateNiceScale(value);
    assert.equal(result.ticks.length, 5);
    assert(Number.isFinite(result.max) && result.max > 0);
    assert(Number.isFinite(result.step) && result.step > 0);
    assert.equal(new Set(result.ticks.map(t => t.label)).size, 5);
    assert(result.ticks.every(t => Number.isFinite(t.value)));
    if (Number.isFinite(value) && value > 0) assert(result.max >= value);
  });
}
check('bad divisions bounded', () => assert.equal(chart.calculateNiceScale(4, Infinity).ticks.length, 5));
check('CSV quotes and formulas', () => { assert.equal(chart.csvCell('a,"b"\n'), '"a,""b""\n"'); assert.equal(chart.csvCell(' =SUM(A1)'), '"\' =SUM(A1)"'); });
const client = load('src/lib/dataforseo.ts');
check('URL normalization', () => assert.equal(client.normalizeDomain('https://Example.com/path?q=x#y'), 'example.com'));
for (const domain of ['', 'http://user:pw@example.com', 'ftp://example.com', '127.0.0.1', 'https://[::1]', 'localhost', 'a..com', '__proto__', 'example.com:3000']) {
  check('reject domain ' + domain, () => assert.throws(() => client.normalizeDomain(domain)));
}
const organic = { count: 1234, etv: 0, estimated_paid_traffic_cost: 0, pos_1: 0, pos_2_3: 0, pos_4_10: 0, pos_11_20: 0, pos_21_30: 0, pos_31_40: 0, pos_41_50: 0 };
const keyword = (word, url, etv) => ({ keyword_data: { keyword: word, keyword_info: { search_volume: 300 }, keyword_properties: { keyword_difficulty: 0 } }, ranked_serp_element: { serp_item: { url, type: 'organic', rank_group: 1, rank_absolute: 3, etv, estimated_paid_traffic_cost: 0 } } });
const fixture = client.normalizeResults('example.com', { metrics: { organic }, items: [null, {}, keyword('a', 'https://example.com/a#x', 0), keyword('a', 'https://example.com/a#y', 0), keyword('b', 'https://example.com/a', 2), keyword('unsafe', 'javascript:alert(1)', 4)] }, { rank: 0, backlinks: 0, referring_domains: 0 }, { items: [{ year: 2026, month: 9, metrics: { organic } }, null, { year: 2026, month: 8, metrics: { organic } }] });
check('zero is retained, full keyword count', () => { assert.equal(fixture.summary.organicTraffic, 0); assert.equal(fixture.summary.dr, 0); assert.equal(fixture.summary.organicKeywords, 1234); });
check('dedup and safe URL aggregation', () => { assert.equal(fixture.keywords.length, 2); assert.equal(fixture.topPages.length, 1); assert.equal(fixture.topPages[0].traffic, 2); });
check('paid entries excluded', () => {
  const paid = keyword('ad', 'https://example.com/ad', 100);
  paid.ranked_serp_element.serp_item.type = 'paid';
  const mixed = client.normalizeResults('example.com', { metrics: { organic }, items: [paid, keyword('organic', 'https://example.com/o', 1)] }, {}, {});
  assert.equal(mixed.keywords.length, 1);
  assert.equal(mixed.keywords[0].position, 1);
  assert.equal(mixed.topPages.length, 1);
});
check('period boundary across year and gaps', () => {
  const input = [{ month: '2025-06' },{month:'2025-12'}, {month:'2026-01'}, {month:'2026-05'}];
  assert.deepEqual(Array.from(chart.selectHistoryPeriod(input,6), x => x.month), ['2025-12','2026-01','2026-05']);
  assert.equal(chart.selectHistoryPeriod(input,12).length,4);
  assert.equal(chart.selectHistoryPeriod(input,'all').length,4);
});
check('no fabricated metrics/history', () => { assert.equal(fixture.summary.ur, null); assert.equal(fixture.keywords[0].prevPosition, null); assert.equal(fixture.history[0].month, '2026-08'); assert.equal(fixture.history[0].traffic, 0); assert.equal(fixture.history.length, 2); });
check('missing does not become zero', () => { const empty = client.normalizeResults('example.com', {}, {}, {}); assert.equal(empty.summary.organicTraffic, null); assert.equal(empty.history.length, 0); });
check('valid cache accepted', () => assert(client.isSiteExplorerResult(fixture, 'example.com')));
for (const [label, change] of [
  ['missing summary', v => { v.summary = {}; }],
  ['wrong domain', v => { v.domain = 'other.com'; }],
  ['future timestamp', v => { v.fetchedAt = new Date(Date.now() + 86400000).toISOString(); }],
  ['unsafe URL', v => { v.keywords[0].url = 'javascript:alert(1)'; }],
  ['missing traffic', v => { delete v.keywords[0].traffic; }],
  ['invalid CPC', v => { v.keywords[0].cpc = 'script'; }],
  ['bad history', v => { v.history[0].traffic = null; }],
  ['negative metric', v => { v.summary.backlinks = -1; }],
  ['bad page', v => { v.topPages[0].topKeyword = {}; }],
  ['oversized cache', v => { v.keywords = Array(101).fill(v.keywords[0]); }],
]) check('cache rejects ' + label, () => { const value = JSON.parse(JSON.stringify(fixture)); change(value); assert.equal(client.isSiteExplorerResult(value, 'example.com'), false); });
async function main() {
  for (const status of [402, 429, 500]) {
    const c = load('src/lib/dataforseo.ts', {}, { fetch: async () => ({ ok: false, status }) });
    await assert.rejects(c.callDataForSeo('x', []), e => e.code === 'PROVIDER_HTTP_' + status); passed++;
  }
  for (const body of [{ status_code: 40200 }, { status_code: 20000, tasks: [{ status_code: 40200 }] }, { status_code: 20000, tasks: [{ status_code: 20000, result: [] }] }]) {
    const c = load('src/lib/dataforseo.ts', {}, { fetch: async () => ({ ok: true, json: async () => body }) });
    await assert.rejects(c.callDataForSeo('x', [])); passed++;
  }
  const timed = load('src/lib/dataforseo.ts', {}, { fetch: async (_, options) => { assert(options.signal); throw Object.assign(new Error(), { name: 'TimeoutError' }); } });
  await assert.rejects(timed.callDataForSeo('x', []), e => e.code === 'PROVIDER_TIMEOUT'); passed++;
  const missing = load('src/lib/dataforseo.ts', {}, { process: { env: {} } });
  await assert.rejects(missing.callDataForSeo('x', []), e => e.code === 'PROVIDER_NOT_CONFIGURED'); passed++;
  let user = null, calls = 0, dbValue = null, fail = false, dbFail = false, reserved = false;
  const cooldowns = new Set();
  const db = {
    from() { return this; }, select() { return this; }, eq() { return this; }, abortSignal() { return this; },
    maybeSingle: async () => ({ data: dbValue ? { data: dbValue } : null, error: dbFail ? { message: 'offline' } : null }),
    rpc: async (name, args) => {
      if (dbFail) return { data: null, error: { message: 'offline' } };
      if (name === 'reserve_seo_site_explorer') {
        if (cooldowns.has(args.p_domain)) return { data: { status: 'cooldown' } };
        if (reserved) return { data: { status: 'busy' } };
        reserved = true;
        return { data: { status: 'reserved', token: '11111111-1111-4111-8111-111111111111' } };
      }
      if (name === 'finish_seo_site_explorer') { reserved = false; dbValue = args.p_data; return { data: true }; }
      if (name === 'fail_seo_site_explorer') { reserved = false; cooldowns.add(args.p_domain); return { data: true }; }
      throw new Error(name);
    },
  };
  const route = load('src/app/api/seo/site-explorer/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options.status, headers: options.headers }) } },
    '@/lib/dataforseo': { ...client, getSiteExplorerData: async domain => { calls++; await new Promise(r => setTimeout(r, 5)); if (fail) throw new client.DataForSeoError('PROVIDER_TIMEOUT', 503); return { ...fixture, domain, fetchedAt: new Date().toISOString() }; } },
    '@/lib/supabase-admin': { createAdminClient: () => db },
    '@/lib/supabase-server': { createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user }, error: null }) } }) },
  });
  const get = query => route.GET({ url: 'https://local/api/seo/site-explorer?' + query });
  assert.equal((await get('domain=example.com')).status, 401); assert.equal(calls, 0); passed++;
  user = { id: 'u1' };
  const offRoute = load('src/app/api/seo/site-explorer/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options.status }) } },
    '@/lib/dataforseo': { ...client, getSiteExplorerData: async () => { calls++; throw new Error('PAID_CALL_WHILE_DISABLED'); } },
    '@/lib/supabase-admin': { createAdminClient: () => db },
    '@/lib/supabase-server': { createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) } }) },
  }, { process: { env: { SEO_SITE_EXPLORER_V3_ENABLED: 'false' } } });
  const off = await offRoute.GET({ url: 'https://local/api/seo/site-explorer?domain=example.com' });
  assert.equal(off.status, 503); assert.equal(off.body.code, 'SEO_V3_DISABLED'); assert.equal(calls, 0); passed++;
  assert.equal((await get('domain=localhost')).status, 400); assert.equal(calls, 0); passed++;
  const concurrent = await Promise.all([get('domain=example.com'), get('domain=example.com')]);
  assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 503]); assert.equal(calls, 1); passed++;
  assert.equal((await get('domain=example.com&refresh=true')).body.cached, true); assert.equal(calls, 1); passed++;
  dbFail = true;
  const before = calls;
  const blocked = await get('domain=cache-fails.example.com');
  assert.equal(blocked.status, 503); assert.equal(blocked.body.code, 'CACHE_UNAVAILABLE'); assert.equal(calls, before); passed++;
  dbFail = false;
  dbValue = { ...fixture, domain: 'old.example.com', fetchedAt: new Date(Date.now() - 8 * 86400000).toISOString() }; fail = true;
  const stale = await get('domain=old.example.com'); assert.equal(stale.status, 200); assert.equal(stale.body.stale, true); passed++;
  dbValue = null;
  const failed = await get('domain=fail.example.com'); assert.equal(failed.status, 503); assert(!failed.body.summary); passed++;
  const priorCalls = calls; await get('domain=fail.example.com'); assert.equal(calls, priorCalls); passed++;
  user = null; assert.equal((await get('domain=example.com')).status, 401); passed++;
  console.log(`PASS ${passed} offline checks. Paid API calls: 0.`);
  if (process.env.SEO_FIXTURE_PATH) fs.writeFileSync(process.env.SEO_FIXTURE_PATH, JSON.stringify(fixture));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
