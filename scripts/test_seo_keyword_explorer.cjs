const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/lib/seo-keyword-explorer.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleUnderTest = { exports: {} };
new Function('module', 'exports', compiled)(moduleUnderTest, moduleUnderTest.exports);
const { normalizeKeyword, formatKeywordExplorerResult, isKeywordExplorerResult } = moduleUnderTest.exports;

assert.equal(normalizeKeyword('  梱包　資材  '), '梱包 資材');
assert.equal(normalizeKeyword('  SEO  Tool '), 'seo tool');
for (const bad of ['', 'x', 'x'.repeat(81), '\u0000test', null]) assert.throws(() => normalizeKeyword(bad));

const overview = { items: [{ keyword: '梱包資材', keyword_info: { search_volume: 0, cpc: 0 }, keyword_properties: { keyword_difficulty: 0 }, search_intent_info: { main_intent: 'commercial' } }] };
const related = { items: [
  { keyword_data: { keyword: '梱包 資材', keyword_info: { search_volume: 100, cpc: 1.2 }, keyword_properties: { keyword_difficulty: 24 } } },
  { keyword_data: { keyword: '梱包 資材', keyword_info: { search_volume: 100 } } },
  { keyword_data: { keyword: '梱包資材', keyword_info: { search_volume: 500 } } },
] };
const serp = { items: [
  { type: 'paid', rank_group: 1, url: 'https://ads.example.com' },
  { type: 'organic', rank_group: 1, url: 'https://example.com/page', title: 'Example' },
  { type: 'organic', rank_group: 1, url: 'https://duplicate.example.com' },
  { type: 'organic', rank_group: 2, url: 'javascript:alert(1)', title: 'Unsafe' },
  { type: 'organic', rank_group: 3, url: 'https://other.example.com/', title: 'Other' },
  { type: 'organic', rank_group: 11, url: 'https://eleven.example.com/' },
] };
const result = formatKeywordExplorerResult('梱包資材', overview, related, serp, []);
assert.equal(result.overview.volume, 0);
assert.equal(result.overview.difficulty, 0);
assert.equal(result.overview.cpc, 0);
assert.equal(result.related.length, 1);
assert.deepEqual(result.organicResults.map(item => item.rank), [1, 3]);
assert.equal(result.organicResults[0].domain, 'example.com');
assert.equal(isKeywordExplorerResult(result, '梱包資材'), true);
assert.equal(isKeywordExplorerResult(result, '別KW'), false);
assert.equal(isKeywordExplorerResult({ ...result, overview: { ...result.overview, volume: '100' } }, '梱包資材'), false);
assert.equal(isKeywordExplorerResult({ ...result, organicResults: [{ ...result.organicResults[0], url: 'javascript:alert(1)' }] }, '梱包資材'), false);

const missing = formatKeywordExplorerResult('未取得', null, null, null, ['KW概要を取得できませんでした。']);
assert.equal(missing.overview.volume, null);
assert.equal(missing.related.length, 0);
assert.equal(missing.organicResults.length, 0);
assert.equal(missing.warnings.length, 1);
console.log('PASS KW正規化、実測0/未取得分離、関連KW重複除外、SERP安全URLと順位、欠損処理。Paid API calls: 0.');
