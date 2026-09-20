const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root,'node_modules/typescript'));
function loader(mocks = {}, env = {}) {
  const cache = new Map();
  function load(rel) {
    if (cache.has(rel)) return cache.get(rel).exports;
    const mod = { exports: {} }; cache.set(rel, mod);
    const code = ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(code, { module: mod, exports: mod.exports, URL, URLSearchParams, Date, Error, TypeError, console,
      process: { env }, setTimeout: fn => { fn(); return 1; }, clearTimeout,
      require(id) {
        if (id in mocks) return mocks[id];
        if (id.startsWith('@/')) return load('src/' + id.slice(2) + '.ts');
        if (id === 'node:crypto') return require(id);
        if (id === 'next/server') return { NextResponse: { json: (body, init = {}) => ({ status: init.status || 200, json: async () => body, body }) } };
        throw new Error('Unmocked dependency forbidden: ' + id);
      } }, { filename: rel });
    return mod.exports;
  }
  return load;
}
module.exports = { loader, root };
