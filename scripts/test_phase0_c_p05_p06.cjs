const assert = require('node:assert/strict');
const { loader } = require('./p056-test-loader.cjs');
const json = value => JSON.parse(JSON.stringify(value));
const id = n => '00000000-0000-4000-8000-' + String(n).padStart(12,'0');
const stamp = n => `2026-09-${String(n).padStart(2,'0')}T00:00:00.000Z`;
async function run() {
  const load = loader();
  const ats = load('src/lib/ats-calculator.ts');
  for (const url of ['https://example.com', 'https://www.example.com./x', 'https://blog.example.com']) assert(ats.matchesOfficialHost(url,'example.com'));
  for (const url of ['https://notexample.com','https://example.com.attacker.com','https://fake-example.com','ftp://example.com','https://x@example.com','javascript:example.com','https://example..com','']) assert(!ats.matchesOfficialHost(url,'example.com'),url);
  assert.equal(ats.calculateCitationDomainScore('A','example.com',[{url:'https://evil.test',domain:'example.com',title:'A'}]),0);
  assert.equal(ats.calculateCitationDomainScore('A',undefined,[]),null);
  for (const [brand,domain] of [['A','a.test'],['B','b.test']]) assert.equal(ats.calculateCitationDomainScore(brand,domain,[{url:'https://'+domain}]),40);
  assert.equal(ats.calculateCitationDomainScore('A','a.test',[{url:'https://nikkei.com.evil.test',mentionedBrands:['A']}]),15);
  assert.equal(ats.calculateFanoutCoverageScore(0,0),null);
  assert.equal(ats.calculateFanoutCoverageScore(0,2),0);
  assert.equal(ats.calculateFanoutCoverageScore(2,2),20);
  const calc = ats.calculateATS({targetBrand:'A',targetDomain:'a.test',competitors:['B'],competitorDomains:{B:'b.test'},citations:[],brandMentions:[],fanoutQueries:['q'],coveredFanoutsPerBrand:{A:0,B:0}});
  assert.equal(calc.targetATS,0); assert.equal(calc.competitorATSMap.B,0);
  console.log('PASS scoring: host boundaries, forged URL/domain, symmetric 0 and missing coverage');

  const writer = load('src/lib/observation-writer.ts');
  const base = {logId:id(1),promptId:id(2),surface:'gemini_api',modelName:'gemini-3.6-flash',scoreVersion:'v2',locale:'ja',outcome:'success',measuredAt:stamp(1),targetAtsScore:0,directMentionScore:0,citationDomainScore:0,fanoutCoverageScore:0};
  const payload = writer.buildObservationPayload(base);
  assert.equal(payload.locale,'ja-JP'); assert.equal(payload.target_ats_score,0); assert.equal(payload.ai_overview_present,false);
  assert.equal(base.locale,'ja');
  for (const patch of [{logId:'bad'},{promptId:''},{measuredAt:undefined},{measuredAt:'2026-02-30T00:00:00.000Z'},{modelName:'UNKNOWN'},{surface:'legacy_unknown'},{locale:'xx'},{targetAtsScore:NaN},{targetAtsScore:101},{targetAtsScore:0.5},{targetAtsScore:5},{competitorAtsScores:{A:Infinity}},{rank:0}]) assert.throws(()=>writer.buildObservationPayload({...base,...patch}),JSON.stringify(patch));
  for (const outcome of ['failure','unmeasured']) {
    const p = writer.buildObservationPayload({...base,outcome,competitorAtsScores:{A:NaN},errorMessage:'API SECRET request',brandCited:true,rank:2});
    assert.equal(p.target_ats_score,null); assert.equal(p.direct_mention_score,null); assert.equal(p.rank,null); assert.deepEqual(json(p.competitor_ats_scores),{}); assert(!p.error_message.includes('SECRET'));
  }
  assert.equal((await writer.writeObservationLog({from:()=>({insert:()=>({select:()=>({single:async()=>({data:{id:id(1)}})})})})},base)).success,true);
  assert.equal((await writer.writeObservationLog({from:()=>{throw Error('network');}},base)).success,false);
  console.log('PASS writer: required metadata, finite integers, NULL normalization, immutable inputs, DB errors');

  const {aggregateObservations} = load('src/lib/observation-stats.ts');
  const scope = {surface:'gemini_api',modelName:base.modelName,locale:'ja-JP',promptIds:[id(2),id(3)],periodStart:stamp(1),periodEnd:stamp(30)};
  const row = (n,p,score,time=10,extra={}) => ({id:id(n),prompt_id:id(p),surface:scope.surface,model_name:scope.modelName,locale:scope.locale,score_version:'v2',outcome:'success',measured_at:stamp(time),target_ats_score:score,brand_cited:false,...extra});
  let result = aggregateObservations([row(1,2,100),row(2,3,0),row(3,3,100,11,{locale:'en-US'}),row(4,3,100,11,{score_version:'v1'}),row(5,3,100,11,{model_name:'fallback'}),row(6,3,100,11,{surface:'google_aio_serp'})],scope);
  assert.equal(result.atsScore,50); assert.equal(result.validScoreCount,2);
  result=aggregateObservations([row(1,2,100,2),row(2,2,null,3),row(3,2,null,4,{outcome:'failure'}),row(4,3,0,5)],scope);
  assert.equal(result.atsScore,0); assert.equal(result.recentAttemptWarnings.length,1); assert.equal(result.recentAttemptWarnings[0].lastSuccessMeasuredAt,stamp(3));
  assert.equal(result.atsBreakdown.directMentionScore,null);
  result=aggregateObservations([row(1,2,100,2,{fanout_queries:['old']}),row(2,2,0,3,{fanout_queries:[]}),row(3,3,100,1,{fanout_queries:['other']})],scope);
  assert.deepEqual(json(result.fanoutDiff.dropped),['old']); assert.equal(result.fanoutDiff.promptId,id(2));
  assert.equal(aggregateObservations([row(1,2,100),row(2,3,0)],scope).fanoutDiff,null);
  result=aggregateObservations([row(1,2,100,2),row(2,2,0,2),row(3,3,100,2)],scope);
  assert.equal(result.atsScore,50); assert.equal(result.trend[0].atsScore,50); assert.equal(result.trend[0].promptTotalCount,2);
  result=aggregateObservations([row(1,2,100,2,{competitor_ats_scores:{B:20}}),row(2,3,null,3,{competitor_ats_scores:{B:100}})],scope);
  assert.equal(result.competitorTopAtsScore,20); assert.equal(result.comparisonSelfAtsScore,100); assert.equal(result.comparisonSampleCount,1);
  result=aggregateObservations([row(1,2,null,2,{outcome:'unmeasured'}),row(2,2,null,3,{outcome:'failure'})],scope);
  assert.equal(result.failureRate,0.5); assert.equal(result.unmeasuredCount,1); assert.equal(result.atsScore,null);
  assert.equal(aggregateObservations([],scope).failureRate,null);
  console.log('PASS aggregation: five keys, latest NULL, zero population, paired competitors, per-prompt warnings, stable ties and same-prompt fanout');

  let calls=[], writes=[], failSave=false, failPrimary=true;
  const mockDb = { from:()=>({insert:p=>({select:()=>({single:async()=>{ writes.push(p); return failSave?{error:{}}:{data:{id:p.id}}; }})})}) };
  const serviceLoad=loader({'@google/genai':{GoogleGenAI:class{models={generateContent:async p=>{calls.push(p.model);if(failPrimary&&calls.length===1)throw Error('provider secret');return {candidates:[{content:{parts:[{text:'No brand found.'}]},groundingMetadata:{webSearchQueries:[]}}]};}};}}});
  const service=serviceLoad('src/lib/observed-scan.ts');
  const engine=serviceLoad('src/lib/scan-engine.ts');
  const emptyInput={targetBrand:'Alpha',targetDomain:'alpha.example',competitors:['Beta'],scanText:'',webSources:[],searchQueries:[]};
  assert.equal(engine.evaluateScan(emptyInput).ats.targetATS,null);
  const spoof=engine.evaluateScan({...emptyInput,scanText:'General response',webSources:[{title:'Alpha Official',url:'https://alpha.example.attacker.test'}]});
  assert.equal(spoof.brandCited,false); assert.equal(spoof.ats.targetBreakdown.citationDomainScore,0);
  assert.equal(engine.estimateRank('1. Beta\n\nAlpha is not recommended.','Alpha').rank,0);
  assert.equal(engine.evaluateScan({...emptyInput,targetBrand:'',webSources:[{url:'https://unrelated.test',title:'Unrelated'}]}).brandCited,false);
  loader({'../src/lib/scan-engine':engine})('scripts/test_scan_engine.ts');
  const input={promptId:id(2),prompt:'q',targetBrand:'A',targetDomain:'a.test',competitors:['B'],locale:'ja',apiKey:'fake'};
  const observed=await service.executeObservedScan(mockDb,input);
  assert.equal(calls.length,2); assert.equal(writes[0].outcome,'failure'); assert.equal(writes[1].outcome,'success'); assert.notEqual(writes[0].id,writes[1].id);
  assert.equal(writes[1].model_name,'gemini-2.0-flash'); assert.equal(writes[1].target_ats_score,null); assert.deepEqual(json(observed.raw.searchQueries),[]);
  calls=[];writes=[];failSave=true;
  await assert.rejects(service.executeObservedScan(mockDb,input),/OBSERVATION_SAVE_FAILED/); assert.equal(calls.length,1);
  calls=[];failPrimary=false;
  await assert.rejects(service.executeObservedScan(mockDb,input),/OBSERVATION_SAVE_FAILED/); assert.equal(calls.length,1);
  console.log('PASS actual scan service: fallback model separation and save failure never triggers paid fallback');

  // Exercise the real stats handler with a PostgREST-shaped in-memory store.
  function database(tables, faults={}) {
    return {auth:{getUser:async()=>({data:{user:{id:id(9)}}})},rpc:async()=>({}),from(table){
      let data=[...(tables[table]||[])], selected, payload;
      const chain={select:s=>{selected=s;return chain},eq:(k,v)=>{data=data.filter(r=>r[k]===v);return chain},in:(k,vs)=>{data=data.filter(r=>vs.includes(r[k]));return chain},lt:(k,v)=>{data=data.filter(r=>r[k]<v);return chain},neq:(k,v)=>{data=data.filter(r=>r[k]!==v);return chain},order:()=>chain,limit:n=>{data=data.slice(0,n);return chain},
        insert:p=>{payload=p;data=[{...p,id:id(8)}];return chain},update:()=>chain,
        maybeSingle:async()=>({data:data[0]||null,error:faults[table]}),single:async()=>({data:data[0]||null,error:faults[table]}),
        range:async(a,b)=>({data:data.slice(a,b+1),error:faults[table]}),then:(resolve,reject)=>Promise.resolve({data,error:faults[table]}).then(resolve,reject)};
      return chain;
    }};
  }
  const tables={organizations:[{id:id(7),user_id:id(9),used_credits:0,monthly_credits:10}],projects:[{id:id(6),organization_id:id(7),name:'A',domain:'a.test',competitors:[]}],tracked_prompts:[{id:id(2),project_id:id(6),prompt_text:'q',target_locale:'ja'}],prompt_analysis_logs:Array.from({length:1201},(_,i)=>row(i+1,2,i===1200?0:100,2))};
  let db=database(tables), apiCalls=0;
  const routeLoad=loader({'@/lib/supabase-server':{createServerSupabaseClient:async()=>db},'@/lib/supabase-admin':{createAdminClient:()=>db},'@google/genai':{GoogleGenAI:class{models={generateContent:async()=>{apiCalls++;throw Error('unexpected external call');}};}}},{GEO_OBSERVATION_V2_ENABLED:'true',GEMINI_API_KEY:'fake',CRON_SECRET:'local'});
  const route=routeLoad('src/app/api/user/stats/route.ts');
  const request={nextUrl:new URL('http://localhost/api/user/stats?projectId='+id(6))};
  let res=await route.GET(request); assert.equal(res.status,200); assert.equal(res.body.atsScore,0,'row beyond default 1000 must be included');
  res=await route.GET({nextUrl:new URL('http://localhost/api/user/stats?projectId='+id(99))});assert.equal(res.status,404);
  res=await route.GET({nextUrl:new URL(request.nextUrl+'&scoreVersion=v1')});assert.equal(res.status,400);
  db=database(tables,{prompt_analysis_logs:{code:'XX',message:'DB failure'}});res=await route.GET(request);assert.equal(res.status,503);
  db=database(tables,{prompt_analysis_logs:{code:'42703',message:'column surface not found'}});res=await route.GET(request);assert.equal(res.body.code,'OBSERVATION_SCHEMA_PENDING');
  const analyze=routeLoad('src/app/api/analyze/route.ts');
  const scanRequest={json:async()=>({projectId:id(6),prompt:'q',targetLocale:'ja'})};
  for(const table of ['organizations','projects','tracked_prompts','prompt_analysis_logs']){
    db=database(tables,{[table]:{message:'DB failed'}});res=await analyze.POST(scanRequest);assert.equal(res.status,503,table);assert.equal(apiCalls,0);
  }
  db=database({...tables,organizations:[]});res=await analyze.POST(scanRequest);assert.equal(res.status,403);assert.equal(apiCalls,0);
  db=database(tables,{prompt_analysis_logs:{code:'42703'}});
  res=await routeLoad('src/app/api/cron/weekly-scan/route.ts').GET({headers:{get:()=> 'Bearer local'}});assert.equal(res.status,503);assert.equal(apiCalls,0);
  console.log('PASS actual API handlers: pagination >1000, ownership, v1 rejection, schema/DB errors, no paid calls before FK/schema preparation');

  // Full handlers + real common writer/scan service; only provider and database transport are mocked.
  let saved=[],credits=0,updates=0,saveFault=false,providerFault=false;
  const fullDb={auth:{getUser:async()=>({data:{user:{id:id(9)}}})},rpc:async()=>{credits++;return {};},from(table){
    let inserted,updating=false;
    const c={select:()=>c,eq:()=>c,in:()=>c,neq:()=>c,order:()=>c,limit:()=>c,insert:p=>{inserted=p;return c},update:()=>{updating=true;return c},
      maybeSingle:async()=>({data:(tables[table]||[])[0]}),single:async()=>{if(inserted){saved.push(inserted);return saveFault?{error:{}}:{data:{id:inserted.id}};}return {data:(tables[table]||[])[0]};},
      then:(resolve,reject)=>{if(updating)updates++;return Promise.resolve({data:tables[table]||[],error:null}).then(resolve,reject);}};
    return c;
  }};
  const fullLoad=loader({'@/lib/supabase-server':{createServerSupabaseClient:async()=>fullDb},'@/lib/supabase-admin':{createAdminClient:()=>fullDb},'@google/genai':{GoogleGenAI:class{models={generateContent:async()=>{if(providerFault)throw Error('secret');return {candidates:[{content:{parts:[{text:'1. Alpha'}]}}]};}};}}},{GEO_OBSERVATION_V2_ENABLED:'true',GEMINI_API_KEY:'fake',CRON_SECRET:'local'});
  let fullRes=await fullLoad('src/app/api/analyze/route.ts').POST(scanRequest);assert.equal(fullRes.status,200);assert.equal(saved.length,1);assert.equal(credits,1);assert.equal(updates,1);
  saveFault=true;saved=[];credits=0;updates=0;fullRes=await fullLoad('src/app/api/analyze/route.ts').POST(scanRequest);assert.equal(fullRes.status,503);assert.equal(credits,0);assert.equal(updates,0);
  saveFault=false;providerFault=true;saved=[];fullRes=await fullLoad('src/app/api/analyze/route.ts').POST(scanRequest);assert.equal(fullRes.status,502);assert.equal(saved.length,2);assert(saved.every(p=>p.outcome==='failure'&&p.target_ats_score===null));assert.equal(credits,0);
  providerFault=false;saved=[];fullRes=await fullLoad('src/app/api/cron/weekly-scan/route.ts').GET({headers:{get:()=> 'Bearer local'}});assert.equal(fullRes.body.succeeded,1);assert.equal(saved.length,1);
  saveFault=true;saved=[];updates=0;fullRes=await fullLoad('src/app/api/cron/weekly-scan/route.ts').GET({headers:{get:()=> 'Bearer local'}});assert.equal(fullRes.body.succeeded,0);assert.equal(fullRes.body.failed,1);assert.equal(updates,0);
  console.log('PASS full analyze/Cron: success, primary+fallback failure, failed INSERT, no false tracking success or credit completion');

  const display=load('src/lib/measurement-display.ts');
  const tracked={id:'a',promptId:id(2),surface:'gemini_api',scoreVersion:'v2',modelName:scope.modelName,locale:'ja-JP',outcome:'success',status:'verified',lastScannedAt:stamp(1),brandCited:true,brandMentioned:true};
  assert.equal(display.trackedCitationSummary([tracked,{...tracked,id:'b',lastScannedAt:stamp(2),brandCited:false},{...tracked,promptId:id(3),status:'pending'},{...tracked,promptId:id(4),modelName:'other'}],scope.modelName,'ja-JP').rate,0);
  const historyLoad=loader({'@/lib/supabase-server':{createServerSupabaseClient:async()=>database({...tables,prompt_analysis_logs:[{...row(1,2,0),tracked_prompts:{prompt_text:'q'},'tracked_prompts.project_id':id(6)}]})}});
  res=await historyLoad('src/app/api/user/logs/route.ts').GET(request);assert.equal(res.status,200);assert.equal(res.body.logs.length,1);assert.equal(res.body.logs[0].surface,'gemini_api');assert.equal(res.body.logs[0].date,stamp(10));
  const promptLoad=loader({'@/lib/supabase-server':{createServerSupabaseClient:async()=>database(tables)},'@/lib/require-project':{}});
  res=await promptLoad('src/app/api/user/prompts/route.ts').PUT({json:async()=>({id:id(2),promptText:'Changed question'})});assert.equal(res.status,409);
  console.log('PASS history route and display helpers: provenance, measured timestamp, selected series, prompt deduplication, prompt identity preservation');
}
run().then(()=>console.log('P0-5/P0-6 offline implementation tests PASS')).catch(e=>{console.error(e);process.exitCode=1;});
