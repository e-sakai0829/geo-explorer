// Offline browser regression: real React pages and ProjectProvider, mocked network/auth only.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=process.env.GEO_APP_ROOT || path.resolve(__dirname,'..');
const ts=require(path.join(root,'node_modules/typescript'));
let playwright;try {playwright=require(process.env.PLAYWRIGHT_MODULE || 'playwright');} catch {throw Error('Set PLAYWRIGHT_MODULE to an installed playwright package; no installation is performed.');}
const modules={};
for(const [name,file] of Object.entries({'react':'react/cjs/react.development.js','react/jsx-runtime':'react/cjs/react-jsx-runtime.development.js','react-dom':'react-dom/cjs/react-dom.development.js','react-dom/client':'react-dom/cjs/react-dom-client.development.js','scheduler':'scheduler/cjs/scheduler.development.js'})) modules[name]=fs.readFileSync(path.join(root,'node_modules',file),'utf8');
for(const rel of ['src/app/editor/page.tsx','src/app/performance/page.tsx','src/context/ProjectContext.tsx','src/lib/project-async-guard.ts','src/lib/draft-storage.ts','src/lib/measurement-display.ts']) {
 const key=rel.replace(/^src\//,'@/').replace(/\.tsx?$/,''); modules[key]=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
}
modules['next/navigation']=`const React=require('react');const Nav=React.createContext(null);exports.Nav=Nav;exports.useRouter=()=>React.useContext(Nav).router;exports.usePathname=()=>React.useContext(Nav).url.pathname;exports.useSearchParams=()=>React.useContext(Nav).url.searchParams;`;
modules['next/link']=`exports.__esModule=true;exports.default=p=>require('react').createElement('a',p);`;
modules['lucide-react']=`module.exports=new Proxy({}, {get:()=>()=>null});`;
modules['@/context/LanguageContext']=`exports.useLanguage=()=>({lang:'ja',t:{editor_btn_generate:'Generate'}});`;
modules['@/lib/supabase-browser']=`exports.createClient=()=>({auth:{onAuthStateChange(fn){window.authListeners.add(fn);return {data:{subscription:{unsubscribe(){window.authListeners.delete(fn)}}}}}}});`;
const boot=String.raw`
window.authListeners=new Set();window.requests=[];window.printCount=0;window.print=()=>window.printCount++;
window.fetch=(url,options={})=>new Promise((resolve,reject)=>{
 const entry={url,options,resolve:(data,status=200)=>resolve({ok:status>=200&&status<300,json:async()=>data}),reject};window.requests.push(entry);
 // Deliberately ignore abort: old responses must still be rejected by generation checks.
 if(url==='/api/user/project' && !window.delayProjects) entry.resolve({organization:{id:window.owner || 'org1',plan:'starter'},projects:['A','B'].map(id=>({id,name:'Brand '+id,domain:'https://example.com',competitors:[]}))});
 if(url.startsWith('/api/user/articles') && !window.delayLogs) entry.resolve({articles:[]});
});
const React=require('react'),{createRoot}=require('react-dom/client'),{Nav}=require('next/navigation');
const {ProjectProvider,useProject}=require('@/context/ProjectContext');
function Pages(){const ctx=useProject();window.projectState=ctx;return React.createElement(window.routePath==='/performance'?require('@/app/performance/page').default:require('@/app/editor/page').default);}
function App(){const [url,setUrl]=React.useState(new URL('/editor?project=A',location.origin));window.navigate=to=>setUrl(new URL(to,location.origin));window.routePath=url.pathname;const router={push:window.navigate,replace:window.navigate};return React.createElement(Nav.Provider,{value:{url,router}},React.createElement(ProjectProvider,null,React.createElement(Pages)));}
createRoot(document.getElementById('root')).render(React.createElement(React.StrictMode,null,React.createElement(App)));
`;
const bundle=`const process={env:{NODE_ENV:'development'}};const factories={${Object.entries(modules).map(([id,code])=>`${JSON.stringify(id)}:function(module,exports,require){${code}\n}`).join(',')}};const cache={};function require(id){if(cache[id])return cache[id].exports;const m=cache[id]={exports:{}};if(!factories[id])throw Error(id);factories[id](m,m.exports,require);return m.exports;}\n${boot}`;
(async()=>{let browser;const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?bundle:'<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/bundle.js"></script>');});
try {await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await playwright.chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());
await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForSelector('input');
const project=async(id,route='/editor')=>{await page.evaluate(([id,route])=>window.navigate(route+'?project='+id),[id,route]);await page.waitForFunction(id=>window.projectState.loaded&&window.projectState.projectId===id,id);await page.waitForSelector('input');};
const reqs=async(url)=>page.evaluate(url=>window.requests.filter(r=>r.url===url).length,url);
const resolve=async(url,index,data,status=200)=>{await page.evaluate(([url,index,data,status])=>window.requests.filter(r=>r.url===url)[index].resolve(data,status),[url,index,data,status]);await page.evaluate(()=>new Promise(requestAnimationFrame));};
const generate=async()=>{const n=await reqs('/api/generate-article');await page.locator('button[type=submit]').click();await page.waitForFunction(n=>window.requests.filter(r=>r.url==='/api/generate-article').length>n,n);return n;};
await page.locator('input').nth(0).fill('Draft A');let n=await generate();await project('B');await page.locator('input').nth(0).fill('Draft B');await resolve('/api/generate-article',n,{article:'STALE A'});assert.equal(await page.locator('input').nth(0).inputValue(),'Draft B');assert.ok(!(await page.locator('body').innerText()).includes('STALE A'));
await project('A');assert.equal(await page.locator('input').nth(0).inputValue(),'Draft A');n=await generate();await resolve('/api/generate-article',n,{article:'Initial article'});await page.getByRole('button',{name:'手動編集',exact:true}).click();
n=await generate();await page.locator('textarea').fill('');assert.equal(await page.locator('textarea').count(),1);await page.locator('textarea').fill('Edit then undo');await page.locator('textarea').fill('Initial article');await resolve('/api/generate-article',n,{article:'MUST NOT OVERWRITE'});assert.equal(await page.locator('textarea').inputValue(),'Initial article');
n=await generate();await page.locator('input').nth(0).fill('New prompt');await resolve('/api/generate-article',n,{article:'OLD PROMPT RESULT'});assert.equal(await page.locator('textarea').inputValue(),'Initial article');
n=await generate();await page.getByRole('button',{name:'🇺🇸 English',exact:true}).click();await resolve('/api/generate-article',n,{article:'OLD LANGUAGE RESULT'});assert.equal(await page.locator('textarea').inputValue(),'Initial article');
// Quota failure: show unsaved, retain draft through A -> B -> A.
await page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError');};});await page.locator('textarea').fill('Unsaved but retained');await page.getByRole('alert').waitFor();await project('B');await project('A');assert.ok((await page.locator('body').innerText()).includes('Unsaved but retained'));await page.getByRole('alert').waitFor();await page.evaluate(()=>{Storage.prototype.setItem=window.originalSet;});
// Stale rejection/finally cannot clear B loading or show A error.
n=await generate();await project('B');const b=await generate();await page.evaluate(n=>window.requests.filter(r=>r.url==='/api/generate-article')[n].reject(Error('STALE ERROR')),n);await page.evaluate(()=>new Promise(requestAnimationFrame));assert.equal(await page.locator('button[type=submit]').isDisabled(),true);assert.ok(!(await page.locator('body').innerText()).includes('STALE ERROR'));await resolve('/api/generate-article',b,{article:'B result'});
// Actual provider invalid project and sign-out guards.
await page.evaluate(()=>window.navigate('/editor?project=INVALID'));await page.getByRole('status').waitFor();assert.equal(await page.locator('input').count(),0);await project('A');await page.evaluate(()=>{window.authListeners.forEach(fn=>fn('SIGNED_OUT'));});await page.getByRole('status').waitFor();assert.equal(await page.locator('input').count(),0);await page.evaluate(()=>window.authListeners.forEach(fn=>fn('SIGNED_IN')));await page.waitForSelector('input');
// Performance: registration while pending scan must survive latest response.
await project('A','/performance');const register=async(prompt)=>{await page.locator('input').nth(0).fill(prompt);await page.locator('input').nth(1).fill('https://example.com/'+prompt);await page.locator('button[type=submit]').click();};
await register('one');const scan=page.getByRole('button',{name:/1クレジットで再検証/});await scan.first().click();await register('two');await resolve('/api/analyze',0,{brandCited:false,brandMentioned:false,aiResponse:'RESULT A'});assert.ok((await page.locator('body').innerText()).includes('two'));await project('B','/performance');assert.ok(!(await page.locator('body').innerText()).includes('RESULT A'));await project('A','/performance');assert.ok((await page.locator('body').innerText()).includes('two'));
await scan.first().click();const scanN=await reqs('/api/analyze');await project('B','/performance');await resolve('/api/analyze',scanN-1,{brandCited:true,brandMentioned:true,aiResponse:'STALE SCAN'});assert.ok(!(await page.locator('body').innerText()).includes('STALE SCAN'));

