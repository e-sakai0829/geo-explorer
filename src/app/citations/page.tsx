"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Link2, 
  ExternalLink, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  Layers, 
  Globe, 
  ShieldCheck, 
  Search, 
  ArrowRight 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function CitationsPage() {
  const { lang, t } = useLanguage();

  const mediaData = {
    ja: [
      { domain: "itmedia.co.jp", name: "ITmedia ビジネスオンライン", citations: 42, category: "BtoBビジネス・IT", authority: 88 },
      { domain: "toyokeizai.net", name: "東洋経済オンライン", citations: 35, category: "経済・企業分析", authority: 92 },
      { domain: "diamond.jp", name: "ダイヤモンド・オンライン", citations: 29, category: "経営・ビジネス戦略", authority: 90 },
      { domain: "boxil.jp", name: "ボクシル (BOXIL SaaS)", citations: 26, category: "SaaS比較メディア", authority: 82 },
    ],
    "zh-TW": [
      { domain: "bnext.com.tw", name: "數位時代 BusinessNext", citations: 45, category: "科技與商業趨勢", authority: 89 },
      { domain: "ithome.com.tw", name: "iThome 電腦報", citations: 38, category: "企業 IT 與資安", authority: 87 },
      { domain: "technews.tw", name: "科技新報 TechNews", citations: 31, category: "產業深度分析", authority: 85 },
      { domain: "inside.com.tw", name: "INSIDE 硬塞的網路趨勢", citations: 28, category: "網路創新與數位行銷", authority: 83 },
    ],
    en: [
      { domain: "techcrunch.com", name: "TechCrunch", citations: 52, category: "Enterprise & Tech", authority: 94 },
      { domain: "searchenginejournal.com", name: "Search Engine Journal", citations: 41, category: "SEO & Digital Strategy", authority: 89 },
      { domain: "gartner.com", name: "Gartner Insights", citations: 36, category: "B2B Market Research", authority: 92 },
      { domain: "forbes.com", name: "Forbes Business", citations: 33, category: "Management & Growth", authority: 93 },
    ],
  };

  const topMedia = mediaData[lang] || mediaData.ja;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans antialiased text-slate-900">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <Link2 className="w-3.5 h-3.5" />
          AI Citation Source Analyzer
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t.cit_title}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t.cit_desc}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">{t.cit_total_sources}</div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">132 <span className="text-xs font-normal text-slate-400">URLs</span></div>
          <div className="text-[11px] text-indigo-700 font-medium leading-relaxed pt-2 border-t border-slate-100">
            💡 {lang === "zh-TW" 
              ? "AI 引用的網頁總數（數量越多代表該市場對策價值越高）" 
              : lang === "en" 
              ? "Total Web Pages Cited by AI (Higher = High Priority Market)" 
              : "AIが参照したWebページ数（多いほど対策価値の高い市場）"}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">{t.cit_top_domains}</div>
          <div className="text-3xl font-black text-indigo-600 tracking-tight">18 <span className="text-xs font-normal text-slate-400">Domains</span></div>
          <div className="text-[11px] text-emerald-700 font-medium leading-relaxed pt-2 border-t border-slate-100">
            💡 {lang === "zh-TW" 
              ? "AI 學習採用的主要網域數（反映權威媒體壟斷程度）" 
              : lang === "en" 
              ? "Top Domains Used by AI (Shows Authority Concentration)" 
              : "AIが学習に利用した主要ドメイン数（上位の独占度を提示）"}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">
            {lang === "zh-TW" ? "引用差距突破難易度" : lang === "en" ? "Citation Gap Difficulty" : "被引用ギャップ難易度"}
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {lang === "zh-TW" ? "中等" : lang === "en" ? "Medium" : "中 (Medium)"}
          </div>
          <div className="text-[11px] text-amber-700 font-medium leading-relaxed pt-2 border-t border-slate-100">
            💡 {lang === "zh-TW" 
              ? "引用奪取難易度（中：佈局 AEO 直答內容即可奪取引用）" 
              : lang === "en" 
              ? "Gap Difficulty (Medium: Win citations via direct AEO content)" 
              : "引用奪還の難易度（中: 直答構造コンテンツの追加で奪還可能）"}
          </div>
        </div>
      </div>

      {/* Top Media Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.cit_gap_title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "zh-TW" 
                ? "AI 搜尋引擎最常引用的權威媒體排名" 
                : lang === "en" 
                ? "Top citation sources Google AI Overviews relies upon" 
                : "AI検索が推薦時に最も参照しているWebメディア一覧"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-3.5">{lang === "zh-TW" ? "媒體 / 網域" : lang === "en" ? "Media / Domain" : "メディア / ドメイン"}</th>
                <th className="px-6 py-3.5">{lang === "zh-TW" ? "分類" : lang === "en" ? "Category" : "カテゴリ"}</th>
                <th className="px-6 py-3.5">{lang === "zh-TW" ? "AI 引用次數" : lang === "en" ? "AI Citations" : "AI引用回数"}</th>
                <th className="px-6 py-3.5">{lang === "zh-TW" ? "網域權重" : lang === "en" ? "Authority Score" : "オーソリティ"}</th>
                <th className="px-6 py-3.5">{lang === "zh-TW" ? "優先行動" : lang === "en" ? "Action" : "対策アクション"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topMedia.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{m.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{m.domain}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{m.category}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900">{m.citations}</span>
                    <span className="text-[10px] text-slate-400 ml-1">{lang === "zh-TW" ? "次" : lang === "en" ? "times" : "回"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[11px]">
                      DA {m.authority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/editor?prompt=${encodeURIComponent(m.name + " 比較 費用")}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {lang === "zh-TW" ? "產出對應 AEO 專文" : lang === "en" ? "Generate AEO Content" : "対抗AEO記事を作成"} ➔
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
