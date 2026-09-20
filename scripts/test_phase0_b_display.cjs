// Offline regression tests: execute production TypeScript and render real JSX.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const React = require(path.join(root, 'node_modules/react'));
const { renderToStaticMarkup } = require(path.join(root, 'node_modules/react-dom/server'));
let language = 'ja', performanceStates = null, stateIndex = 0;
const cache = new Map();
function load(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const source = fs.readFileSync(path.join(root, rel), 'utf8') + (rel.endsWith('performance/page.tsx') ? '\nexport { PerformanceInner };' : '');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true
  }}).outputText;
  const module = { exports: {} };
  function localRequire(id) {
    if (id === '@/lib/measurement-display') return load('src/lib/measurement-display.ts');
    if (id === '@/lib/project-async-guard') return load('src/lib/project-async-guard.ts');
    if (id === '@/lib/useModalBehavior') return { useModalBehavior() {} };
    if (id === '@/context/LanguageContext') return { useLanguage: () => ({ lang: language, t: {} }) };
    if (id === '@/context/ProjectContext') return { useProject: () => ({ projectId: 'p', ownerId: 'o', loaded: true, currentProject: { id: 'p', name: 'Brand', domain: 'https://example.com' } }) };
    if (id === 'next/link') return { __esModule: true, default: props => React.createElement('a', props) };
    if (id === 'react' && rel.endsWith('performance/page.tsx')) return { ...React,
      useEffect() {}, useState: initial => [performanceStates ? performanceStates[stateIndex++] : initial, () => {}] };
    if (['react', 'react/jsx-runtime', 'lucide-react'].includes(id)) return require(require.resolve(id, { paths: [root] }));
    throw new Error('Unexpected dependency (network forbidden): ' + id);
  }
  vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, URL, console }, { filename: rel });
  cache.set(rel, module.exports);
  return module.exports;
}
const { formatMeasuredScore, sanitizeTrackedItems, observationState, observationLabel, qualityLabel } = load('src/lib/measurement-display.ts');
const valid = { id: '1', prompt: 'Question', url: 'https://example.com/article', date: '2026-09-01T00:00:00Z', status: 'verified', lastScannedAt: '2026-09-02T00:00:00Z', brandCited: false, brandMentioned: false };
for (const value of [null, undefined, NaN, Infinity, -Infinity, '0']) assert.equal(formatMeasuredScore(value), '未計測');
assert.equal(formatMeasuredScore(0), '0 pt');
assert.equal(formatMeasuredScore(42), '42 pt');
const restored = sanitizeTrackedItems([null, 0, [], {}, { ...valid, url: 'javascript:alert(1)' }, { ...valid, hasBaseline: true, baselineScannedAt: '2026-08-01', beforeSummary: 'invented', afterStatus: '言及認知あり', unknown: 1 }, { ...valid, id: '2', status: 'pending' }]);
assert.equal(restored.length, 2);
assert.equal(restored[0].hasBaseline, false);
for (const key of ['beforeSummary', 'baselineScannedAt', 'afterStatus', 'unknown']) assert.equal(key in restored[0], false);
assert.equal(observationState(restored[0]), 'none');
assert.equal(observationState(restored[1]), 'unmeasured');
assert.equal(sanitizeTrackedItems([valid, valid]).length, 1);
assert.equal(sanitizeTrackedItems({}).length, 0);
for (const [patch, expected] of [[{ brandCited: true }, 'cited'], [{ brandMentioned: true }, 'mentioned'], [{}, 'none'], [{ brandCited: 'true' }, 'unmeasured'], [{ lastScannedAt: 'bad' }, 'unmeasured'], [{ status: 'failed' }, 'unmeasured']]) assert.equal(observationState({ ...valid, ...patch }), expected);
const Report = load('src/components/WhiteLabelReportModal.tsx').WhiteLabelReportModal;
function renderReport(score, breakdown = null) {
  return renderToStaticMarkup(React.createElement(Report, { isOpen: true, onClose() {}, targetBrand: 'Brand', targetDomain: 'example.com', atsScore: score, atsBreakdown: breakdown, competitors: [] }));
}
const missing = renderReport(null);
assert.ok(missing.includes('未計測'));
assert.ok(!missing.includes('0 / 100 pt'));
assert.ok(missing.includes('未登録 (0社)'));
assert.ok(renderReport(0).includes('0 / 100 pt'));
const invalid = renderReport(Infinity, { directMentionScore: NaN, citationDomainScore: Infinity, fanoutCoverageScore: null });
assert.ok(!invalid.includes('NaN pt') && !invalid.includes('Infinity'));
const Performance = load('src/app/performance/page.tsx').PerformanceInner;
for (language of ['ja', 'en', 'zh-TW']) {
  for (const patch of [{}, { brandMentioned: true }, { brandCited: true }, { status: 'pending' }]) {
    const item = { ...valid, ...patch, hasBaseline: true, beforeSummary: 'FORGED_BASELINE', beforeDescription: 'FORGED_BASELINE', afterStatus: 'STALE_STATUS' };
    performanceStates = ['Brand', 'https://example.com', true, [item], '', '', null, item]; stateIndex = 0;
    const html = renderToStaticMarkup(React.createElement(Performance));
    const label = observationLabel(item, language);
    assert.ok(html.split(label).length >= 3, 'List and detail must both use production observation label');
    assert.ok(!html.includes('FORGED_BASELINE') && !html.includes('STALE_STATUS'));
  }
  assert.ok(qualityLabel(language).length > 0);
}
// Verify the JSX call site preserves missing data instead of coercing it to zero.
const dashboard = ts.createSourceFile('dashboard.tsx', fs.readFileSync(path.join(root, 'src/app/dashboard/page.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let checked = false;
function visit(node) {
  if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(dashboard) === 'WhiteLabelReportModal') {
    const prop = node.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(dashboard) === 'atsScore');
    assert.equal(prop.initializer.expression.getText(dashboard), 'stats.atsScore'); checked = true;
  }
  ts.forEachChild(node, visit);
}
visit(dashboard); assert.ok(checked);
console.log('PASS: production helpers, actual report/performance JSX (3 languages × 4 states), malformed storage, and dashboard null propagation');
