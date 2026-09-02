import { estimateRank, evaluateScan } from "../src/lib/scan-engine";

console.log("=== scan-engine スモークテスト ===\n");

// estimateRank: 番号付きリストの順位推定
const text1 = `おすすめツールを3つご紹介します。

1. **TechTouch** - 高機能な導入支援ツール
2. **NotePM** - マニュアル作成に強い社内wikiツール
3. **Qast** - ナレッジ共有特化型ツール`;

const r1 = estimateRank(text1, "NotePM");
console.log("Test1 (2位でリスト内言及):", r1);
if (r1.rank !== 2 || !r1.mentionedInText) throw new Error("Test1 FAILED");

const r2 = estimateRank(text1, "存在しないブランド");
console.log("Test2 (非言及):", r2);
if (r2.rank !== 0 || r2.mentionedInText) throw new Error("Test2 FAILED");

const text3 = "特にツールを比較検討する際は、NotePMのような選択肢も参考になるでしょう。";
const r3 = estimateRank(text3, "NotePM");
console.log("Test3 (リスト外の本文言及のみ):", r3);
if (r3.rank !== 0 || !r3.mentionedInText) throw new Error("Test3 FAILED");

// evaluateScan: AIO非表出 / 表出推奨 / 表出非推奨の3値判定
const notShown = evaluateScan({
  targetBrand: "NotePM",
  targetDomain: "https://notepm.jp",
  competitors: ["Qast"],
  scanText: "",
  webSources: [],
  searchQueries: [],
});
console.log("\nTest4 (AIO非表出 not_shown):", notShown.aioStatus, notShown.rank);
if (notShown.aioStatus !== "not_shown") throw new Error("Test4 FAILED");

const shownRecommended = evaluateScan({
  targetBrand: "NotePM",
  targetDomain: "https://notepm.jp",
  competitors: ["Qast"],
  scanText: text1,
  webSources: [{ title: "NotePM 公式", url: "https://notepm.jp/features" }],
  searchQueries: [],
});
console.log("Test5 (表出かつ2位=推奨 shown_recommended):", shownRecommended.aioStatus, shownRecommended.rank, shownRecommended.winLoss);
if (shownRecommended.aioStatus !== "shown_recommended") throw new Error("Test5 FAILED");
if (shownRecommended.winLoss !== "draw") throw new Error("Test5 winLoss FAILED");

console.log("\n=== 全テスト成功 ===");
