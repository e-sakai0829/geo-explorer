// Offline contract tests. The real provider and Supabase are never called.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../node_modules/typescript');
const root = path.resolve(__dirname, '..');
function load(relative, mocks = {}) {
  const module = { exports: {} };
  const file = path.join(root, relative);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports,
    require: name => { if (Object.hasOwn(mocks, name)) return mocks[name]; throw Error('Unmocked: ' + name); },
    console, URL, Date, Error, process: { env: {} },
  }, { filename: file });
  return module.exports;
}
const gap = load('src/lib/seo-keyword-gap.ts');
const domains = [
  { domain: 'own.example.com', name: '自社', color: '#111' },
  { domain: 'a.example.com', name: '競合A', color: '#222' },
  { domain: 'b.example.com', name: '競合B', color: '#333' },
];
const keyword = (name, position, traffic, volume = 100, cpc = 1.23) => ({
  keyword: name, position, traffic, volume, cpc,
});
const report = (domain, keywords, traffic = 100, count = 20) => ({
  schemaVersion: 3, source: 'dataforseo', domain, fetchedAt: '2026-09-23T00:00:00Z', warnings: [],
  summary: { organicTraffic: traffic, organicKeywords: count,
    pos1_3Count: 2, pos4_10Count: 3, pos11_20Count: 4 },
  keywords,
});
const reports = [
  report(domains[0].domain, [keyword('共通語', 12, 0), keyword('自社語', 1, 8)]),
  report(domains[1].domain, [keyword('共通語', 3, 12), keyword('競合語', 4, null), keyword('共通語', 7, 3)]),
  report(domains[2].domain, [keyword('競合語', 5, 9)], null, null),
];
const built = gap.buildKeywordGap(domains, reports);
assert.equal(built.totalCount, 3);
assert.equal(built.summaries[0].totalTraffic, 100);
assert.equal(built.summaries[0].rankDistribution.pos21_plus, 11);
assert.equal(built.summaries[2].totalTraffic, null);
assert.equal(built.summaries[2].rankDistribution.pos21_plus, null);
const common = built.keywords.find(item => item.keyword === '共通語');
assert.equal(common.domainStats[domains[0].domain].traffic, 0);
assert.equal(common.domainStats[domains[1].domain].rank, 3);
assert.equal(common.domainStats[domains[2].domain].rank, null);
assert.equal(common.domainStats[domains[0].domain].rankChange, null);
assert.equal(common.cpc, 1.23);
assert.equal(built.keywords.find(item => item.keyword === '競合語').domainStats[domains[1].domain].traffic, null);

let user = { id: '11111111-1111-4111-8111-111111111111', email: 'a@example.com' };
let project = { id: '22222222-2222-4222-8222-222222222222', name: '自社', domain: 'own.example.com',
  competitor_domains: ['a.example.com', 'b.example.com'], competitors: ['競合A', '競合B'] };
let providerCalls = 0, providerFails = false;
const db = { auth: { getUser: async () => ({ data: { user }, error: null }) },
  from(table) { this.table = table; return this; }, select() { return this; }, eq() { return this; },
  maybeSingle: async function () { return { data: this.table === 'organizations' ? { id: 'org1' } : project, error: null }; },
};
class NextRequest {
  constructor(url, options = {}) { this.url = String(url); this.nextUrl = new URL(this.url); this.headers = options.headers ?? new Headers(); }
}
const json = (body, opts = {}) => ({ status: opts.status ?? 200, ok: (opts.status ?? 200) < 400, json: async () => body });
const route = load('src/app/api/seo/keyword-gap/route.ts', {
  'next/server': { NextRequest, NextResponse: { json } },
  '@/lib/supabase-server': { createServerSupabaseClient: async () => db },
  '@/lib/observation-contract': { isUuid: value => /^[0-9a-f-]{36}$/i.test(value) },
  '@/lib/dataforseo': { normalizeDomain: value => {
    if (!value || typeof value !== 'string') throw Error('invalid');
    return new URL(value.includes('://') ? value : `https://${value}`).hostname;
  }, isSiteExplorerResult: (value, domain) => value?.schemaVersion === 3 && value.domain === domain },
  '@/app/api/seo/site-explorer/route': { GET: async req => {
    providerCalls++;
    if (providerFails) return json({ error: '保存先を確認できません。' }, { status: 503 });
    return json(reports.find(item => item.domain === req.nextUrl.searchParams.get('domain')));
  } },
  '@/lib/seo-keyword-gap': gap,
});
const req = () => new NextRequest('https://local/api/seo/keyword-gap?projectId=22222222-2222-4222-8222-222222222222');
(async () => {
  user = null;
  assert.equal((await route.GET(req())).status, 401);
  assert.equal(providerCalls, 0);
  user = { id: '11111111-1111-4111-8111-111111111111', email: 'a@example.com' };
  project = { ...project, competitor_domains: [] };
  assert.equal((await route.GET(req())).status, 422);
  assert.equal(providerCalls, 0);
  project = { ...project, competitor_domains: ['a.example.com', 'b.example.com'] };
  const result = await route.GET(req());
  assert.equal(result.status, 200);
  assert.equal((await result.json()).totalCount, 3);
  assert.equal(providerCalls, 3);
  providerFails = true;
  assert.equal((await route.GET(req())).status, 503);
  console.log('PASS keyword gap: 13 transformation and route assertions; zero paid API calls.');
})().catch(error => { console.error(error); process.exitCode = 1; });
