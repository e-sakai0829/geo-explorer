"use client";

import { useState } from "react";
import { TrendingUp, Plus, CheckCircle2, ArrowUpRight, Globe, FileText, Calendar } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const performanceData = [
  { time: "公開前 (Before)", 引用率_Ailo: 0, 競合平均: 42 },
  { time: "公開1週後", 引用率_Ailo: 8, 競合平均: 40 },
  { time: "公開2週後", 引用率_Ailo: 22, 競合平均: 38 },
  { time: "公開3週後", 引用率_Ailo: 35, 競合平均: 36 },
  { time: "公開4週後", 引用率_Ailo: 48, 競合平均: 35 },
];

export default function PerformancePage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Closed-Loop ROI Tracker
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            クローズドループ効果測定（Before / After）
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            作成・公開したAEO記事が、実際にAI検索エンジンにどれだけ引用されるようになったかの時系列成果を可視化します
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer">
          <Plus className="w-4 h-4" />
          公開記事URLを登録して追跡開始
        </button>
      </div>

      {/* Featured Article ROI Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              追跡中（公開から28日経過）
            </span>
            <h2 className="text-base font-bold text-slate-900">
              記事: 法人向けAI英会話アプリの選び方とおすすめ比較【2026年最新】
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
              <span>https://ailo.jp/insights/b2b-ai-english-comparison</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> 公開日: 2026-07-30
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400">AI引用率の伸び</span>
              <div className="text-2xl font-bold text-emerald-600 flex items-center justify-end">
                <ArrowUpRight className="w-5 h-5" /> 0% ➔ 48%
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 mb-3">
            記事公開前後のAI引用シェア推移グラフ
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Line type="monotone" dataKey="引用率_Ailo" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="競合平均" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
