# GEO Explorer Pro (TraditionalArt BtoB)
## プロダクト構想・システム設計・事業戦略 マスターブループリント（永久保存版）

---

## 1. プロダクト概要とビジョン (Product Vision)

* **プロダクト名**: **GEO Explorer Pro** (TraditionalArt BtoB)
* **本番運用URL**: [https://geo.traditionalart.biz/](https://geo.traditionalart.biz/)
* **コア・ビジョン**: 
  Google AI Overviews (AIO), Gemini, ChatGPT 時代における **「AI検索露出のギャップ特定」から「AEO直答コンテンツの自動生成」、そして「公開後の効果検証（Before / After）」までをワンストップで完結させる世界標準のGEO (Generative Engine Optimization) / LLMO プラットフォーム**。

---

## 2. 開発背景と解決する課題 (Background & Problem)

### 2.1 背景（市場の急速なシフト）
従来の検索エンジン（Google青色リンクのクリック）から、検索結果の最上部にAIが直接答えを提示する **「Google AI Overviews (AIO)」** や **「Gemini / ChatGPT」** への移行が爆発的に進行しています。

### 2.2 解決する課題（見えない機会損失）
* **従来のSEOツールの限界**: Ahrefsやラッコキーワード等の既存ツールでは、「Google検索順位」は追えても、「AIが自社の社名やサービスを回答文内で推奨しているか？」を測定できません。
* **機会損失の発生**: ユーザーがAIに「おすすめのコンサル会社」「おすすめのSaaS」を尋ねた際、自社が言及されない・他社メディアばかりが引用されることで、Webサイトへの流入以前に**比較検討の選択肢から排除されるリスク**が深刻化しています。

---

## 3. ターゲットユーザーと市場戦略 (Target & Market)

### 3.1 ターゲットペルソナ (Target Persona)
1. **SEO・Webマーケティング担当者 / 代理店コンサルタント**:
   * 日頃から **Ahrefs, SEMrush, ラッコキーワード, ミエルカSEO** などを使い込んでおり、新しいAI時代の集客手法（GEO / LLMO / AEO）を模索している層。
   * クライアントへの提案書や月次レポートに使える「客観的なエビデンス（PDFレポート）」を求めている層。
2. **BtoB企業の経営層・マーケティング責任者**:
   * 自社ブランド（例: SMO社「パーパス経営」など）のAI時代における認知向上と信頼獲得を目指す企業。

### 3.2 グローバル市場展開 (Target Regions & Locales)
単一言語に限定せず、以下のグローバル3大市場を初期ターゲットとして設計されています：

| 対象地域 | 対象検索エンジン | 対応言語 |
| --- | --- | --- |
| 🇯🇵 **日本 (Japan)** | Google JP (AI Overviews) | 日本語 (ja) |
| 🇹🇼 **台湾・香港 (Taiwan / Hong Kong)** | Google TW / HK (AI Overviews) | 繁體中文 (zh-TW) |
| 🇺🇸 **米国・グローバル (US / Global)** | Google US (AI Overviews) | English (en) |

---

## 4. 4大コア機能アーキテクチャ (Core Features)

### ① Prompt Explorer (プロンプト言及・引用ギャップ解析)
* **機能**: ターゲット検索プロンプトを入力し、Google AI Overviews / Gemini の回答文をリアルタイム解析。
* **主要アウトプット**:
  * `① AI認知・ポジショニング評価`: 狙いたいKWに対するAIの認知有無判定。
  * `② 参照リンク（自社URL）獲得戦略`: AIのWebカードに自社サイトが引用されているかの判定。
  * `③ 競合シェアシフト`: 追跡中の競合他社の言及有無比較。
  * `📋 4大コンサルティング・アクションプラン`: ソリューション枠対策、Web Card奪還、JSON-LD構造化、外部サイテーション。
  * `📄 ワンクリックPDF/印刷レポート出力`: クライアント提出用に整形されたA4縦レポートを出力。
  * `📊 過去の調査履歴ログテーブル`: 過去の全スキャンデータを一覧化＆ワンクリック復元。

### ② AEO Authority Direct-Answer Generator (AEO権威直答記事エディタ)
* **機能**: AIが最優先で抽出・引用する「35〜65文字の直答（Direct Answer）ブロック」付きMarkdown記事を自動執筆。
* **主要アウトプット**:
  * 厳格な見出し階層ルール: `# H1タイトル` ➔ `## Q. 問い形式` ➔ `**A. 35〜65文字即答**` ➔ `### H3小見出し` ➔ `Markdown比較表`
  * `📥 .md ファイルダウンロード` ＆ `🖨️ PDF原稿レポート出力`
  * 過去作成記事の自動DB保存 ＆ 復元機能
  * 低品質ペナルティ回避のためのプロ用ガイドライン表示

### ③ AI Citation Source Analyzer (AI引用メディア・ドメイン分析)
* **機能**: AIが業界内で最も信頼・参照している上位Webメディア（ITmedia、東洋経済、BOXIL等）を特定。
* **主要アウトプット**:
  * 3大KPIカード（引用ソース総数、主要ドメイン数、被引用ギャップ難易度）と各カード下部の判りやすい判断ガイド。
  * ベンチマーク指定メディアからの `[ 対抗AEO記事を作成 ➔ ]` ダイレクト連動ボタン。

### ④ Closed-loop Performance Tracker (効果測定 Before / After)
* **機能**: AEO施策のPDCAサイクルを完結させる閉環（Closed-loop）効果検証システム。
* **主要アウトプット**:
  * `🔗 公開済みAEO記事URLの登録フォーム`: ターゲットKW ＋ 自社サイトの公開URLをトラッキング登録。
  * `⚡ 1クレジット再検証スキャン`: 公開後、1クレジットを消費して最新のAI検索結果を再検証。
  * `📊成果Before/Afterレポート`: 対策前（引用なし）➔ 対策後（自社URL引用獲得！）の成果比較カードを出力。

---

## 5. 技術スタック・システム設計 (Technical Blueprint)

### 5.1 テクノロジースタック
* **フロントエンド**: Next.js 16 (App Router / Turbopack), React 19, TypeScript, Tailwind CSS, Lucide Icons
* **バックエンド・データベース**: Supabase (PostgreSQL, Auth, Row Level Security, RPC Functions)
* **AI & Search Grounding**: Google GenAI SDK (`gemini-3.6-flash` / `gemini-2.0-flash`), Google Web Search Grounding
* **決済基盤**: Stripe API (Subscriptions & Customer Portal)

### 5.2 クレジット消費の安全性（クレーム防止フェイルセーフ）
* **アトミック消費ロジック**: ユーザーが検索ボタンを押した段階では「クレジット残高の確認のみ」を行い、AI API呼び出しが**100%成功した後**にのみ `consume_credit` RPCを実行。API 404/500エラー時にはクレジットが絶対に引き落とされない安全設計。

---

## 6. 今後の展望とビジネス展開 (Roadmap)

1. **テスター運用 & フィードバック収集**:
   * 初期10クレジット枠でのユーザー体験テストと、成果Before/After事例の収集。
2. **有料プラン展開 (Stripe連動)**:
   * Starterプラン (10枠) / Proプラン (100枠) / Enterprise (組織無制限)
3. **代理店向けホワイトレーベル対応**:
   * PDFレポートのヘッダーロゴを代理店・コンサルタント自社のロゴに変更できる機能の拡張。

---
*Document Created: 2026-08-31*  
*Project: GEO Explorer Pro Architecture Blueprint*
