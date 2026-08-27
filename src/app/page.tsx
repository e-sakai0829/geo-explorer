"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Search, 
  Layers, 
  TrendingUp, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  ChevronRight, 
  Zap, 
  BarChart3, 
  Bot, 
  ChevronDown 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/lib/i18n";

export default function LandingPage() {
  const { lang, setLang, t } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "zh-TW", name: "繁體中文", flag: "🇹🇼" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ];

  const selectedLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div className="-m-8 bg-white text-slate-900 min-h-screen selection:bg-indigo-600 selection:text-white font-sans antialiased">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-2">
              {t.brand_title}
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono border border-indigo-200">
                {t.badge_pro}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">{t.features_nav}</a>
            <a href="#comparison" className="hover:text-indigo-600 transition-colors">{t.comparison_nav}</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">{t.pricing_nav}</a>
            <Link href="/insights" className="hover:text-indigo-600 transition-colors">{t.insights_nav}</Link>
          </nav>

          <div className="flex items-center gap-3.5">
            {/* Prominent Language Switcher (大きく・目立つデザイン) */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-300/80 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs hover:border-slate-400 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-sm">{selectedLang.flag}</span>
                <span>{selectedLang.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Select Language / 選擇語言
                  </div>
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-indigo-50 flex items-center justify-between cursor-pointer transition-colors ${
                        l.code === lang ? "text-indigo-600 font-bold bg-indigo-50/50" : "text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{l.flag}</span>
                        <span>{l.name}</span>
                      </div>
                      {l.code === lang && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {t.login}
            </Link>
            <Link
              href="/prompts"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-600/20 transition-all"
            >
              {t.free_trial}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200 shadow-xs">
          <Bot className="w-3.5 h-3.5 text-indigo-600" />
          {t.hero_badge}
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
          {lang === "zh-TW" ? (
            <>
              在生成式 AI 搜尋中，讓您的品牌成為<br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                「首選推薦」與「權威引用」
              </span>
            </>
          ) : lang === "en" ? (
            <>
              Be Recommended and Cited in<br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Generative AI Search.
              </span>
            </>
          ) : (
            <>
              AI検索で、自社が<br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                「推薦・引用される」
              </span>
              新常識。
            </>
          )}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {t.hero_desc}
        </p>

        {/* Free Trial Form Bar */}
        <div className="max-w-xl mx-auto pt-3">
          <form action="/prompts" className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-600 focus-within:bg-white transition-all">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              name="prompt"
              placeholder={t.search_placeholder}
              defaultValue={t.search_placeholder.replace("例: ", "").replace("例如: ", "").replace("e.g., ", "")}
              className="flex-1 bg-transparent px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
            >
              {t.search_cta}
            </button>
          </form>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 mt-3">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> {t.no_card}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> {t.instant_scan}</span>
          </div>
        </div>
      </section>

      {/* Why GEO? Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{t.market_shift}</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              {t.why_geo_title}
            </h2>
            <p className="text-xs text-slate-500">
              {t.why_geo_desc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">{t.problem1_title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.problem1_desc}</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">{t.problem2_title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.problem2_desc}</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-slate-900">{t.problem3_title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t.problem3_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Features */}
      <section id="features" className="py-24 bg-white text-slate-900">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Features</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              {lang === "zh-TW" ? "GEO Explorer 提供之 3 大核心解決方案" : lang === "en" ? "3 Core Solutions of GEO Explorer" : "GEO Explorer が提供する 3大コアソリューション"}
            </h2>
          </div>

          <div className="space-y-16">
            {/* Feature 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                  {t.f1_badge}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{t.f1_title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t.f1_desc}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 text-slate-800 shadow-sm space-y-3 font-mono text-xs border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-200">
                  <span>Prompt: {lang === "zh-TW" ? "企業級 AI 英会話 推薦" : lang === "en" ? "Best Enterprise AI Language App" : "法人向けAI英会話 おすすめ"}</span>
                  <span className="text-indigo-600 font-bold">Live Scan</span>
                </div>
                <div className="text-slate-700 leading-relaxed">
                  [Your Brand] {lang === "zh-TW" ? "提及: ◯ (引用率: 25.0%)" : lang === "en" ? "Mention: Yes (Share: 25.0%)" : "言及: ◯ (引用率: 25.0%)"}<br />
                  [Competitor A] {lang === "zh-TW" ? "提及: ◯ (引用率: 45.0%)" : lang === "en" ? "Mention: Yes (Share: 45.0%)" : "言及: ◯ (引用率: 45.0%)"}<br />
                  [Competitor B] {lang === "zh-TW" ? "提及: ◯ (引用率: 30.0%)" : lang === "en" ? "Mention: Yes (Share: 30.0%)" : "言及: ◯ (引用率: 30.0%)"}
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 font-mono text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Query Fan-out
                </div>
                <div className="space-y-2 pt-2">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800">1. {lang === "zh-TW" ? "企業 AI 英語培訓 費用行情" : lang === "en" ? "Enterprise AI English Training Cost" : "法人 AI英会話 研修 費用相場"}</div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800">2. {lang === "zh-TW" ? "AI 語言學習軟體 企業方案 優點" : lang === "en" ? "AI Language App Corporate Plan Benefits" : "AI英会話アプリ 法人契約 メリット"}</div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800">3. {lang === "zh-TW" ? "推薦 企業級 AI 英語 App 評比" : lang === "en" ? "Top Corporate AI English App Comparison" : "おすすめ 法人向けAI英会話 比較表"}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-bold">
                  {t.f2_badge}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{t.f2_title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t.f2_desc}</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                  {t.f3_badge}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{t.f3_title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t.f3_desc}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3 text-xs">
                <div className="font-bold text-indigo-600 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  AEO Direct-Answer Framework
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
                  <strong className="block text-slate-900 font-bold mb-1">
                    {lang === "zh-TW" ? "Q. 企業導入 AI 英語培訓的平均費用是多少？" : lang === "en" ? "Q. What is the average cost of corporate AI English training?" : "Q. 法人向けAI英会話の費用相場はいくら？"}
                  </strong>
                  <span className="text-indigo-700 font-bold">
                    {lang === "zh-TW" ? "「每人每月約 NT$ 350〜800 元，相較於傳統外籍家教或實體培訓可節省約 70% 預算。」" : lang === "en" ? "“Corporate AI English training averages $10 to $25 per user monthly, reducing costs by up to 70% compared to traditional live tutoring.”" : "「月額1人あたり1,500円〜3,500円が相場であり、従来のオンライン英会話の約1/3の費用で導入可能です。」"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-200/80 text-slate-900">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-10">
          <div className="space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Pricing</span>
            <h2 className="text-3xl font-bold text-slate-950 tracking-tight">{t.pricing_title}</h2>
            <p className="text-xs text-slate-500">{t.pricing_desc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white p-7 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="font-bold text-slate-900">Starter</div>
                <div className="text-2xl font-black text-slate-900 my-3">
                  {lang === "zh-TW" ? "NT$ 2,190" : lang === "en" ? "$69" : "¥9,800"} 
                  <span className="text-xs font-normal text-slate-500">/{lang === "zh-TW" ? "月" : lang === "en" ? "mo" : "月"}</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">
                  {lang === "zh-TW" ? "適合中小企業個人行銷人員・自媒體" : lang === "en" ? "For in-house marketers and media creators" : "中小企業の1人マーケター・個人メディア向け"}
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 30 {lang === "zh-TW" ? "提示詞追蹤 /月" : lang === "en" ? "Prompts tracked /mo" : "プロンプト追跡 /月"}</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 5 {lang === "zh-TW" ? "篇 AEO 文章生成 /月" : lang === "en" ? "AEO Articles /mo" : "本 AEO記事生成 /月"}</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> {lang === "zh-TW" ? "引用差距 ＆ 擴展查詢提取" : lang === "en" ? "Citation gaps & Fan-out extraction" : "引用ギャップ・ファンアウト抽出"}</li>
                </ul>
              </div>
              <Link href="/pricing" className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl text-center transition-all">
                {lang === "zh-TW" ? "訂閱 Starter 方案" : lang === "en" ? "Get Starter" : "Starter を申し込む"}
              </Link>
            </div>

            <div className="bg-white p-7 rounded-2xl border-2 border-indigo-600 shadow-xl relative -translate-y-1 flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-md">
                {lang === "zh-TW" ? "最受歡迎 No.1" : lang === "en" ? "Most Popular" : "人気 No.1"}
              </div>
              <div>
                <div className="font-bold text-slate-900">Growth</div>
                <div className="text-2xl font-black text-slate-900 my-3">
                  {lang === "zh-TW" ? "NT$ 6,590" : lang === "en" ? "$199" : "¥29,800"} 
                  <span className="text-xs font-normal text-slate-500">/{lang === "zh-TW" ? "月" : lang === "en" ? "mo" : "月"}</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">
                  {lang === "zh-TW" ? "適合專任行銷團隊・快速成長型企業" : lang === "en" ? "For marketing teams and growing brands" : "専任マーケ部門・中堅成長企業向け"}
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 150 {lang === "zh-TW" ? "提示詞追蹤 /月" : lang === "en" ? "Prompts tracked /mo" : "プロンプト追跡 /月"}</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 25 {lang === "zh-TW" ? "篇 AEO 文章生成 /月" : lang === "en" ? "AEO Articles /mo" : "本 AEO記事生成 /月"}</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> {lang === "zh-TW" ? "每週自動定期監測 ＆ 成效追蹤" : lang === "en" ? "Weekly auto-monitoring & tracker" : "週次自動定点観測 & 効果測定"}</li>
                </ul>
              </div>
              <Link href="/pricing" className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl text-center shadow-lg shadow-indigo-500/25 transition-all">
                {lang === "zh-TW" ? "訂閱 Growth 方案" : lang === "en" ? "Get Growth" : "Growth を申し込む"}
              </Link>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="font-bold text-slate-900">Agency</div>
                <div className="text-2xl font-black text-slate-900 my-3">
                  {lang === "zh-TW" ? "NT$ 17,900" : lang === "en" ? "$499" : "¥79,800"} 
                  <span className="text-xs font-normal text-slate-500">/{lang === "zh-TW" ? "月" : lang === "en" ? "mo" : "月"}</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">
                  {lang === "zh-TW" ? "適合 SEO/數位代理商・顧問公司" : lang === "en" ? "For SEO agencies and consulting firms" : "SEO代理店・Webコンサルティング企業向け"}
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 500 {lang === "zh-TW" ? "提示詞追蹤 /月" : lang === "en" ? "Prompts tracked /mo" : "プロンプト追跡 /月"}</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 100 {lang === "zh-TW" ? "篇 AEO 文章生成 /月" : lang === "en" ? "AEO Articles /mo" : "本 AEO記事生成 /月"}</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> {lang === "zh-TW" ? "自訂品牌 Logo 白標報告匯出" : lang === "en" ? "Custom White-label Reports" : "自社ロゴ入りホワイトラベル出力"}</li>
                </ul>
              </div>
              <Link href="/pricing" className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl text-center transition-all">
                {lang === "zh-TW" ? "訂閱 Agency 方案" : lang === "en" ? "Get Agency" : "Agency を申し込む"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            GEO Explorer by Traditionalart
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            <Link href="/insights" className="hover:text-white">{t.insights_nav}</Link>
            <Link href="/pricing" className="hover:text-white">{t.pricing_nav}</Link>
            <Link href="/terms" className="hover:text-white">{lang === "zh-TW" ? "服務條款" : lang === "en" ? "Terms of Service" : "利用規約"}</Link>
            <Link href="/privacy" className="hover:text-white">{lang === "zh-TW" ? "隱私權政策 (GDPR)" : lang === "en" ? "Privacy Policy (GDPR)" : "プライバシーポリシー (GDPR)"}</Link>
            <Link href="/legal" className="hover:text-white">{lang === "zh-TW" ? "特定商業交易法標示" : lang === "en" ? "Legal Notice" : "特定商取引法に基づく表記"}</Link>
          </div>
          <div className="text-slate-500">
            © 2026 Traditionalart Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
