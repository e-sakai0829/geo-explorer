const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const psql = 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe';
const host = '127.0.0.1';
const port = '55439';
const superuser = 'geo_test';
const db = 'postgres';

function execSql(sql, fail = false) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.toUpperCase().startsWith('PG')));
  const res = cp.spawnSync(psql, ['-X', '-q', '-h', host, '-p', port, '-U', superuser, '-d', db, '-v', 'ON_ERROR_STOP=1', '-A', '-t'], {
    input: sql,
    encoding: 'utf8',
    env
  });
  if (fail) {
    return { ok: res.status === 0, error: res.stderr || res.stdout };
  }
  if (res.status !== 0) {
    console.error(`PSQL STDERR:`, res.stderr);
    throw new Error(`SQL failed (status ${res.status}):\n${res.stderr || res.stdout}`);
  }
  return { ok: true, output: res.stdout.trim() };
}

console.log('=== Step 2 隔離環境バックアップ復元＆正本DDL適用試験 ===\n');

// 1. クリーンなテスト用スキーマの準備
execSql(`
  DROP SCHEMA IF EXISTS test_p0_backup CASCADE;
  CREATE SCHEMA test_p0_backup;
  SET search_path TO test_p0_backup, public;

  CREATE TABLE test_p0_backup.tracked_prompts (
    id uuid PRIMARY KEY
  );

  CREATE TABLE test_p0_backup.prompt_analysis_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id uuid REFERENCES test_p0_backup.tracked_prompts(id) ON DELETE CASCADE NOT NULL,
    ai_overview_present boolean NOT NULL DEFAULT false,
    brand_mentioned boolean NOT NULL DEFAULT false,
    brand_cited boolean NOT NULL DEFAULT false,
    raw_response text,
    fanout_queries text[] DEFAULT ARRAY[]::text[],
    citation_sources jsonb DEFAULT '[]'::jsonb,
    competitor_mentions jsonb DEFAULT '{}'::jsonb,
    scanned_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    engine text NOT NULL DEFAULT 'gemini'::text,
    rank integer,
    aio_status text NOT NULL DEFAULT 'not_shown'::text,
    win_loss text,
    direct_mention_score integer,
    citation_domain_score integer,
    fanout_coverage_score integer
  );
`);
console.log('[1] 隔離環境に本番旧スキーマ（17列）を作成完了');

// 2. CSVファイルの読み込みとJSONパース
const csvPath = 'C:\\Users\\jiro-\\cursor 作業\\08_SEO_LLMO戦略\\調査レポート\\20260920_SEO_AIO統合設計レビュー\\backups\\prompt_analysis_logs_backup_20260920_222500.csv';

const jsonDumpScript = `
import csv, json
with open(r'${csvPath}', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))
print(json.dumps(rows))
`;
const parseRes = cp.spawnSync('python', ['-c', jsonDumpScript], { encoding: 'utf8' });
if (parseRes.status !== 0) throw new Error('CSV parse failed: ' + parseRes.stderr);
const records = JSON.parse(parseRes.stdout);
console.log(`[2] バックアップCSV読み込み: ${records.length} 行検出`);

