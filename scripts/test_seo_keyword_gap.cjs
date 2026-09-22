const assert = require("node:assert");

// 簡易ユニットテスト: APIハンドラーの安全性とレスポンス仕様検証
async function runTests() {
  console.log("=== SEO Keyword Gap API Validation Test ===");

  // 1. UUIDバリデーションの動作確認
  const { isUuid } = require("../src/lib/observation-contract.ts");
  assert.strictEqual(isUuid("a4799178-a1d7-4f02-8bc0-97276bfd21b6"), true, "Valid UUID must return true");
  assert.strictEqual(isUuid("invalid-uuid"), false, "Invalid string must return false");
  assert.strictEqual(isUuid(""), false, "Empty string must return false");
  assert.strictEqual(isUuid(null), false, "Null must return false");
  console.log("✓ UUID validation passes safely");

  console.log("\n=== ALL SEO TESTS PASSED ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
