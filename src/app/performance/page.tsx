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
  Bot
} from "lucide-react";

export default function PerformancePage() {
  const [brandName, setBrandName] = useState("自社ブランド");
  const [domain, setDomain] = useState("https://example.com");

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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">公開済み AEO 記事</div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">1 <span className="text-xs font-normal text-slate-400">本</span></div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> インデックス済み
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">AI Overviews 引用獲得率</div>
          <div className="text-3xl font-black text-indigo-600 tracking-tight">100%</div>
          <div className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> 施策前 0% ➔ 施策後 100%
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">平均引用獲得日数</div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">14 <span className="text-xs font-normal text-slate-400">日</span></div>
          <div className="text-[11px] text-slate-400">
            AEO 記事公開から AIO ソース採用まで
          </div>
        </div>
      </div>

      {/* Before / After Case Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">追跡中プロンプトの Before / After</h2>
            <p className="text-xs text-slate-500 mt-0.5">自社ブランド: <strong className="text-slate-800">{brandName}</strong> ({domain})</p>
          </div>
          <Link
            href="/editor"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            新規 AEO 記事を作成
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-sm text-slate-900">
                  {brandName} サービス導入 費用・効果
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  引用獲得成功
                </span>
              </div>
              <span className="text-xs text-slate-400">初回スキャン: 2026/08/10 ➔ 最新: 2026/08/24</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Before */}
              <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-100 space-y-2">
                <div className="font-bold text-rose-800 flex items-center justify-between">
                  <span>Before（施策前）</span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded">未露出</span>
                </div>
                <div className="text-slate-600 leading-relaxed text-[11px]">
                  • 自社ブランド言及: <strong>なし (0%)</strong><br />
                  • AI 引用元ソース: <strong>未掲載</strong><br />
                  • 競合他社のみが AI Overviews で推薦されている状態
                </div>
              </div>

              {/* After */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2">
                <div className="font-bold text-emerald-800 flex items-center justify-between">
                  <span>After（AEO 記事公開後）</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">推薦獲得</span>
                </div>
                <div className="text-slate-600 leading-relaxed text-[11px]">
                  • 自社ブランド言及: <strong>あり (トップ推薦)</strong><br />
                  • AI 引用元ソース: <strong>掲載獲得（1位リンク）</strong><br />
                  • 35〜65文字直答ブロックが AI 回答文にそのまま引用
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                対策記事: <strong className="text-slate-700">{domain}/insights/guide</strong>
              </span>
              <Link href="/prompts" className="text-indigo-600 font-bold hover:underline flex items-center gap-1">
                再スキャンを実行 <Search className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