// A -> B -> A: old A response cannot apply to the newly mounted A session.
await project('A');n=await generate();await project('B');await project('A');await resolve('/api/generate-article',n,{article:'STALE ABA'});assert.ok(!(await page.locator('body').innerText()).includes('STALE ABA'));
// Pending history never exposes previous-project restore/print buttons.
await page.evaluate(()=>window.delayLogs=true);await project('B');const logCount=await reqs('/api/user/articles?projectId=B');await project('A');await resolve('/api/user/articles?projectId=B',logCount-1,{articles:[{id:'old',title:'STALE HISTORY',prompt:'old',contentMarkdown:'old',date:'2026-09-20'}]});assert.ok(!(await page.locator('body').innerText()).includes('STALE HISTORY'));await page.evaluate(()=>window.delayLogs=false);
// Provider refresh requests return in reverse order, including stale 401.
await page.evaluate(()=>{window.delayProjects=true;void window.projectState.refreshProjects();void window.projectState.refreshProjects();});const pc=await reqs('/api/user/project');await resolve('/api/user/project',pc-1,{organization:{id:'org1',plan:'starter'},projects:['A','B'].map(id=>({id,name:'Brand '+id,domain:'https://example.com',competitors:[]}))});await page.waitForSelector('input');await resolve('/api/user/project',pc-2,{},401);assert.equal(await page.locator('input').count(),2);await page.evaluate(()=>window.delayProjects=false);
// Organization change never restores another organization's scoped draft.
await page.locator('input').nth(0).fill('ORG1 ONLY');await page.evaluate(()=>{window.owner='org2';window.authListeners.forEach(fn=>fn('SIGNED_IN'));});await page.waitForFunction(()=>window.projectState.ownerId==='org2'&&window.projectState.loaded);assert.equal(await page.locator('input').nth(0).inputValue(),'');
assert.deepEqual(errors,[]);console.log('PASS: Chromium + React StrictMode; actual editor/performance/ProjectProvider; project switches, manual edit/undo/prompt/language, quota, stale success/error/finally, registration race, modal isolation, invalid project, sign-out. All API/auth mocked; no external calls.');
} finally {if(browser)await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});


