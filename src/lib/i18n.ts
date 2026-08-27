export type Language = "ja" | "zh-TW" | "en";

export interface Translations {
  // Brand & Common
  brand_title: string;
  brand_subtitle: string;
  badge_pro: string;
  login: string;
  logout: string;
  save: string;
  saved: string;
  loading: string;
  credits: string;
  upgrade: string;
  active: string;
  settings: string;
  
  // Navigation
  nav_dashboard: string;
  nav_prompts: string;
  nav_editor: string;
  nav_citations: string;
  nav_performance: string;
  nav_insights: string;
  nav_pricing: string;
  features_nav: string;
  comparison_nav: string;
  pricing_nav: string;
  insights_nav: string;
  free_trial: string;

  // LP Hero
  hero_badge: string;
  hero_title: string;
  hero_desc: string;
  search_placeholder: string;
  search_cta: string;
  no_card: string;
  instant_scan: string;

  // LP Why GEO
  market_shift: string;
  why_geo_title: string;
  why_geo_desc: string;
  problem1_title: string;
  problem1_desc: string;
  problem2_title: string;
  problem2_desc: string;
  problem3_title: string;
  problem3_desc: string;

  // LP Features
  f1_badge: string;
  f1_title: string;
  f1_desc: string;
  f2_badge: string;
  f2_title: string;
  f2_desc: string;
  f3_badge: string;
  f3_title: string;
  f3_desc: string;

  // LP Pricing
  pricing_title: string;
  pricing_desc: string;

  // Dashboard Page
  dash_kpi_som: string;
  dash_kpi_som_desc: string;
  dash_kpi_citations: string;
  dash_kpi_citations_desc: string;
  dash_kpi_credits: string;
  dash_kpi_credits_desc: string;
  dash_banner_title: string;
  dash_banner_desc: string;
  dash_banner_cta: string;
  dash_card_prompts_title: string;
  dash_card_editor_title: string;

  // Prompts Page
  prompts_title: string;
  prompts_desc: string;
  prompts_input_label: string;
  prompts_input_placeholder: string;
  prompts_btn_scan: string;
  prompts_scanning: string;
  prompts_brand_mentioned: string;
  prompts_brand_cited: string;
  prompts_fanout_count: string;
  prompts_ai_response: string;
  prompts_fanout_title: string;
  prompts_fanout_cta: string;
  prompts_sources_title: string;

  // Editor Page
  editor_title: string;
  editor_desc: string;
  editor_target_prompt: string;
  editor_brand_name: string;
  editor_lang_label: string;
  editor_fanout_label: string;
  editor_btn_generate: string;
  editor_generating: string;
  editor_preview_title: string;
  editor_copy_btn: string;
  editor_copied: string;
  editor_empty_guide: string;

  // Performance Page
  perf_title: string;
  perf_desc: string;
  perf_published: string;
  perf_citation_rate: string;
  perf_days: string;
  perf_empty_title: string;
  perf_empty_desc: string;
  perf_empty_cta: string;
  perf_best_practice: string;

  // Citations Page
  cit_title: string;
  cit_desc: string;
  cit_total_sources: string;
  cit_top_domains: string;
  cit_gap_title: string;

  // Settings Page
  set_title: string;
  set_desc: string;
  set_account_title: string;
  set_email_label: string;
  set_sub_title: string;
  set_current_plan: string;
  set_stripe_portal_btn: string;
  set_proj_title: string;
  set_proj_brand_label: string;
  set_proj_domain_label: string;
  set_proj_comp_label: string;
  set_btn_save: string;
}

