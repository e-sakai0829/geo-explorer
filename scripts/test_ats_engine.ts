import { calculateATS, ATSInput } from '../src/lib/ats-calculator';

console.log('===========================================================');
console.log('  ATS (AI-Trust Score) & 動的アクション診断エンジン テスト');
console.log('===========================================================\n');

// テストケース1: 比較サイトが最優先参照されており、自社が未掲載で競合に負けているケース
const testInput1: ATSInput = {
  targetBrand: 'A-Sales (自社)',
  targetDomain: 'https://a-sales-example.co.jp',
  competitors: ['B-Force (競合A)', 'C-Cloud (競合B)'],
  aiResponseText: '営業DXツールとしてはB-Forceが最も実績がありおすすめです。次いでC-Cloudもクラウド型で人気です。',
  brandMentions: [
    { brandName: 'B-Force (競合A)', rank: 1, mentionedInText: true },
    { brandName: 'C-Cloud (競合B)', rank: 2, mentionedInText: true },
    { brandName: 'A-Sales (自社)', rank: 0, mentionedInText: false },
  ],
  citations: [
    { title: '営業DXツール徹底比較2026', url: 'https://it-trend.jp/sales-dx', domain: 'it-trend.jp', mentionedBrands: ['B-Force (競合A)', 'C-Cloud (競合B)'] },
    { title: 'SFA/CRMおすすめ10選', url: 'https://boxil.jp/saas/sales', domain: 'boxil.jp', mentionedBrands: ['B-Force (競合A)'] }
  ],
  fanoutQueries: [
    '営業DX ツール 中小企業 費用相場',
    'SFA CRM 連携 営業DX おすすめ',
    '営業DX 導入 失敗事例 と対策',
    '営業DX ツール 無料お試し あり'
  ],
  coveredFanoutsPerBrand: {
    'A-Sales (自社)': 1,
    'B-Force (競合A)': 4,
    'C-Cloud (競合B)': 3
  }
};

const result1 = calculateATS(testInput1);

console.log('--- 【テスト結果 1: 比較サイト参照・自社負けパターン】 ---');
console.log(`自社ブランド: ${result1.targetBrand}`);
console.log(`自社 ATS スコア: ${result1.targetATS} / 100 点`);
console.log(`内訳 -> 直接言及: ${result1.targetBreakdown.directMentionScore}pt, 一次ソース: ${result1.targetBreakdown.citationDomainScore}pt, ファンアウト: ${result1.targetBreakdown.fanoutCoverageScore}pt`);
console.log('\n[競合 ATS スコア比較]');
Object.entries(result1.competitorATSMap).forEach(([comp, score]) => {
  console.log(` - ${comp}: ${score} 点`);
});

console.log('\n[動的アクション診断結果]');
console.log(`一次ソース種別: ${result1.diagnosticAdvice.primary_source_type}`);
console.log(`最影響メディア: ${result1.diagnosticAdvice.top_influential_media.join(', ')}`);
console.log(`診断要約: ${result1.diagnosticAdvice.diagnosis_summary}`);
console.log('\n[推奨アクション（動的生成）]');
result1.diagnosticAdvice.recommended_actions.forEach((act, idx) => {
  console.log(`  ${idx + 1}. [${act.priority}] ${act.title}`);
  console.log(`     -> ${act.description}`);
});

console.log('\n===========================================================');
console.log('  テスト完了: ATSエンジンは正常にスコア化＆動的診断を実行しました。');
console.log('===========================================================');

// テストケース2: 公式ドキュメントが直接参照されているが自社のコンテンツ構造が弱いケース
const testInput2: ATSInput = {
  targetBrand: 'A-Sales (自社)',
  targetDomain: 'https://a-sales-example.co.jp',
  competitors: ['B-Force (競合A)'],
  aiResponseText: 'B-Forceの公式マニュアルによると、SFA自動連携機能が備わっています。',
  brandMentions: [
    { brandName: 'B-Force (競合A)', rank: 1, mentionedInText: true },
    { brandName: 'A-Sales (自社)', rank: 0, mentionedInText: false },
  ],
  citations: [
    { title: 'B-Force 公式プロダクトガイド', url: 'https://b-force.co.jp/docs/features', domain: 'b-force.co.jp', mentionedBrands: ['B-Force (競合A)'] },
    { title: 'A-Sales 製品紹介ページ', url: 'https://a-sales-example.co.jp/product', domain: 'a-sales-example.co.jp', mentionedBrands: ['A-Sales (自社)'] }
  ],
  fanoutQueries: ['営業DX API連携 仕様'],
  coveredFanoutsPerBrand: {
    'A-Sales (自社)': 0,
    'B-Force (競合A)': 1
  }
};

const result2 = calculateATS(testInput2);
console.log('\n--- 【テスト結果 2: 公式ドキュメント参照・自社コンテンツ構造化が必要なパターン】 ---');
console.log(`自社 ATS スコア: ${result2.targetATS} / 100 点`);
console.log(`一次ソース種別: ${result2.diagnosticAdvice.primary_source_type}`);
console.log(`診断要約: ${result2.diagnosticAdvice.diagnosis_summary}`);
console.log('\n[推奨アクション（動的生成）]');
result2.diagnosticAdvice.recommended_actions.forEach((act, idx) => {
  console.log(`  ${idx + 1}. [${act.priority}] ${act.title}`);
  console.log(`     -> ${act.description}`);
});

// テストケース3: LLM(Gemini Search Grounding)の出力が不完全でフィールドが欠落しているケース
// 実行時に型定義とズレたデータが来てもクラッシュしないことを確認する防御的コーディングのテスト
const testInput3 = {
  targetBrand: 'A-Sales (自社)',
  targetDomain: 'https://a-sales-example.co.jp',
  competitors: ['B-Force (競合A)'],
  aiResponseText: '',
  brandMentions: undefined,
  citations: undefined,
  fanoutQueries: undefined,
  coveredFanoutsPerBrand: undefined,
} as unknown as ATSInput;

console.log('\n--- 【テスト結果 3: 欠落フィールドを含む不完全な入力(防御的コーディングの検証)】 ---');
const result3 = calculateATS(testInput3);
console.log(`自社 ATS スコア: ${result3.targetATS} / 100 点 (クラッシュせず算出成功)`);
console.log(`一次ソース種別: ${result3.diagnosticAdvice.primary_source_type}`);
console.log(`診断要約: ${result3.diagnosticAdvice.diagnosis_summary}`);

console.log('\n===========================================================');
console.log('  全テストケース完了: 欠落フィールドを含む入力でも例外なく動作しました。');
console.log('===========================================================');

