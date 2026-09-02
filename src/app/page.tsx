"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Layers,
  Check,
  ArrowRight,
  Globe,
  FileText,
  ChevronRight,
  Zap,
  BarChart3,
  Bot,
  ChevronDown,
  Trophy,
  AlertTriangle,
  Menu,
  X
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/lib/i18n";

export default function LandingPage() {
  const { lang, setLang } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "zh-TW", name: "繁體中文", flag: "🇹🇼" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ];

  const selectedLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div className="-m-8 bg-slate-50 text-slate-900 min-h-screen selection:bg-indigo-600 selection:text-white font-sans antialiased">
      {/* Top Banner (アナウンスバー) */}
      <div className="bg-slate-950 text-white text-[11px] py-2 px-4 text-center font-medium border-b border-slate-800">
        <span>🔥 AI検索 (GEO / LLMO / AIO) 時代へ！GA4では見えない「自社 vs 競合の勝敗理由」を1秒で可視化</span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-2">
              GEO Explorer
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono border border-indigo-200">
                PRO v3.0
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#problems" className="hover:text-indigo-600 transition-colors">お悩み解決</a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">機能一覧</a>
            <a href="#comparison" className="hover:text-indigo-600 transition-colors">他ツール比較</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">料金プラン</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                aria-expanded={langMenuOpen}
                aria-label="表示言語を切り替える"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>{selectedLang.flag}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-indigo-50 ${
                        l.code === lang ? "text-indigo-600 font-bold bg-indigo-50/50" : "text-slate-700"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ログイン
            </Link>

            {/* 目立つイエローCTA */}
            <Link
              href="/prompts"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-400/20 transition-all cursor-pointer transform hover:scale-[1.02]"
            >
              <span>無料で試してみる</span>
              <ChevronRight className="w-4 h-4 text-slate-950" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-panel"
              aria-label={mobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Panel */}
        {mobileMenuOpen && (
          <nav
            id="mobile-nav-panel"
            className="md:hidden border-t border-slate-200/80 bg-white px-6 py-4 flex flex-col gap-1 text-sm font-semibold text-slate-700"
          >
            <a href="#problems" onClick={() => setMobileMenuOpen(false)} className="py-2.5 hover:text-indigo-600 transition-colors">お悩み解決</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2.5 hover:text-indigo-600 transition-colors">機能一覧</a>
            <a href="#comparison" onClick={() => setMobileMenuOpen(false)} className="py-2.5 hover:text-indigo-600 transition-colors">他ツール比較</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-2.5 hover:text-indigo-600 transition-colors">料金プラン</a>
            <Link href="/insights" onClick={() => setMobileMenuOpen(false)} className="py-2.5 hover:text-indigo-600 transition-colors">ナレッジ</Link>

            <div className="flex items-center flex-wrap gap-2 pt-3 mt-2 border-t border-slate-100">
              <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    l.code === lang ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {l.flag} {l.name}
                </button>
              ))}
            </div>

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 text-slate-700 hover:text-slate-900 transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/prompts"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-400/20 transition-all"
            >
              <span>無料で試してみる</span>
              <ChevronRight className="w-4 h-4 text-slate-950" />
            </Link>
          </nav>
        )}
      </header>

      {/* 1. HERO SECTION (事業計画書直伝の超シャープな構成: 左 入力フォーム | 右 リアル勝敗UI) */}
      <section className="py-12 md:py-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Hero Left: Strategic Headlines & Quick Form */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-100/90 text-indigo-900 rounded-full text-xs font-black border border-indigo-200">
              <Bot className="w-4 h-4 text-indigo-600" />
              次世代 GEO (AI検索) 競合勝敗分析 ＆ AEO自動化SaaS
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-[1.2]">
              AI検索時代、なぜ自社が<br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-600 bg-clip-text text-transparent">
                負けているのか？
              </span><br />
              『他社比較 ✕ 勝敗理由』を1秒で解明
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              自社データしか見えないGA4の限界を突破。AhrefsがSEOで実現した<b>「競合横並び分析」</b>をGEO領域で提供。独自指標<b>「AI-Trust Score (ATS)」</b>で理由を特定し、AIに選ばれる「直答記事」を自動作成します。
            </p>

            {/* HERO Form Bar (即時診断フォーム) */}
            <div className="bg-white p-5 rounded-2xl border-2 border-indigo-600 shadow-xl space-y-3">
              <div className="text-xs font-black text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  自社 vs 競合の「AI露出勝敗」を無料診断（30秒）
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                  即時レポート出力
                </span>
              </div>

              <form action="/prompts" className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="prompt"
                    placeholder="調査キーワード（例: 営業DX ツール おすすめ）"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>無料で診断する</span>
                  <ChevronRight className="w-4 h-4 text-slate-950" />
                </button>
              </form>

              <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 font-medium">
                <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> クレジットカード登録不要</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> 0〜100ptで自社vs競合スコア比較</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Live UI Showcase (勝敗分析のリアル画面) */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden text-slate-900">
              <div className="bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-400" />
                  <span>「パーパスブランディング 会社 比較」</span>
                </div>
                <span className="text-amber-400 font-mono text-[11px]">AI-Trust Score (ATS) 算出中</span>
              </div>

              <div className="p-5 space-y-4 bg-slate-50/70 text-xs">
                {/* Benchmark Score Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" /> 競合 ATS ベンチマーク比較
                    </span>
                    <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      自社: 42 pt (競合首位: 78 pt)
                    </span>
                  </div>

                  <div className="overflow-x-auto text-[11px]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-400 font-semibold border-b border-slate-100">
                          <th className="pb-1.5">順位</th>
                          <th className="pb-1.5">ブランド名</th>
                          <th className="pb-1.5 text-center">ATS スコア</th>
                          <th className="pb-1.5 text-center">①AI言及</th>
                          <th className="pb-1.5 text-center">②一次ソース</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="text-slate-700">
                          <td className="py-2"><Trophy className="w-3.5 h-3.5 text-amber-500 inline" /> 1位</td>
                          <td className="py-2 font-bold text-slate-900">エスエムオー (SMO)</td>
                          <td className="py-2 text-center font-black text-emerald-600">78 pt</td>
                          <td className="py-2 text-center">35 pt</td>
                          <td className="py-2 text-center font-bold text-slate-900">28 pt</td>
                        </tr>
                        <tr className="bg-indigo-50/80 font-bold text-slate-900 border-l-3 border-indigo-600">
                          <td className="py-2 pl-1.5"><span className="text-slate-400 font-bold">2位</span></td>
                          <td className="py-2 font-bold text-indigo-950">自社ブランド <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-mono">自社</span></td>
                          <td className="py-2 text-center font-black text-amber-600">42 pt</td>
                          <td className="py-2 text-center">15 pt</td>
                          <td className="py-2 text-center text-rose-600 font-bold">15 pt ⚠️</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dynamic Advice Showcase */}
                <div className="bg-amber-50 border border-amber-200/90 p-3.5 rounded-xl text-[11px] text-amber-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    勝敗要因診断: 専門比較メディアでの露出不足
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    AIは「it-trend.jp, boxil.jp」等の一次比較ソースを参照しています。自社が未掲載のため競合に13ptの差を開けられています。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. お悩み ✕ 解決レポートの対比構造 (Problem & Solution Section) */}
      <section id="problems" className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              なぜ、従来のSEO施策では<span className="text-indigo-600 underline decoration-amber-400 decoration-4 underline-offset-4">AI検索で勝てない</span>のか？
            </h2>
            <p className="text-xs text-slate-500">
              GA4やGSCなどの「自社内データ」だけでは、競合がなぜAIに選ばれているかの構造的理由が見えません。
            </p>
          </div>

          {/* 3つの課題 ✕ 3つの解決レポート対比カード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs">
                  01
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  ChatGPTやPerplexityで検索しても、競合ばかり推奨される
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  自社サービスを検索しても他社がトップに出てしまい、問い合わせを横取りされている……
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-1">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">解決アウトプット</span>
                <div className="font-bold text-xs text-slate-900">【ATS 競合ベンチマーク比較】</div>
                <p className="text-[11px] text-slate-500">自社 vs 競合の信頼度差（0-100pt）を一目で数値化</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
                  02
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  なぜAIに自社が負けているのか、原因が全くわからない
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  自社サイトが悪いのか、参照メディアに載っていないからか、負け要因が解析できない……
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-1">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">解決アウトプット</span>
                <div className="font-bold text-xs text-slate-900">【一次ソース別 動的アクション診断】</div>
                <p className="text-[11px] text-slate-500">参照メディアを特定し最適改善アドバイスを出力</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-xs">
                  03
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  AIに選ばれる「直答コンテンツ」の書き方が解らない
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  従来のダラダラ長いSEO記事ではAIに要約されず、引用される書き方がわからない……
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-1">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">解決アウトプット</span>
                <div className="font-bold text-xs text-slate-900">【クエリファンアウト ✕ AEO自動生成】</div>
                <p className="text-[11px] text-slate-500">35-65文字の定義・数値直答ブロック付き記事を即生成</p>
              </div>
            </div>
          </div>

          {/* Mid-Page CTA */}
          <div className="text-center pt-2">
            <Link
              href="/prompts"
              className="inline-flex items-center gap-2 px-8 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <span>自社の AI 露出・勝敗を今すぐ無料で試す</span>
              <ChevronRight className="w-4 h-4 text-slate-950" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. 機能一覧マトリクス (ミエルカ添付画像スタイルのスッキリカード) */}
      <section id="features" className="py-16 bg-slate-100 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              GEO Explorer には<br />
              <span className="text-indigo-600">AI検索時代のマーケティング機能</span>が充実！
            </h2>
            <p className="text-xs text-slate-500">
              分析からAEO直答記事の作成・効果測定まで一気通貫でカバー。
            </p>
          </div>

          {/* Grid of Feature Cards (添付画像スタイル) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2.5">
                <Trophy className="w-4 h-4 text-indigo-600" />
                <span>AI信頼指標 (ATS)</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 pl-3 list-disc">
                <li>独自指標 AI-Trust Score (0-100pt)</li>
                <li>AI直接言及率スコアリング (40pt)</li>
                <li>一次情報ソース影響度判別 (40pt)</li>
                <li>ファンアウトカバー率評価 (20pt)</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2.5">
                <Search className="w-4 h-4 text-indigo-600" />
                <span>AI-SERP 競合勝敗推察</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 pl-3 list-disc">
                <li>AI回答文内の推薦・言及順位取得</li>
                <li>競合ブランドの言及・引用シェア算出</li>
                <li>競合ギャップ分析 (敗北要因の自動分類)</li>
                <li>Google AI Overviews / Gemini リアルタイム解析</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2.5">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>動的アクション診断</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 pl-3 list-disc">
                <li>比較メディア参照時: 掲載/リライト案</li>
                <li>公式ドキュメント参照時: AEO構造化案</li>
                <li>ニュースPR参照時: プレスリリース提案</li>
                <li>学術/公的参照時: 白書データ公開提案</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>AIクエリファンアウト</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 pl-3 list-disc">
                <li>プロンプトの裏側サブクエリ抽出</li>
                <li>サブクエリ単体での競合勝敗比較 (1pt)</li>
                <li>ユーザーの深掘り検索意図マッピング</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>AEO直答記事自動生成</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 pl-3 list-disc">
                <li>35-65文字の定義・数値直答ブロック自動配置</li>
                <li>問い形式の見出し (H2/H3) 自動設計</li>
                <li>Markdown/HTML比較テーブル化</li>
                <li>多言語対応 (日本語・英語・繁体字)</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>効果検証・トラッキング</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 pl-3 list-disc">
                <li>対策前 ➔ 対策4週後のATS推移グラフ</li>
                <li>代理店向けホワイトラベルPDFレポート</li>
                <li>週次自動定点モニタリング</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 他社ツール比較マトリクス */}
      <section id="comparison" className="py-16 bg-white text-slate-900 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">他社ツール比較</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              大手GEOツール ＆ 従来SEOツールとの対照比較
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
              <thead>
                <tr className="bg-slate-950 text-white">
                  <th className="p-4 font-bold border-b border-slate-800">比較項目</th>
                  <th className="p-4 font-bold border-b border-slate-800 text-slate-300">大手GEOツール</th>
                  <th className="p-4 font-bold border-b border-slate-800 text-slate-300">従来SEO (Ahrefs等)</th>
                  <th className="p-4 font-bold border-b border-indigo-600 bg-indigo-600 text-white">GEO Explorer (弊社)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">月額コスト</td>
                  <td className="p-4 text-rose-600 font-semibold">月額10万〜30万 (初期10万)</td>
                  <td className="p-4">月額約2万〜5万円 ($129〜)</td>
                  <td className="p-4 bg-indigo-50/50 font-black text-indigo-700">月額 9,800 円〜 (初期0円)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">競合ATSスコア比較</td>
                  <td className="p-4 text-slate-400">× 非対応 (単なる言及数)</td>
                  <td className="p-4 text-slate-400">× 非対応 (古いDR指標)</td>
                  <td className="p-4 bg-indigo-50/50 font-bold text-indigo-700">◯ 完備 (自社vs競合 0-100pt)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">一次ソース別 動的アクション診断</td>
                  <td className="p-4 text-slate-400">× 非対応</td>
                  <td className="p-4 text-slate-400">× 非対応</td>
                  <td className="p-4 bg-indigo-50/50 font-bold text-indigo-700">◯ 完備 (参照先に応じた最適改善策)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">1クリック AEO直答記事生成</td>
                  <td className="p-4 text-slate-400">× 非対応</td>
                  <td className="p-4 text-slate-400">× 非対応</td>
                  <td className="p-4 bg-indigo-50/50 font-bold text-indigo-700">◯ 完備 (35-65文字直答自動配置)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. 料金プラン (Pricing Section) */}
      <section id="pricing" className="py-16 bg-slate-50 text-slate-900">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-10">
          <div className="space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">料金プラン</span>
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">明確で手頃な料金プラン</h2>
            <p className="text-xs text-slate-500">初期費用は完全無料。規模に合わせていつでもプラン変更可能です。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Starter */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="font-bold text-slate-900">Starter</div>
                <div className="text-2xl font-black text-slate-900 my-3">
                  ¥9,800 <span className="text-xs font-normal text-slate-500">/月</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">中小企業の1人マーケター・個人メディア向け</p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 30 プロンプト追跡 /月</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 5 本 AEO記事生成 /月</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 競合ATS比較 ＆ 動的アクション診断</li>
                </ul>
              </div>
              <Link href="/pricing" className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl text-center transition-all">
                Starter を申し込む
              </Link>
            </div>

            {/* Growth */}
            <div className="bg-white p-7 rounded-2xl border-2 border-indigo-600 shadow-xl relative -translate-y-1 flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full shadow-md">
                人気 No.1
              </div>
              <div>
                <div className="font-bold text-slate-900">Growth</div>
                <div className="text-2xl font-black text-slate-900 my-3">
                  ¥29,800 <span className="text-xs font-normal text-slate-500">/月</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">専任マーケ部門・中堅成長企業向け</p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 150 プロンプト追跡 /月</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 25 本 AEO記事生成 /月</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 週次自動定点観測 & 効果測定</li>
                </ul>
              </div>
              <Link href="/pricing" className="mt-6 w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl text-center shadow-lg shadow-amber-400/25 transition-all">
                Growth を申し込む
              </Link>
            </div>

            {/* Agency */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="font-bold text-slate-900">Agency</div>
                <div className="text-2xl font-black text-slate-900 my-3">
                  ¥79,800 <span className="text-xs font-normal text-slate-500">/月</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">SEO代理店・Webコンサルティング企業向け</p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 500 プロンプト追跡 /月</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 100 本 AEO記事生成 /月</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 自社ロゴ入りホワイトラベル出力</li>
                </ul>
              </div>
              <Link href="/pricing" className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl text-center transition-all">
                Agency を申し込む
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            GEO Explorer by Traditionalart
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            <Link href="/insights" className="hover:text-white">ナレッジ</Link>
            <Link href="/pricing" className="hover:text-white">料金プラン</Link>
            <Link href="/terms" className="hover:text-white">利用規約</Link>
            <Link href="/privacy" className="hover:text-white">プライバシーポリシー (GDPR)</Link>
            <Link href="/legal" className="hover:text-white">特定商取引法に基づく表記</Link>
          </div>
          <div className="text-slate-500">
            © 2026 Traditionalart Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
