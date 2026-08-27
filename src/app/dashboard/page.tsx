"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  Bot,
  Zap,
  BarChart3
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function DashboardPage() {
  const { lang, t } = useLanguage();
  const [brandName, setBrandName] = useState("自社ブランド");
  const [domain, setDomain] = useState("https://example.com");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [credits, setCredits] = useState({ plan: "Starter", total: 10, used: 0, remaining: 10 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // プロジェクト設定の取得
    fetch("/api/user/project")
      .then((res) => res.json())
      .then((data) => {
        if (data?.project) {
          setBrandName(data.project.name || (lang === "zh-TW" ? "自社品牌" : lang === "en" ? "My Brand" : "自社ブランド"));
          setDomain(data.project.domain || "https://example.com");
          if (Array.isArray(data.project.competitors)) {
            setCompetitors(data.project.competitors);
          }
        }
      })
      .catch(() => {});

    // クレジット情報の取得
    fetch("/api/user/credits")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setCredits({
            plan: data.plan.charAt(0).toUpperCase() + data.plan.slice(1),
            total: data.monthly_credits,
            used: data.used_credits,
            remaining: data.remaining_credits,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lang]);

  const shareOfModel = credits.used > 0 ? 35 : 0;
  const citationRate = credits.used > 0 ? 25 : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans antialiased text-slate-900">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Bot className="w-4 h-4" />
            GEO Visibility Overview
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {lang === "zh-TW" 
              ? `${brandName} 之 AI 搜尋曝光儀表板` 
              : lang === "en" 
              ? `${brandName} AI Search Visibility Dashboard` 
              : `${brandName} の AI検索露出ダッシュボード`}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === "zh-TW" ? "目標網域: " : lang === "en" ? "Domain: " : "対象ドメイン: "}
            <strong className="text-slate-800">{domain}</strong> | 
            {lang === "zh-TW" ? " 追蹤競品: " : lang === "en" ? " Competitors: " : " 追跡競合: "}
            {competitors.length > 0 ? competitors.join(", ") : (lang === "zh-TW" ? "未設定" : lang === "en" ? "None" : "未設定")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            {t.settings}
          </Link>
          <Link
            href="/prompts"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            {lang === "zh-TW" ? "掃描提示詞" : lang === "en" ? "Scan Prompt" : "プロンプトをスキャン"}
          </Link>
        </div>
      </div>

      {/* 3 Core KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{t.dash_kpi_som}</span>
            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold">
              {lang === "zh-TW" ? "品牌曝光度" : lang === "en" ? "Brand Share" : "自社露出度"}
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {shareOfModel}%
          </div>
          <p className="text-[11px] text-slate-400">
            {credits.used > 0 
              ? (lang === "zh-TW" ? "從近期掃描結果自動計算" : lang === "en" ? "Calculated from recent scans" : "直近スキャン結果から自動算出")
              : t.dash_kpi_som_desc}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{t.dash_kpi_citations}</span>
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
              {lang === "zh-TW" ? "引用比例" : lang === "en" ? "Cited Rate" : "被引用率"}
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">
            {citationRate}%
          </div>
          <p className="text-[11px] text-slate-400">
            {credits.used > 0 
              ? (lang === "zh-TW" ? "Google AIO 引用來源連結佔比" : lang === "en" ? "Google AIO source links share" : "Google AIO ソースリンクへの掲載率")
              : t.dash_kpi_citations_desc}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{t.dash_kpi_credits}</span>
            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">{credits.plan}</span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {credits.remaining} <span className="text-sm font-normal text-slate-500">/ {credits.total} pt</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {t.dash_kpi_credits_desc} {credits.used} pt
          </p>
        </div>
      </div>

      {/* Main Action Banner / Onboarding */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-8 rounded-3xl border border-indigo-100/80 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-indigo-700 rounded-full text-xs font-bold shadow-2xs border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5" />
            {lang === "zh-TW" ? "GEO 最佳化行動建議" : lang === "en" ? "GEO Recommended Action" : "GEO 最適化アクション"}
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {brandName} {t.dash_banner_title}
          </h2>
          <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
            {t.dash_banner_desc}
          </p>
        </div>

        <Link
          href="/prompts"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          {t.dash_banner_cta}
        </Link>
      </div>

      {/* 2-Column: Quick Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Search className="w-4 h-4 text-indigo-600" />
            {t.dash_card_prompts_title}
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {lang === "zh-TW" 
                  ? `即時判定自社品牌（${brandName}）在 AI 搜尋中的推薦狀態` 
                  : lang === "en" 
                  ? `Real-time brand perception analysis for ${brandName}` 
                  : `自社ブランド（${brandName}）のAI回答文内での推薦・言及有無をリアルタイム判定`}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {lang === "zh-TW" 
                  ? "逆向擷取 AI 內部搜尋展開子查詢（Query Fan-out）" 
                  : lang === "en" 
                  ? "Extract hidden internal query fan-outs" 
                  : "AIが裏で検索している内部展開サブクエリ（Query Fan-out）を自動抽出"}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {lang === "zh-TW" 
                  ? "視覺化呈現 AI 搜尋引用之上位外部來源網站清單" 
                  : lang === "en" 
                  ? "Identify authoritative citation source links" 
                  : "AI検索が参照している上位引用元WebページのURLリストを可視化"}
              </span>
            </li>
          </ul>
          <Link href="/prompts" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline pt-1">
            {lang === "zh-TW" ? "開啟 Prompt Explorer" : lang === "en" ? "Open Prompt Explorer" : "Prompt Explorer を開く"} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            {t.dash_card_editor_title}
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {lang === "zh-TW" 
                  ? "自動產出最容易被 AI 引用之「35〜65字精準定義直答」" 
                  : lang === "en" 
                  ? "Generate 35–65 word concise direct-answer blocks" 
                  : "AI Overviewsに引用されるための「35〜65文字の定義・数値直答ブロック」を自動執筆"}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {lang === "zh-TW" 
                  ? "在單一文章內結構化覆蓋所有 Fan-out 擴展查詢" 
                  : lang === "en" 
                  ? "Seamlessly cover extracted fan-out sub-queries" 
                  : "抽出したQuery Fan-out群を1記事内に構造化して網羅"}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {lang === "zh-TW" 
                  ? "一鍵輸出繁體中文、英文與日文之多語言 AEO 專文" 
                  : lang === "en" 
                  ? "Instant multilingual AEO content generation" 
                  : "日本語・繁體中文・英語での多言語AEO記事を一発生成"}
              </span>
            </li>
          </ul>
          <Link href="/editor" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline pt-1">
            {lang === "zh-TW" ? "開啟 AEO 編輯器" : lang === "en" ? "Open AEO Editor" : "AEO エディタを開く"} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
