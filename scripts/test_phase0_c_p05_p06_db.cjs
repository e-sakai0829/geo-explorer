// Explicit disposable local PostgreSQL only. Never reads application connection settings.
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('node:assert/strict');
const {loader,root}=require('./p056-test-loader.cjs');
const psql=process.env.P056_PSQL || 'C:/Program Files/PostgreSQL/17/bin/psql.exe';
const sqlFile=process.env.P056_SQL_FILE;
if(!sqlFile) throw Error('Set P056_SQL_FILE to the reviewed SQL proposal');
const port='55439',host='127.0.0.1',user='geo_test';
function exec(db,sql,fail=false){
 const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.toUpperCase().startsWith('PG')));
 const r=cp.spawnSync(psql,['-X','-h',host,'-p',port,'-U',user,'-d',db,'-v','ON_ERROR_STOP=1','-A','-t'],{input:sql,encoding:'utf8',env});
 if(fail){assert.notEqual(r.status,0,'invalid SQL must fail');return r.stderr;}
 if(r.status!==0)throw Error(r.stderr||r.error);return r.stdout.trim();
}
const suffix=Date.now(), db='p056_'+suffix, rollback='p056_rollback_'+suffix;
exec('postgres',`CREATE DATABASE ${db}; CREATE DATABASE ${rollback};`);
const schema=fs.readFileSync(path.join(root,'supabase/schema.sql'),'utf8').split('-- 6. RLS')[0];
const fixture=`CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);\n${schema}
INSERT INTO auth.users VALUES ('00000000-0000-4000-8000-000000000001');
INSERT INTO organizations(id,user_id) VALUES ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001');
INSERT INTO projects(id,organization_id) VALUES ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002');
INSERT INTO tracked_prompts(id,project_id,prompt_text) VALUES ('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000003','fixture');
INSERT INTO prompt_analysis_logs(id,prompt_id,scanned_at) VALUES ('00000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000004','2020-01-01T00:00:00Z');`;
exec(db,fixture); exec(rollback,fixture);
const migration=fs.readFileSync(sqlFile,'utf8'); exec(db,migration);
assert.equal(exec(db,"SELECT surface || '/' || score_version || '/' || outcome FROM prompt_analysis_logs;"),'legacy_unknown/v1/unknown');
assert.equal(exec(db,'SELECT (measured_at = scanned_at)::text FROM prompt_analysis_logs;'),'true');
const writer=loader()('src/lib/observation-writer.ts');
const p={logId:'00000000-0000-4000-8000-000000000006',promptId:'00000000-0000-4000-8000-000000000004',surface:'gemini_api',scoreVersion:'v2',modelName:'gemini-3.6-flash',locale:'ja',outcome:'success',measuredAt:'2026-09-20T00:00:00.000Z',targetAtsScore:0,directMentionScore:0,citationDomainScore:0,fanoutCoverageScore:0,competitorAtsScores:{B:null}};
function insert(payload){return "INSERT INTO prompt_analysis_logs SELECT * FROM jsonb_populate_record(NULL::prompt_analysis_logs, '"+JSON.stringify({...payload,scanned_at:p.measuredAt}).replaceAll("'","''")+"'::jsonb);";}
const payload=writer.buildObservationPayload(p);exec(db,insert(payload));
assert.equal(exec(db,"SELECT target_ats_score FROM prompt_analysis_logs WHERE score_version='v2';"),'0');
for(const patch of [{surface:'legacy_unknown'},{locale:'ja'},{model_name:'UNKNOWN'},{measured_at:null},{measured_at:'infinity'},{target_ats_score:101},{direct_mention_score:-1},{fanout_coverage_score:21},{target_ats_score:10},{outcome:'failure'},{competitor_ats_scores:{B:101}},{competitor_ats_scores:{B:'0'}},{competitor_ats_scores:{B:1.5}},{competitor_ats_scores:[]},{ai_overview_present:true},{rank:0},{prompt_id:'00000000-0000-4000-8000-000000000099'}]){
 exec(db,insert({...payload,id:'00000000-0000-4000-8000-000000000009',...patch}),true);
}
for(const [i,outcome] of ['failure','unmeasured'].entries()) exec(db,insert(writer.buildObservationPayload({...p,logId:`00000000-0000-4000-8000-00000000001${i}`,outcome})));
// Writer rollback: stop v2 emission; legacy insertion after migration remains v1 and timestamp NULL.
exec(db,"INSERT INTO prompt_analysis_logs(id,prompt_id) VALUES ('00000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000004');");
assert.equal(exec(db,"SELECT (surface='legacy_unknown' AND score_version='v1' AND measured_at IS NULL)::text FROM prompt_analysis_logs WHERE id='00000000-0000-4000-8000-000000000007';"),'true');
assert.equal(exec(db,"SELECT count(*) FROM pg_indexes WHERE tablename='prompt_analysis_logs' AND indexname IN ('idx_pal_series_latest','idx_pal_series_success');"),'2');
exec(db,migration,true);assert.equal(exec(db,"SELECT measured_at='2026-09-20T00:00:00Z' FROM prompt_analysis_logs WHERE id='00000000-0000-4000-8000-000000000006';"),'t');
exec(rollback,migration.replace('COMMIT;','SELECT 1/0; COMMIT;'),true);
assert.equal(exec(rollback,"SELECT count(*) FROM information_schema.columns WHERE table_name='prompt_analysis_logs' AND column_name='surface';"),'0');
assert.equal(exec(rollback,"SELECT count(*) FROM prompt_analysis_logs;"),'1');
console.log('PASS isolated PostgreSQL: real schema, writer payloads, constraints, FK, legacy defaults, timestamp preservation, indexes, duplicate rejection, transaction rollback.');
console.log(JSON.stringify({host,port,databases:[db,rollback],productionAccess:false}));