// 3. データ投入（親テーブルFK投入と復元INSERT）
const restoreStart = Date.now();
let insertSql = 'BEGIN;\n';
for (const r of records) {
  insertSql += `INSERT INTO test_p0_backup.tracked_prompts (id) VALUES ('${r.prompt_id}') ON CONFLICT DO NOTHING;\n`;
  const escapeSql = (str) => (str && str !== 'null') ? "'" + str.replace(/'/g, "''") + "'" : "NULL";
  
  // fanout_queries: JSON配列から PostgreSQL text[] へ変換
  let fanoutSql = "'{}'::text[]";
  if (r.fanout_queries && r.fanout_queries !== 'null') {
    try {
      const parsed = JSON.parse(r.fanout_queries);
      if (Array.isArray(parsed)) {
        fanoutSql = `ARRAY[${parsed.map(q => escapeSql(q)).join(',')}]::text[]`;
      }
    } catch {
      fanoutSql = "'{}'::text[]";
    }
  }

  const citVal = (r.citation_sources && r.citation_sources !== 'null') ? "'" + r.citation_sources.replace(/'/g, "''") + "'::jsonb" : "'[]'::jsonb";
  const compVal = (r.competitor_mentions && r.competitor_mentions !== 'null') ? "'" + r.competitor_mentions.replace(/'/g, "''") + "'::jsonb" : "'{}'::jsonb";
  
  insertSql += `INSERT INTO test_p0_backup.prompt_analysis_logs (
    id, prompt_id, ai_overview_present, brand_mentioned, brand_cited,
    raw_response, fanout_queries, citation_sources, competitor_mentions,
    scanned_at, engine, rank, aio_status, win_loss,
    direct_mention_score, citation_domain_score, fanout_coverage_score
  ) VALUES (
    '${r.id}', '${r.prompt_id}', ${r.ai_overview_present === 't' || r.ai_overview_present === 'true'},
    ${r.brand_mentioned === 't' || r.brand_mentioned === 'true'}, ${r.brand_cited === 't' || r.brand_cited === 'true'},
    ${escapeSql(r.raw_response)}, ${fanoutSql}, ${citVal}, ${compVal},
    '${r.scanned_at}', '${r.engine}', ${r.rank && r.rank !== 'null' ? r.rank : 'NULL'}, '${r.aio_status}', ${escapeSql(r.win_loss)},
    ${r.direct_mention_score && r.direct_mention_score !== 'null' ? r.direct_mention_score : 'NULL'},
    ${r.citation_domain_score && r.citation_domain_score !== 'null' ? r.citation_domain_score : 'NULL'},
    ${r.fanout_coverage_score && r.fanout_coverage_score !== 'null' ? r.fanout_coverage_score : 'NULL'}
  );\n`;
}
insertSql += 'COMMIT;\n';
execSql(insertSql);
const restoreDurationMs = Date.now() - restoreStart;
console.log(`[3] 隔離DBへのデータ復元完了: 所要時間 ${restoreDurationMs} ms`);

// 4. 復元データの整合性検証（全ID・件数一致）
const countOut = execSql('SELECT count(*) FROM test_p0_backup.prompt_analysis_logs;').output;
console.log(`[4-1] 復元件数確認: ${countOut} 件 (期待値: ${records.length})`);
if (parseInt(countOut, 10) !== records.length) throw new Error('ROW_COUNT_MISMATCH');

const idsOut = execSql('SELECT id FROM test_p0_backup.prompt_analysis_logs ORDER BY id;').output.split(/\r?\n/).filter(Boolean);
const expectedIds = records.map(r => r.id).sort();
const idMatch = JSON.stringify(idsOut.sort()) === JSON.stringify(expectedIds);
console.log(`[4-2] 全ID完全一致確認: ${idMatch ? 'PASS' : 'FAIL'}`);
if (!idMatch) throw new Error('ID_MISMATCH');

// 5. 正本0004の適用試験
console.log('\n[5] 正本SQL適用試験の実施...');
const sqlPath = 'C:\\Users\\jiro-\\cursor 作業\\08_SEO_LLMO戦略\\調査レポート\\20260920_SEO_AIO統合設計レビュー\\PHASE0_C_0004_observation_surface_and_scoring.sql';
let sqlContent = fs.readFileSync(sqlPath, 'utf8');

// テストスキーマ向けにテーブル参照先を置換
sqlContent = sqlContent.replace(/public\.prompt_analysis_logs/g, 'test_p0_backup.prompt_analysis_logs');

const ddlRes = execSql(sqlContent, true);
if (ddlRes.ok) {
  console.log('[5-RESULT] 正本SQL適用成功');
} else {
  console.log('[5-RESULT] 正本SQL適用エラー検出（スキーマ差分の実証確認）:');
  console.log('--- エラーメッセージ ---');
  console.log(ddlRes.error.trim());
  console.log('------------------------');
}
