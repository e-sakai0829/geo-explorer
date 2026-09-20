// Additional offline adversarial tests: production module/Route execution, no paid API.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const http=require('node:http'),net=require('node:net'),zlib=require('node:zlib'),{getEventListeners}=require('node:events');
const root=process.env.GEO_APP_ROOT||path.resolve(__dirname,'..');const ts=require(path.join(root,'node_modules/typescript'));
function load(rel,localRequire=require,globals={}){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,rel),'utf8'),{compilerOptions:{module:1,target:9,esModuleInterop:true}}).outputText;new Function('require','module','exports',...Object.keys(globals),code)(localRequire,m,m.exports,...Object.values(globals));return m.exports;}
async function run(){
 const {safeFetch,isPrivateOrBlockedIp,validateUrl,MAX_BODY_BYTES}=load('src/lib/safe-fetch.ts');
 for(const ip of ['fec0::1','64:ff9b:1::a00:1','2001:2::1','3fff::1','5f00::1','::127.0.0.1','2001::1','2002:0808:0808::1','fe80::1%lo']) assert.equal(isPrivateOrBlockedIp(ip),true,ip);
 for(const ip of ['8.8.8.8','2606:4700:4700::1111','::ffff:8.8.8.8']) assert.equal(isPrivateOrBlockedIp(ip),false,ip);
 for(const url of ['http://user:pass@example.com','http://example.com:8080','https://example.com:80','ftp://example.com','http://localhost.']) assert.throws(()=>validateUrl(url));
 const dns=async()=>['93.184.216.34'];let connectCount=0;
 let timer;const deadlineTest=safeFetch('http://test.example/',{timeoutMs:40,dnsLookup:()=>new Promise(()=>{})});
 try{await assert.rejects(Promise.race([deadlineTest,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('WATCHDOG: DNS deadline failed')),400);})]),/Overall request timeout/);}finally{clearTimeout(timer);}
 const already=new AbortController();already.abort();await assert.rejects(safeFetch('http://test.example/',{signal:already.signal,dnsLookup:async()=>{throw Error('DNS must not run');}}),/aborted/);
 // Production resolver path: cancel outstanding DNS work, no OS/public DNS used.
 let cancelled=0;class Resolver {resolve4(){return new Promise(()=>{});}resolve6(){return new Promise(()=>{});}cancel(){cancelled++;}}
 const native=load('src/lib/safe-fetch.ts',id=>id==='node:dns'?{promises:{Resolver}}:require(id));await assert.rejects(native.safeFetch('http://test.example/',{timeoutMs:30}),/timeout/);assert.ok(cancelled>0);
 const sockets=new Set();let lastSocket;const pending=new Set();
 const server=http.createServer((req,res)=>{
  if(req.url==='/forever'){res.writeHead(200);res.write('partial');}
  else if(req.url==='/encoding'){res.writeHead(200,{'Content-Encoding':'br'});res.write('pending');}
  else if(req.url==='/redirect'){res.writeHead(302,{Location:'/ok'});res.write('never-ending redirect body');}
  else if(req.url==='/drip'){const t=setTimeout(()=>{pending.delete(t);res.writeHead(302,{Location:'/drip2'});res.end();},40);pending.add(t);}
  else if(req.url==='/drip2'){const t=setTimeout(()=>{pending.delete(t);res.end('late');},100);pending.add(t);}
  else if(req.url==='/wire'){const gz=zlib.gzipSync('');gz[3]|=8;res.writeHead(200,{'Content-Encoding':'gzip'});res.write(Buffer.concat([gz.subarray(0,10),Buffer.alloc(MAX_BODY_BYTES+1,97),Buffer.from([0]),gz.subarray(10)]));res.end();}
  else if(req.url==='/truncated'){res.writeHead(200,{'Content-Encoding':'gzip','Content-Length':999});res.write(Buffer.from([31,139,8]));res.destroy();}
  else {res.writeHead(200,{'Content-Type':'text/html'});res.end(JSON.stringify({host:req.headers.host,cookie:req.headers.cookie,auth:req.headers.authorization}));}
 });
 server.on('connection',s=>{sockets.add(s);s.on('close',()=>sockets.delete(s));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const connector=opts=>{connectCount++;lastSocket=net.connect(server.address().port,'127.0.0.1');return lastSocket;};
 const options={dnsLookup:dns,createConnection:connector};
 try{
  for(const kind of ['timeout','abort','encoding','truncated']){
   const ac=new AbortController();let at;const work=safeFetch('http://test.example/'+(kind==='encoding'?'encoding':kind==='truncated'?'truncated':'forever'),{...options,signal:ac.signal,timeoutMs:60});
   if(kind==='abort')at=setTimeout(()=>ac.abort(),25);
   try{await assert.rejects(work,kind==='timeout'?/timeout/:kind==='abort'?/aborted/:kind==='encoding'?/Unsupported Content-Encoding/:/socket|aborted|hang up|stream/i);}finally{clearTimeout(at);}
   assert.equal(lastSocket.destroyed,true,kind+' must destroy socket');assert.equal(getEventListeners(ac.signal,'abort').length,0,kind+' must remove listeners');
  }
  const redirectSockets=[];const ac=new AbortController();await safeFetch('http://test.example/redirect',{...options,signal:ac.signal,createConnection:opts=>{const s=connector(opts);redirectSockets.push(s);return s;}});assert.equal(redirectSockets.length,2);assert.ok(redirectSockets.every(s=>s.destroyed));assert.equal(getEventListeners(ac.signal,'abort').length,0);
  await assert.rejects(safeFetch('http://test.example/wire',options),/maximum allowed limit/);assert.equal(lastSocket.destroyed,true);
  await assert.rejects(safeFetch('http://test.example/drip',{...options,timeoutMs:70}),/timeout/);assert.equal(lastSocket.destroyed,true);
  let dnsCalls=0,pinCalls=0;const pinned=await safeFetch('http://test.example/ok',{dnsLookup:async()=>{dnsCalls++;return dnsCalls===1?['93.184.216.34']:['127.0.0.1'];},createConnection:opts=>{
   assert.equal(opts.host,'test.example');for(const all of [false,true])opts.lookup('test.example',{all},(err,address,family)=>{assert.equal(err,null);assert.deepEqual(all?address:[{address,family}],[{address:'93.184.216.34',family:4}]);pinCalls++;});return connector(opts);
  },headers:{Host:'evil.example',Authorization:'secret',Cookie:'secret','Accept-Encoding':'br'}});assert.equal(dnsCalls,1);assert.equal(pinCalls,2);assert.deepEqual(JSON.parse(pinned.body),{host:'test.example'});
  const literal=await safeFetch('http://[2606:4700:4700::1111]/ok',options);assert.equal(JSON.parse(literal.body).host,'[2606:4700:4700::1111]');
  const before=connectCount;let resolveLate;const late=safeFetch('http://test.example/',{...options,timeoutMs:30,dnsLookup:()=>new Promise(r=>resolveLate=r)});await assert.rejects(late,/timeout/);resolveLate(['93.184.216.34']);await new Promise(setImmediate);assert.equal(connectCount,before,'late DNS must not connect');
 }finally{for(const t of pending)clearTimeout(t);server.closeAllConnections();await new Promise(r=>server.close(r));}
 // Invoke actual POST, counting model calls instead of looking for source strings.
 let mode='ok',called=0,fetchCalled=0,authenticated=true;
 const post=load('src/app/api/suggest-prompts/route.ts',id=>{
  if(id==='next/server')return {NextResponse:{json:(body,init={})=>({body,status:init.status||200})}};
  if(id==='@/lib/supabase-server')return {createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:authenticated?{id:'test'}:null}})}})};
  if(id==='@google/genai')return {GoogleGenAI:class{models={generateContent:async()=>{called++;return {candidates:[{content:{parts:[{text:'[{"promptText":"Test suggestion"}]'}]}}]};}};}};
  if(id==='@/lib/safe-fetch')return {validateUrl,safeFetch:async(url,opts)=>{fetchCalled++;assert.ok(opts.signal);if(mode==='throw')throw Error('fetch rejected');return {status:mode==='304'?304:mode==='404'?404:200,statusText:'test',headers:{'content-type':mode==='binary'?'application/pdf':'text/html'},body:mode==='empty'?'<script>ignored</script>':'<p>Valid content</p>'};}};
  throw Error(id);
 },{process:{env:{GEMINI_API_KEY:'offline-test'}},console:{warn(){},error(){}}}).POST;
 for(mode of ['throw','304','404','empty','binary','ok']){const ac=new AbortController();const n=called;const result=await post({json:async()=>({url:'https://test.example/'}),signal:ac.signal});assert.equal(result.status,mode==='ok'?200:400);assert.equal(called-n,mode==='ok'?1:0,mode);}
 let n=called,f=fetchCalled;assert.equal((await post({json:async()=>({url:'http://127.0.0.1/'}),signal:new AbortController().signal})).status,400);assert.equal(fetchCalled,f);assert.equal(called,n);
 authenticated=false;assert.equal((await post({json:async()=>({url:'https://test.example/'}),signal:new AbortController().signal})).status,401);assert.equal(fetchCalled,f);authenticated=true;
 const ac=new AbortController();ac.abort();mode='ok';assert.equal((await post({json:async()=>({url:'https://test.example/'}),signal:ac.signal})).status,400);assert.equal(called,n);
 console.log('PASS: P0-8 edges: reserved IPv6, DNS deadline/cancel/late result, actual pinned lookup, socket destruction, abort listener cleanup, wire limit, cumulative redirects, actual POST + zero paid calls on failures.');
}
module.exports=run;if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