export const dictionaries: Record<Language, Translations> = {
  // ==========================================
  // 🇯🇵 日本語 (Japanese)
  // ==========================================
  ja: {
    brand_title: "GEO Explorer",
    brand_subtitle: "Traditionalart BtoB",
    badge_pro: "PRO",
    login: "ログイン",
    logout: "ログアウト",
    save: "設定を保存する",
    saved: "保存完了！",
    loading: "読み込み中...",
    credits: "残りクレジット",
    upgrade: "アップグレード",
    active: "契約中",
    settings: "設定",

    nav_dashboard: "ダッシュボード",
    nav_prompts: "Prompt Explorer (GEO)",
    nav_editor: "AEO直答記事エディタ",
    nav_citations: "AI引用メディア分析",
    nav_performance: "効果測定 (Before/After)",
    nav_insights: "公式コラム・ナレッジ",
    nav_pricing: "料金・クレジット",
    features_nav: "機能紹介",
    comparison_nav: "他社比較",
    pricing_nav: "料金プラン",
    insights_nav: "GEO/AEOナレッジ",
    free_trial: "無料診断を試す",

    hero_badge: "次世代 AI検索エンジン最適化 (GEO) プラットフォーム",
    hero_title: "AI検索で、自社が「推薦・引用される」新常識。",
    hero_desc: "Google AI Overviews ＆ Gemini をリアルタイムスキャン。AI内部の検索展開（Query Fan-out）を特定し、35〜65文字の直答コンテンツで自社への被引用シェアを最大化します。",
    search_placeholder: "例: 自社業界のおすすめ・比較・費用相場など",
    search_cta: "無料スキャン実行",
    no_card: "クレジットカード不要",
    instant_scan: "即時AIスキャン完了",

    market_shift: "MARKET SHIFT",
    why_geo_title: "従来のSEOだけでは、なぜアクセスが消滅するのか？",
    why_geo_desc: "Google検索の最上部にAI Overviewsが登場したことで、従来の検索結果1位でもクリック率が最大34.5%急落する「ゼロクリック検索」が加速しています。",
    problem1_title: "検索1位でもアクセス激減 (ゼロクリック化)",
    problem1_desc: "ユーザーは青い検索リンクをクリックせず、最上部のAI要約で意思決定を完結します。AIに引用されないWebサイトは存在しないも同然になります。",
    problem2_title: "従来のキーワードSEOが効かない",
    problem2_desc: "AIは入力キーワードを裏で数十個のサブクエリ（Query Fan-out）に自動展開して調査します。単一キーワードのSEO記事ではAIの参照ソースに選ばれません。",
    problem3_title: "回答直答形式（AEO）への転換が必須",
    problem3_desc: "AIは前置きの長い記事を無視します。冒頭に「35〜65文字の定義・数値直答」を配置し、比較表と構造化データを完備したページのみが引用元リンクに採用されます。",

    f1_badge: "リアルタイム・パーセプション解析",
    f1_title: "AI Overviews ＆ Gemini で自社がどう推薦されているか可視化",
    f1_desc: "ターゲットキーワードでAIが自社や競合を推薦しているか、どのWebページを引用元ソース（リンク）として表示しているかを瞬時に判定します。",
    f2_badge: "Query Fan-out 抽出エンジン",
    f2_title: "AI内部の展開サブクエリを逆探知して引用ギャップを特定",
    f2_desc: "ユーザーの質問に対してAIが裏で自動実行した複数検索クエリをすべて抽出。競合が獲れていて自社が獲れていない引用ギャップを可視化します。",
    f3_badge: "AEO Direct-Answer 生成",
    f3_title: "AI Overviewsに引用される35〜65文字直答記事を自動執筆",
    f3_desc: "抽出したFan-outクエリ群を網羅し、AIがそのまま引用しやすい「問い形式見出し＋数値直答＋比較表」の権威記事をワンクリックで生成します。",

    pricing_title: "シンプルで明瞭な月額サブスクリプション",
    pricing_desc: "自社の規模やSEO支援クライアント数に合わせて最適なプランをお選びいただけます。",

    dash_kpi_som: "Share of Model (AI言及率)",
    dash_kpi_som_desc: "プロンプトをスキャンすると算出されます",
    dash_kpi_citations: "AI Citation Share (引用リンク率)",
    dash_kpi_citations_desc: "スキャン実行後に掲載率が表示されます",
    dash_kpi_credits: "今月の残り調査クレジット",
    dash_kpi_credits_desc: "消費済みクレジット: ",
    dash_banner_title: "の検索キーワードをスキャンして、引用ギャップを特定しましょう",
    dash_banner_desc: "Google AI Overviews や Gemini が自社を推薦しているかリアルタイム判定し、未引用の質問に対する「35〜65文字直答記事」を自動生成します。",
    dash_banner_cta: "今すぐプロンプト解析を実行 ➔",
    dash_card_prompts_title: "Prompt Explorer でできること",
    dash_card_editor_title: "AEO 権威直答エディタでできること",

    prompts_title: "プロンプト言及・引用ギャップ解析",
    prompts_desc: "Google AI Overviews ＆ Gemini をリアルタイムスキャンし、AI内部展開クエリ（Fan-out）と引用ギャップを特定します（1クエリ消費）",
    prompts_input_label: "調査対象のプロンプト（検索キーワード）",
    prompts_input_placeholder: "例: 自社業界のおすすめ・比較・費用相場など",
    prompts_btn_scan: "リアルタイム解析実行",
    prompts_scanning: "AI検索スキャン中...",
    prompts_brand_mentioned: "自社ブランド言及",
    prompts_brand_cited: "自社URL引用",
    prompts_fanout_count: "AI内部展開クエリ数",
    prompts_ai_response: "Google AI Overviews 回答スキャン",
    prompts_fanout_title: "抽出されたAI内部展開クエリ（Fan-out）",
    prompts_fanout_cta: "このクエリ群でAEO直答記事を自動生成する ➔",
    prompts_sources_title: "AI検索が参照した引用元ソース",

    editor_title: "AEO 権威直答記事エディタ",
    editor_desc: "AI Overviews ＆ Gemini に引用されるための「35〜65文字直答ブロック」「比較表」「ファンアウト網羅」を自動執筆（1クエリ消費）",
    editor_target_prompt: "ターゲット検索プロンプト",
    editor_brand_name: "自社ブランド名",
    editor_lang_label: "執筆言語",
    editor_fanout_label: "網羅する内部展開クエリ（Fan-out）",
    editor_btn_generate: "AI記事を自動生成する（1枠消費）",
    editor_generating: "AEO直答記事を生成中...",
    editor_preview_title: "生成された AEO 直答記事（Markdown）",
    editor_copy_btn: "Markdown をコピー",
    editor_copied: "コピー完了！",
    editor_empty_guide: "左側のフォームにプロンプトを入力して「記事を自動生成する」を実行すると、35〜65文字直答ブロック付きのAEO記事がここに表示されます。",

    perf_title: "AEO 施策効果測定 (Before / After)",
    perf_desc: "生成・公開した AEO 直答記事が、Google AI Overviews に引用・推薦されるまでの時系列推移を追跡します",
    perf_published: "公開済み AEO 記事",
    perf_citation_rate: "AI Overviews 引用獲得率",
    perf_days: "平均引用獲得日数",
    perf_empty_title: "まだ効果測定対象の AEO 記事が公開されていません",
    perf_empty_desc: "AEO エディタで記事を生成し、自社サイトに公開した後、Prompt Explorer で再スキャンを実行すると、ここに時系列の Before / After レポートが自動蓄積されます。",
    perf_empty_cta: "最初の AEO 記事を作成する ➔",
    perf_best_practice: "【参考】AEO 施策による引用獲得フロー（実証モデル）",

    cit_title: "AI 引用メディア・ドメイン分析",
    cit_desc: "Google AI Overviews が業界内で最も信頼・参照している上位ドメイン・オウンドメディアを特定します",
    cit_total_sources: "分析対象 引用ソース総数",
    cit_top_domains: "引用シェア上位 ドメイン",
    cit_gap_title: "競合が引用されている主要メディア一覧",

    set_title: "アカウント設定 ＆ サブスクリプション管理",
    set_desc: "アカウント情報、契約中のプラン、クレジットカード変更、領収書発行、プロジェクト設定（DB保存）",
    set_account_title: "ログインアカウント",
    set_email_label: "メールアドレス",
    set_sub_title: "契約中のサブスクリプション",
    set_current_plan: "現在のプラン",
    set_stripe_portal_btn: "Stripe 請求・解約ポータル",
    set_proj_title: "追跡プロジェクト設定",
    set_proj_brand_label: "自社ブランド名",
    set_proj_domain_label: "自社WebサイトURL",
    set_proj_comp_label: "追跡する競合ブランドリスト（カンマ区切り）",
    set_btn_save: "設定を保存する",
  },

  // ==========================================
  // 🇹🇼 繁體中文 (Traditional Chinese - Taiwan / HK)
  // ==========================================
  "zh-TW": {
    brand_title: "GEO Explorer",
    brand_subtitle: "Traditionalart BtoB",
    badge_pro: "PRO",
    login: "登入",
    logout: "登出",
    save: "儲存專案設定",
    saved: "儲存成功！",
    loading: "載入中...",
    credits: "剩餘額度",
    upgrade: "升級方案",
    active: "訂閱中",
    settings: "設定",

    nav_dashboard: "儀表板",
    nav_prompts: "Prompt Explorer (GEO)",
    nav_editor: "AEO 權威直答編輯器",
    nav_citations: "AI 引用來源媒體分析",
    nav_performance: "成效追蹤 (Before/After)",
    nav_insights: "官方專欄 ＆ 知識庫",
    nav_pricing: "方案 ＆ 額度管理",
    features_nav: "核心功能",
    comparison_nav: "市場競品比較",
    pricing_nav: "方案與定價",
    insights_nav: "GEO 知識專欄",
    free_trial: "立即免費診斷",

    hero_badge: "新世代生成式 AI 搜尋引擎最佳化 (GEO) 平台",
    hero_title: "在生成式 AI 搜尋中，讓您的品牌成為「首選推薦」與「權威引用」",
    hero_desc: "即時掃描 Google AI Overviews 與 Gemini。逆向解析 AI 內部查詢擴展（Query Fan-out），透過 35〜65 字精準直答架構，最大化自社品牌在 AI 搜尋中的推薦率與引用連結份額。",
    search_placeholder: "例如: 推薦 企業級 ERP 系統 比較評比",
    search_cta: "執行免費 AI 掃描",
    no_card: "無需綁定信用卡",
    instant_scan: "即時產出診斷結果",

    market_shift: "MARKET SHIFT",
    why_geo_title: "為什麼單靠傳統 SEO，網站流量正在急劇歸零？",
    why_geo_desc: "隨著 Google AI Overviews 佔據搜尋結果最頂部，即使排名搜尋第一名，點擊率也崩跌高達 34.5%——「零點擊搜尋（Zero-Click Search）」已成為新常態。",
    problem1_title: "搜尋排名第一，流量依然腰斬 (零點擊搜尋化)",
    problem1_desc: "使用者不再點擊傳統的藍色連結，直接在 AI 摘要中完成決策。未被 AI 引用與推薦的品牌，將徹底失去網路曝光。",
    problem2_title: "傳統關鍵字 SEO 已無法打動 AI",
    problem2_desc: "AI 會將使用者輸入的關鍵字在後台自動拆解為數十個子查詢（Query Fan-out）。傳統單一關鍵字文章已無法成為 AI 的引用來源。",
    problem3_title: "必須轉向權威直答架構（AEO）",
    problem3_desc: "AI 引擎會自動忽略冗長的廢話前言。只有在開頭配置「35〜65字精準定義直答」、具備對比表格與結構化資料的頁面，才能被 AI 採用為引用連結。",

    f1_badge: "即時品牌曝光與認知解析",
    f1_title: "視覺化呈現自社品牌在 AI Overviews 與 Gemini 中的推薦狀態",
    f1_desc: "針對目標商業提示詞，即時分析 AI 是否推薦自社或競品，並精準指出 AI 採用了哪些外部網頁作為引用來源。",
    f2_badge: "Query Fan-out 逆向拆解引擎",
    f2_title: "捕捉 AI 內部隱藏之擴展子查詢，鎖定引用差距",
    f2_desc: "完整擷取 AI 在回答問題時背後執行的所有多維度子搜尋，精確找出競品已被引用、而自社尚未獲得推薦的內容缺口。",
    f3_badge: "AEO Direct-Answer 智慧生成",
    f3_title: "一鍵生成最容易被 AI 搜尋直接引用的 35〜65 字直答權威專文",
    f3_desc: "全面覆蓋 Fan-out 子查詢群，自動輸出符合「問句標題＋數值精答＋比較表格」之高權重 Markdown 內容。",

    pricing_title: "透明公開的月費訂閱方案",
    pricing_desc: "無論是個人行銷人員、快速成長企業，或是專業 SEO 代理商，皆可選擇最適合的額度方案。",

    dash_kpi_som: "Share of Model (AI 推薦佔比)",
    dash_kpi_som_desc: "執行提示詞掃描後將自動計算",
    dash_kpi_citations: "AI Citation Share (引用連結佔比)",
    dash_kpi_citations_desc: "將顯示於 Google AIO 來源之被引用率",
    dash_kpi_credits: "本月剩餘調查額度",
    dash_kpi_credits_desc: "已消費額度: ",
    dash_banner_title: "的搜尋關鍵字，找出與競品的引用差距",
    dash_banner_desc: "即時檢測 Google AI Overviews 是否推薦自社品牌，並針對未獲引用的問題自動生成「35〜65字精準直答文章」。",
    dash_banner_cta: "立即執行提示詞掃描 ➔",
    dash_card_prompts_title: "Prompt Explorer 核心功能",
    dash_card_editor_title: "AEO 權威直答編輯器功能",

    prompts_title: "提示詞言及與引用差距分析",
    prompts_desc: "即時掃描 Google AI Overviews ＆ Gemini，逆向擷取 AI 內部展開查詢（Fan-out）並鎖定引用差距（每次消耗 1 額度）",
    prompts_input_label: "調查目標提示詞（搜尋關鍵字）",
    prompts_input_placeholder: "例如: 企業級 軟體 推薦 費用比較",
    prompts_btn_scan: "執行即時分析",
    prompts_scanning: "AI 搜尋掃描中...",
    prompts_brand_mentioned: "自社品牌提及",
    prompts_brand_cited: "自社網址引用",
    prompts_fanout_count: "AI 內部展開查詢數",
    prompts_ai_response: "Google AI Overviews 即時回答預覽",
    prompts_fanout_title: "擷取之 AI 內部展開查詢（Query Fan-out）",
    prompts_fanout_cta: "使用此查詢群自動生成 AEO 直答文章 ➔",
    prompts_sources_title: "AI 搜尋參照之引用來源網站",

    editor_title: "AEO 權威直答專文編輯器",
    editor_desc: "自動產出符合 AI Overviews 引用標準之「35〜65字直接回答區塊」、「比較表格」與「Fan-out 完整覆蓋」專文（每次消耗 1 額度）",
    editor_target_prompt: "目標搜尋提示詞",
    editor_brand_name: "自社品牌名稱",
    editor_lang_label: "產出語言",
    editor_fanout_label: "欲覆蓋之內部展開查詢（Fan-out）",
    editor_btn_generate: "自動生成 AEO 文章（消耗 1 額度）",
    editor_generating: "AEO 直答專文中...",
    editor_preview_title: "產出之 AEO 權威直答專文（Markdown）",
    editor_copy_btn: "複製 Markdown 內容",
    editor_copied: "複製成功！",
    editor_empty_guide: "於左側輸入關鍵字並點擊「自動生成」，此處將即時呈現包含 35〜65 字精準答案與對比表格之 AEO 專文。",

    perf_title: "AEO 施策成效追蹤 (Before / After)",
    perf_desc: "追蹤所發布之 AEO 直答專文，從發布至獲得 Google AI Overviews 引用推薦之時序成效",
    perf_published: "已發布 AEO 專文",
    perf_citation_rate: "AI Overviews 引用獲得率",
    perf_days: "平均引用取得天數",
    perf_empty_title: "尚未有追蹤中之 AEO 專文",
    perf_empty_desc: "使用 AEO 編輯器產出文章並發布於自社網站後，於 Prompt Explorer 再次掃描，系統將在此自動累積時序 Before / After 追蹤報告。",
    perf_empty_cta: "產出第一篇 AEO 專文 ➔",
    perf_best_practice: "【實證模型】AEO 策略引用獲取路徑參考",

    cit_title: "AI 引用來源媒體與網域分析",
    cit_desc: "深度分析 Google AI Overviews 在特定產業中最受信賴、最常引用的頂級權威媒體與網域",
    cit_total_sources: "分析之引用來源總數",
    cit_top_domains: "引用份額領先網域",
    cit_gap_title: "競品已被引用之主要媒體清單",

    set_title: "帳戶設定與訂閱管理",
    set_desc: "管理帳戶資訊、有效方案、信用卡變更、發票收據下載與追蹤專案設定（DB 永續儲存）",
    set_account_title: "登入帳戶",
    set_email_label: "電子郵件地址",
    set_sub_title: "目前訂閱狀態",
    set_current_plan: "目前方案",
    set_stripe_portal_btn: "Stripe 帳單與解約管理平台",
    set_proj_title: "追蹤專案設定",
    set_proj_brand_label: "自社品牌名稱",
    set_proj_domain_label: "自社官方網站網址",
    set_proj_comp_label: "追蹤競品清單（請以逗號分隔）",
    set_btn_save: "儲存專案設定",
  },

  // ==========================================
  // 🇺🇸 English (US / Global)
  // ==========================================
  en: {
    brand_title: "GEO Explorer",
    brand_subtitle: "Traditionalart BtoB",
    badge_pro: "PRO",
    login: "Log in",
    logout: "Log out",
    save: "Save Settings",
    saved: "Saved!",
    loading: "Loading...",
    credits: "Credits",
    upgrade: "Upgrade",
    active: "Active",
    settings: "Settings",

    nav_dashboard: "Dashboard",
    nav_prompts: "Prompt Explorer",
    nav_editor: "AEO Content Editor",
    nav_citations: "Citation Sources",
    nav_performance: "Performance Tracker",
    nav_insights: "Insights & Knowledge",
    nav_pricing: "Pricing & Plans",
    features_nav: "Features",
    comparison_nav: "Comparison",
    pricing_nav: "Pricing",
    insights_nav: "GEO Insights",
    free_trial: "Start Free Scan",

    hero_badge: "Next-Gen Generative Engine Optimization (GEO) Platform",
    hero_title: "Be Recommended and Cited in Generative AI Search.",
    hero_desc: "Real-time scanning of Google AI Overviews and Gemini. Uncover internal query fan-outs and maximize your citation share with 35–65 word authoritative direct-answer content.",
    search_placeholder: "e.g., Best Enterprise Software Solutions 2026",
    search_cta: "Run Free AI Scan",
    no_card: "No credit card required",
    instant_scan: "Instant live scan results",

    market_shift: "MARKET SHIFT",
    why_geo_title: "Why Traditional SEO is Losing Up to 34.5% of Organic Clicks",
    why_geo_desc: "With Google AI Overviews dominating search result tops, zero-click searches have become the new reality, bypassing standard #1 organic links.",
    problem1_title: "Traffic Loss Despite #1 Rankings (Zero-Click Search)",
    problem1_desc: "Users get complete answers directly from AI Overviews without clicking traditional blue links. Brands unreferenced by AI lose visibility entirely.",
    problem2_title: "Traditional Single-Keyword SEO No Longer Works",
    problem2_desc: "Generative AI expands input keywords into dozens of internal sub-queries (Query Fan-out). Standard SEO pages miss the multifaceted criteria AI uses to select citation sources.",
    problem3_title: "Direct-Answer Architecture (AEO) is Mandatory",
    problem3_desc: "AI skips introductory fluff. Pages featuring concise 35–65 word definitions, comparison tables, and structured data are preferentially cited as primary sources.",

    f1_badge: "Real-Time Perception Analysis",
    f1_title: "Visualize Brand Citations in Google AI Overviews & Gemini",
    f1_desc: "Instantly check whether AI search engines recommend your brand versus competitors, and see exactly which URLs are cited as authoritative links.",
    f2_badge: "Query Fan-out Extraction Engine",
    f2_title: "Uncover Hidden Sub-queries & Pinpoint Citation Gaps",
    f2_desc: "Extract every sub-query automatically generated by AI under the hood to discover citation opportunities where competitors are cited and you are missing.",
    f3_badge: "AEO Direct-Answer Generation",
    f3_title: "Generate 35–65 Word Direct-Answer Content Optimized for AI Citations",
    f3_desc: "Produce structured, authoritative Markdown articles covering fan-out query clusters with questions, direct data answers, and comparison tables.",

    pricing_title: "Simple, Transparent Monthly Pricing",
    pricing_desc: "Choose the perfect credit tier for your business, marketing team, or SEO consulting agency.",

    dash_kpi_som: "Share of Model (AI Mention Share)",
    dash_kpi_som_desc: "Calculated automatically after running prompt scans",
    dash_kpi_citations: "AI Citation Share (Source Link Rate)",
    dash_kpi_citations_desc: "Percentage of Google AIO source link appearances",
    dash_kpi_credits: "Monthly Query Credits Remaining",
    dash_kpi_credits_desc: "Used credits: ",
    dash_banner_title: "search prompts to uncover citation gaps against competitors",
    dash_banner_desc: "Check in real time if Google AI Overviews recommend your brand, and automatically generate 35–65 word direct-answer articles for uncited questions.",
    dash_banner_cta: "Run Prompt Scan Now ➔",
    dash_card_prompts_title: "What you can do with Prompt Explorer",
    dash_card_editor_title: "What you can do with AEO Content Editor",

    prompts_title: "Prompt Visibility & Citation Gap Explorer",
    prompts_desc: "Scan Google AI Overviews and Gemini live to identify query fan-outs and citation gaps (consumes 1 credit)",
    prompts_input_label: "Target Search Prompt (Keyword)",
    prompts_input_placeholder: "e.g., Best Enterprise Solutions Comparison",
    prompts_btn_scan: "Run Live Scan",
    prompts_scanning: "Scanning AI Search...",
    prompts_brand_mentioned: "Brand Mentioned",
    prompts_brand_cited: "URL Cited as Source",
    prompts_fanout_count: "Internal Fan-out Sub-queries",
    prompts_ai_response: "Google AI Overviews Live Response",
    prompts_fanout_title: "Extracted AI Sub-queries (Query Fan-out)",
    prompts_fanout_cta: "Generate AEO Article with these queries ➔",
    prompts_sources_title: "Cited Authoritative Sources",

    editor_title: "AEO Authority Direct-Answer Generator",
    editor_desc: "Generate structured articles optimized for AI Overviews with 35–65 word answers, comparison tables, and fan-out coverage (consumes 1 credit)",
    editor_target_prompt: "Target Search Prompt",
    editor_brand_name: "Your Brand Name",
    editor_lang_label: "Content Language",
    editor_fanout_label: "Target Fan-out Sub-queries",
    editor_btn_generate: "Generate AEO Article (1 credit)",
    editor_generating: "Generating AEO Content...",
    editor_preview_title: "Generated AEO Article (Markdown)",
    editor_copy_btn: "Copy Markdown",
    editor_copied: "Copied!",
    editor_empty_guide: "Enter a prompt on the left and click 'Generate Article' to produce structured AEO content with direct-answer blocks.",

    perf_title: "AEO Performance Tracker (Before / After)",
    perf_desc: "Track the timeline progression of your AEO content from publication to gaining citations in Google AI Overviews",
    perf_published: "Published AEO Articles",
    perf_citation_rate: "AI Overviews Citation Rate",
    perf_days: "Avg. Days to Citation",
    perf_empty_title: "No AEO Articles Tracked Yet",
    perf_empty_desc: "Generate an AEO article, publish it on your site, and re-scan in Prompt Explorer to automatically build your timeline Before/After report.",
    perf_empty_cta: "Create First AEO Article ➔",
    perf_best_practice: "[Best Practice] AEO Citation Acquisition Flow",

    cit_title: "AI Citation Sources & Domain Analysis",
    cit_desc: "Identify the top authority domains and publications most cited by Google AI Overviews in your industry",
    cit_total_sources: "Total Analyzed Sources",
    cit_top_domains: "Top Citation Share Domains",
    cit_gap_title: "Key Publications Citing Competitors",

    set_title: "Account & Subscription Settings",
    set_desc: "Manage account credentials, active plan, billing portal, invoice downloads, and project settings (persisted in DB)",
    set_account_title: "Login Account",
    set_email_label: "Email Address",
    set_sub_title: "Active Subscription",
    set_current_plan: "Current Plan",
    set_stripe_portal_btn: "Stripe Billing & Cancellation Portal",
    set_proj_title: "Tracking Project Configuration",
    set_proj_brand_label: "Your Brand Name",
    set_proj_domain_label: "Your Website URL",
    set_proj_comp_label: "Competitor Brands (comma-separated)",
    set_btn_save: "Save Project Settings",
  },
};

export const DICTIONARY = dictionaries;



