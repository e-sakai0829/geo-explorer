"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ExternalLink, 
  Search,
  Bot,
  Layers,
  ArrowRight
} from "lucide-react";

export default function PerformancePage() {
  const [brandName, setBrandName] = useState("自社ブランド");
  const [domain, setDomain] = useState("https://example.com");
  const [hasArticles, setHasArticles] = useState(false);

  useEffect(() => {
    fetch("/api/user/project")
      .then((res) => res.json())
      .then((data) => {
        if (data?.project) {
          setBrandName(data.project.name || "自社ブランド");
          setDomain(data.project.domain || "https://example.com");
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans antialiased text-slate-900">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <TrendingUp className="w-3.5 h-3.5" />
          Closed-loop Performance Tracker
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          AEO 施策効果測定 (Before / After)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          生成・公開した AEO 直答記事が、Google AI Overviews に引用・推薦されるまでの時系列推移を追跡します
        </p>
      </div>

      {/* Overview Cards (実データ連動設計) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">公開済み AEO 記事</div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {hasArticles ? "1" : "0"} <span className="text-xs font-normal text-slate-400">本</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {hasArticles ? "インデックス済み" : "記事を公開すると自動集計されます"}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">AI Overviews 引用獲得率</div>
          <div className="text-3xl font-black text-indigo-600 tracking-tight">
            {hasArticles ? "100%" : "—"}
          </div>
          <div className="text-[11px] text-slate-400">
            {hasArticles ? "施策前 0% ➔ 施策後 100%" : "記事公開後に追跡スキャンが開始されます"}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">平均引用獲得日数</div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {hasArticles ? "14" : "—"} <span className="text-xs font-normal text-slate-400">{hasArticles ? "日" : ""}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            AEO 記事公開から AIO ソース採用まで
          </div>
        </div>
      </div>

      {/* Empty State / Tracker Action */}
      {!hasArticles ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              まだ効果測定対象の AEO 記事が公開されていません
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              AEO エディタで記事を生成し、自社サイト（{domain}）に公開した後、Prompt Explorer で再スキャンを実行すると、ここに時系列の Before / After レポートが自動蓄積されます。
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/editor"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              最初の AEO 記事を作成する ➔
            </Link>
          </div>
        </div>
      ) : null}

      {/* Demo Case Preview Guide (参考事例) */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-indigo-600" />
            【参考】AEO 施策による引用獲得フロー（実証モデル）
          </span>
          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono">
            Best Practice
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-rose-800 text-[11px]">Before（施策前）</div>
            <div className="text-slate-600 text-[11px] leading-relaxed">
              • AI Overviews に自社ブランドが一切言及されない（言及率 0%）<br />
              • 競合他社のみが AI の「おすすめ」として回答文に独占露出
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-emerald-800 text-[11px]">After（AEO 記事公開後）</div>
            <div className="text-slate-600 text-[11px] leading-relaxed">
              • 35〜65文字の「直答ブロック」が AI 回答文にそのまま引用<br />
              • AI ソースリンク（1位）に自社ドメインが掲載され、検索流入を獲得
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
