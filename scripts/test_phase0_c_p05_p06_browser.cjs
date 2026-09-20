// Offline browser regression: real React pages and ProjectProvider, mocked network/auth only.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=process.env.GEO_APP_ROOT || path.resolve(__dirname,'..');
const ts=require(path.join(root,'node_modules/typescript'));
let playwright;try {playwright=require(process.env.PLAYWRIGHT_MODULE || 'playwright');} catch {throw Error('Set PLAYWRIGHT_MODULE to an installed playwright package; no installation is performed.');}
const modules={};
for(const [name,file] of Object.entries({'react':'react/cjs/react.development.js','react/jsx-runtime':'react/cjs/react-jsx-runtime.development.js','react-dom':'react-dom/cjs/react-dom.development.js','react-dom/client':'react-dom/cjs/react-dom-client.development.js','scheduler':'scheduler/cjs/scheduler.development.js'})) modules[name]=fs.readFileSync(path.join(root,'node_modules',file),'utf8');
for(const rel of ['src/app/prompts/page.tsx','src/app/dashboard/page.tsx','src/components/ATSBenchmarkCard.tsx','src/components/DynamicAdviceCard.tsx','src/components/FanoutExplorerCard.tsx','src/components/BeforeAfterTrackerCard.tsx','src/components/WhiteLabelReportModal.tsx','src/components/OutreachModal.tsx','src/lib/useModalBehavior.ts','src/app/editor/page.tsx','src/app/performance/page.tsx','src/context/ProjectContext.tsx','src/lib/project-async-guard.ts','src/lib/draft-storage.ts','src/lib/measurement-display.ts']) {
 const key=rel.replace(/^src\//,'@/').replace(/\.tsx?$/,''); modules[key]=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
}
modules['@/components/RecommendTrendChart']=`exports.RecommendTrendChart=()=>null;`;
modules['next/navigation']=`const React=require('react');const Nav=React.createContext(null);exports.Nav=Nav;exports.useRouter=()=>React.useContext(Nav).router;exports.usePathname=()=>React.useContext(Nav).url.pathname;exports.useSearchParams=()=>React.useContext(Nav).url.searchParams;`;
modules['next/link']=`exports.__esModule=true;exports.default=p=>require('react').createElement('a',p);`;
modules['lucide-react']=`module.exports=new Proxy({}, {get:()=>()=>null});`;
modules['@/context/LanguageContext']=`exports.useLanguage=()=>({lang:'ja',t:{editor_btn_generate:'Generate'}});`;
modules['@/lib/supabase-browser']=`const user={id:'local'};const client={auth:{getUser:async()=>({data:{user}}),onAuthStateChange(fn){window.authListeners.add(fn);return {data:{subscription:{unsubscribe(){window.authListeners.delete(fn)}}}}}}};exports.createClient=()=>client;`;
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
function Pages(){const ctx=useProject();window.projectState=ctx;return React.createElement(window.routePath==='/prompts'?require('@/app/prompts/page').default:window.routePath==='/dashboard'?require('@/app/dashboard/page').default:window.routePath==='/performance'?require('@/app/performance/page').default:require('@/app/editor/page').default);}
function App(){const [url,setUrl]=React.useState(new URL('/dashboard?project=A',location.origin));window.navigate=to=>setUrl(new URL(to,location.origin));window.routePath=url.pathname;const router={push:window.navigate,replace:window.navigate};return React.createElement(Nav.Provider,{value:{url,router}},React.createElement(ProjectProvider,null,React.createElement(Pages)));}
createRoot(document.getElementById('root')).render(React.createElement(React.StrictMode,null,React.createElement(App)));
`;
const bundle=`const process={env:{NODE_ENV:'development'}};const factories={${Object.entries(modules).map(([id,code])=>`${JSON.stringify(id)}:function(module,exports,require){${code}\n}`).join(',')}};const cache={};function require(id){if(cache[id])return cache[id].exports;const m=cache[id]={exports:{}};if(!factories[id])throw Error(id);factories[id](m,m.exports,require);return m.exports;}\n${boot}`;
(async()=>{let browser;const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?bundle:'<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/bundle.js"></script>');});
try {await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await playwright.chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());

await page.goto('http://127.0.0.1:'+server.address().port);
await page.waitForFunction(()=>window.requests.some(r=>r.url.startsWith('/api/user/stats?')));
const empty={hasScanData:false,atsScore:null,competitorTopAtsScore:null,citationRate:null,vsPromptWinRate:null,avgRank:null,domainCoverageRate:null,trend:[]};
const settle=async(data)=>{await page.evaluate(data=>window.requests.filter(r=>r.url.startsWith('/api/user/stats?')&&!r.done).forEach(r=>{r.done=true;r.resolve(data);}),data);await page.evaluate(()=>new Promise(requestAnimationFrame));};
await settle({...empty,hasScanData:true,atsScore:0,citationRate:0,recentAttemptWarnings:[{promptId:'prompt-A',outcome:'failure',measuredAt:'2026-09-20T00:00:00Z',lastSuccessMeasuredAt:'2026-09-19T00:00:00Z'}]});
await page.getByRole('alert').waitFor();assert((await page.locator('body').innerText()).includes('前回成功時の値'));
assert(!(await page.locator('body').innerText()).includes('Google AIO ソースリンク'));
const n=await page.evaluate(()=>window.requests.length);
await page.getByLabel('観測モデル').selectOption('gemini-2.0-flash');
await page.waitForFunction(n=>window.requests.length>n,n);
assert(!(await page.locator('body').innerText()).includes('prompt-A'));
const old=await page.evaluate(()=>window.requests.filter(r=>r.url.includes('model=gemini-2.0-flash')).length);
await page.evaluate(()=>window.navigate('/dashboard?project=B'));
await page.waitForFunction(()=>window.projectState.projectId==='B');
await page.evaluate(()=>window.requests.filter(r=>r.url.includes('model=gemini-2.0-flash')).forEach(r=>r.resolve({hasScanData:true,atsScore:99,trend:[],recentAttemptWarnings:[{promptId:'STALE-A',outcome:'failure'}]})));
await page.evaluate(()=>new Promise(requestAnimationFrame));assert(!(await page.locator('body').innerText()).includes('STALE-A'));
await page.evaluate(()=>window.requests.filter(r=>r.url.includes('projectId=B')).forEach(r=>r.resolve({error:'観測データを取得できませんでした。'},503)));
await page.getByRole('alert').waitFor();assert(!(await page.locator('body').innerText()).includes('まだ計測データがありません'));

await page.evaluate(()=>window.navigate('/prompts?project=B'));
await page.waitForFunction(()=>window.requests.some(r=>r.url.startsWith('/api/user/logs?')&&r.url.includes('projectId=B')));
await page.evaluate(()=>window.requests.filter(r=>r.url.startsWith('/api/user/logs?')&&r.url.includes('projectId=B')).forEach(r=>r.resolve({logs:[{id:'logB',prompt:'Prompt B fixture',date:'2026-09-20T00:00:00Z',surface:'gemini_api',scoreVersion:'v2',modelName:'gemini-3.6-flash',locale:'ja-JP',outcome:'success',brandMentioned:false,brandCited:false,rawResponse:'RESTORED B'}]})));
await page.getByRole('button',{name:/結果を表示/}).click();
assert((await page.locator('body').innerText()).includes('RESTORED B'));
assert((await page.locator('body').innerText()).includes('Gemini API / v2 / gemini-3.6-flash / ja-JP'));
await page.evaluate(()=>window.navigate('/prompts?project=A'));
await page.waitForFunction(()=>window.projectState.projectId==='A');
assert(!(await page.locator('body').innerText()).includes('RESTORED B'));
assert.deepEqual(errors,[]);
console.log('PASS actual dashboard Chromium/StrictMode: zero and freshness, model switching, stale project response rejection, DB error visibility. History restore and project isolation verified. Chart rendering mocked; APIs/auth mocked.');
} finally {if(browser)await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
