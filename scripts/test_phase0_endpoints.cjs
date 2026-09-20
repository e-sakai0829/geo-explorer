// Offline, isolated test harness for Phase 0 endpoints (F01 & F05)
// Does NOT require external network, live Supabase, or Gemini API.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));

function loadRouteModule(relPath, mockedContext = {}) {
  const fullPath = path.join(root, relPath);
  const sourceCode = fs.readFileSync(fullPath, 'utf8');
  const transpiled = ts.transpileModule(sourceCode, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;

  const moduleObj = { exports: {} };

  // Next.js NextResponse モック
  class MockNextResponse {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.headers = new Map(Object.entries(init.headers || {}));
    }
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
    static json(body, init) {
      return new MockNextResponse(body, init);
    }
  }

  const defaultRequire = (id) => {
    if (id === 'next/server') {
      return {
        NextResponse: MockNextResponse,
        NextRequest: class MockNextRequest {}
      };
    }
    if (id === '@/lib/supabase-server') {
      return {
        createServerSupabaseClient: async () => {
          throw new Error('Database access is forbidden in Phase 0 offline tests');
        }
      };
    }
    if (id === '@/lib/supabase-admin') {
      return {
        createAdminClient: () => {
          throw new Error('Database access is forbidden in Phase 0 offline tests');
        }
      };
    }
    if (id === '@/lib/observation-contract') return { observationV2Enabled: () => true };
    if (id === '@/lib/observed-scan') return { requireObservationSchema: async () => { throw new Error('DB forbidden'); }, executeObservedScan: async () => { throw new Error('Network forbidden'); } };
    if (id === '@/lib/scan-engine') {
      return {
        runGeminiScan: async () => { throw new Error('Network forbidden'); },
        buildScanPrompt: () => '',
        evaluateScan: () => ({}),
        DEFAULT_ENGINE: 'gemini-3.6-flash'
      };
    }
    if (id === '@/lib/observation-writer') {
      return {
        writeObservationLog: async () => ({ success: true, logId: 'mock-log-id' }),
      };
    }
    return require(id);
  };

  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    require: mockedContext.customRequire || defaultRequire,
    process: {
      env: { ...process.env, ...mockedContext.env }
    },
    console,
    setTimeout,
    clearTimeout
  };

  vm.runInNewContext(transpiled, sandbox, { filename: relPath });
  return moduleObj.exports;
}

async function runTests() {
  console.log("=== Phase 0 先行実装テスト開始 ===");

  // ----------------------------------------------------
  // Test 1: /api/user/credits POST遮断 (F01)
  // ----------------------------------------------------
  console.log("Test 1: /api/user/credits POST must return 405 Method Not Allowed");
  const creditsMod = loadRouteModule('src/app/api/user/credits/route.ts');
  assert.equal(typeof creditsMod.POST, 'function', 'POST handler must exist');

  const postRes = await creditsMod.POST();
  assert.equal(postRes.status, 405, 'POST must return status 405');
  assert.equal(postRes.headers.get('Allow'), 'GET', 'Headers must include Allow: GET');
  const postBody = await postRes.json();
  assert.match(postBody.error, /Method not allowed/i, 'Body must indicate method not allowed');
  console.log("✓ Test 1 Passed: POST is rejected with 405 (no DB access attempted).");

  // ----------------------------------------------------
  // Test 2: /api/cron/weekly-scan CRON_SECRET未設定時 503 (F05)
  // ----------------------------------------------------
  console.log("Test 2: /api/cron/weekly-scan without CRON_SECRET must return 503");
  const cronModNoSecret = loadRouteModule('src/app/api/cron/weekly-scan/route.ts', {
    env: { CRON_SECRET: '' }
  });

  const mockReqNoSecret = {
    headers: { get: () => null }
  };
  const resNoSecret = await cronModNoSecret.GET(mockReqNoSecret);
  assert.equal(resNoSecret.status, 503, 'Must return 503 when CRON_SECRET is unconfigured');
  const bodyNoSecret = await resNoSecret.json();
  assert.match(bodyNoSecret.error, /CRON_SECRET is not configured/i);
  console.log("✓ Test 2 Passed: 503 returned when CRON_SECRET is missing or empty.");

  // ----------------------------------------------------
  // Test 3: /api/cron/weekly-scan Authorization欠落または不一致で 401 (F05)
  // ----------------------------------------------------
  console.log("Test 3: /api/cron/weekly-scan with missing/invalid Authorization must return 401");
  const cronModWithSecret = loadRouteModule('src/app/api/cron/weekly-scan/route.ts', {
    env: { CRON_SECRET: 'test_secret_key_abc123' }
  });

  // 3-1: Authorizationヘッダー欠落
  const mockReqMissing = {
    headers: { get: (name) => null }
  };
  const resMissing = await cronModWithSecret.GET(mockReqMissing);
  assert.equal(resMissing.status, 401, 'Must return 401 when Authorization header is missing');

  // 3-2: Authorizationヘッダー不正
  const mockReqWrong = {
    headers: { get: (name) => (name.toLowerCase() === 'authorization' ? 'Bearer wrong_token' : null) }
  };
  const resWrong = await cronModWithSecret.GET(mockReqWrong);
  assert.equal(resWrong.status, 401, 'Must return 401 when Authorization token is incorrect');
  console.log("✓ Test 3 Passed: 401 returned for missing or mismatched token.");

  // ----------------------------------------------------
  // Test 4: /api/cron/weekly-scan 正規Bearerで認証通過 (F05)
  // ----------------------------------------------------
  console.log("Test 4: /api/cron/weekly-scan with valid Bearer token passes authentication");
  const cronModValid = loadRouteModule('src/app/api/cron/weekly-scan/route.ts', {
    env: { CRON_SECRET: 'test_secret_key_abc123', GEMINI_API_KEY: '' } // GEMINI_API_KEYを空にして直後ガード到達を確認
  });

  const mockReqValid = {
    headers: { get: (name) => (name.toLowerCase() === 'authorization' ? 'Bearer test_secret_key_abc123' : null) }
  };
  const resValid = await cronModValid.GET(mockReqValid);
  // 認証チェックを通過し、外部APIキーチェック（500）に到達することを確認
  assert.equal(resValid.status, 500, 'Should pass auth and reach GEMINI_API_KEY check without making external calls');
  const bodyValid = await resValid.json();
  assert.match(bodyValid.error, /GEMINI_API_KEY/i);
  console.log("✓ Test 4 Passed: Authentication succeeds with valid Bearer token.");

  console.log("\n==========================================");
  console.log("=== 全テスト成功 (4/4 Tests Passed) ===");
  console.log("==========================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
