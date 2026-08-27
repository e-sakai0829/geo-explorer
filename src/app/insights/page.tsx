"use client";

import Link from "next/link";
import { BookOpen, Sparkles, ArrowRight, Clock, Tag, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function InsightsIndexPage() {
  const { lang, t } = useLanguage();

  const articles = [
    {
      slug: "what-is-geo-and-aio-guide",
      title: lang === "zh-TW" 
        ? "什麼是 GEO（生成式引擎最佳化）？從 SEO 轉向 AEO 的完整實戰指南" 
        : lang === "en" 
        ? "What is GEO (Generative Engine Optimization)? Complete Guide from SEO to AEO" 
        : "GEO（Generative Engine Optimization）とは？SEOからAEOへの転換完全ガイド",
      description: lang === "zh-TW" 
        ? "解析 Google AI Overviews 時代下「零點擊搜尋」之應對策略，以及 35〜65 字精準直答架構。" 
        : lang === "en" 
        ? "Navigating zero-click search with Google AI Overviews using 35–65 word concise direct answers." 
        : "Google AI Overviews時代におけるゼロクリック検索の脅威と、35〜65文字の直答フレームワークを解説。",
      category: "GEO基礎理論",
      readTime: "5 min",
      date: "2026/08/25",
    },
    {
      slug: "google-aio-citation-rules",
      title: lang === "zh-TW" 
        ? "Google AI Overviews 引用機制解析：AI 如何決定推薦哪些外部網站？" 
        : lang === "en" 
        ? "How Google AI Overviews Selects Source Links & Brand Citations" 
        : "Google AI Overviewsの引用ルール：AIはどうやって参照元リンクを選ぶのか？",
      description: lang === "zh-TW" 
        ? "深入探討 Query Fan-out 展開機制與表格資料對 AI 引用權重的決定性影響。" 
        : lang === "en" 
        ? "Deep-dive into Query Fan-out sub-queries and structured Markdown comparison tables." 
        : "内部展開サブクエリ（Query Fan-out）とMarkdown表がAIの引用アルゴリズムに与える影響を検証。",
      category: "AEOアルゴリズム",
      readTime: "7 min",
      date: "2026/08/26",
    },
    {
      slug: "btob-ai-search-opportunity-loss",
      title: lang === "zh-TW" 
        ? "BtoB 企業不可不知的「AI 搜尋機會損失」：當使用者不再點擊搜尋結果時" 
        : lang === "en" 
        ? "The Threat of Zero-Click Searches for BtoB Brands in AI Eras" 
        : "BtoB企業が直面する「AI検索の機会損失」：検索1位でも問い合わせが消える理由",
      description: lang === "zh-TW" 
        ? "為何傳統關鍵字第一名的流量依然萎縮？如何透過 Share of Model 奪回主導權。" 
        : lang === "en" 
        ? "Why organic traffic is plummeting despite top rankings and how to win Share of Model." 
        : "検索トップでもリードが激減する構造的理由と、Share of Model（言及シェア）の奪取法。",
      category: "BtoB事業戦略",
      readTime: "6 min",
      date: "2026/08/27",
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 font-sans antialiased text-slate-900">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <BookOpen className="w-3.5 h-3.5" />
          GEO & AEO Knowledge Hub
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {lang === "zh-TW" 
            ? "官方專欄 ＆ 生成式 AI 搜尋最佳化知識庫" 
            : lang === "en" 
            ? "Official Insights & GEO Knowledge Hub" 
            : "公式コラム・GEO/AEOナレッジ"}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {lang === "zh-TW" 
            ? "掌握 Google AI Overviews 引用演算法、Query Fan-out 與 AEO 實戰知識" 
            : lang === "en" 
            ? "Master Google AI Overviews citation mechanics, query fan-outs, and direct-answer strategies" 
            : "AI Overviews時代の被引用アルゴリズム、Query Fan-out対策、AEO直答ライティングの実践ノウハウ"}
        </p>
      </div>

      {/* Article List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((art) => (
          <Link
            key={art.slug}
            href={`/insights/${art.slug}`}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md">
                  {art.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {art.readTime}
                </span>
              </div>

              <h2 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                {art.title}
              </h2>

              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                {art.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>{lang === "zh-TW" ? "閱讀全文" : lang === "en" ? "Read Article" : "記事を読む"}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
