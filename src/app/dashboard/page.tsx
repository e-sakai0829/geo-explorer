"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Search,
  ExternalLink,
  Plus,
  BarChart3,
  Globe2,
  FileText
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from "recharts";

// サンプルデータ（時系列推移）
const trendData = [
  { week: "7/24", 自社_Ailo: 12, 競合_Speak: 45, 競合_プログリット: 30, 競合_DMM: 60 },
  { week: "7/31", 自社_Ailo: 15, 競合_Speak: 48, 競合_プログリット: 32, 競合_DMM: 58 },
  { week: "8/07", 自社_Ailo: 18, 競合_Speak: 50, 競合_プログリット: 35, 競合_DMM: 55 },
  { week: "8/14", 自社_Ailo: 25, 競合_Speak: 52, 競合_プログリット: 34, 競合_DMM: 54 },
  { week: "8/21", 自社_Ailo: 32, 競合_Speak: 53, 競合_プログリット: 36, 競合_DMM: 52 },
  { week: "8/28", 自社_Ailo: 38, 競合_Speak: 51, 競合_プログリット: 35, 競合_DMM: 50 },
];

const trackedPrompts = [
  {
    id: 1,
    prompt: "法人向けAI英会話研修でおすすめのサービスは？",
    category: "導入検討",
    targetMentioned: true,
    targetCited: true,
    competitors: ["Speak", "プログリット"],
    citationsCount: 18,
    difficulty: 62,
    status: "優良（言及・引用中）",
  },
  {
    id: 2,
    prompt: "BtoB営業DXを推進するおすすめのAIツール比較",
    category: "比較",
    targetMentioned: false,
    targetCited: false,
    competitors: ["HubSpot", "Salesforce", "Sansan"],
    citationsCount: 14,
    difficulty: 48,
    status: "要対策（競合のみ露出）",
  },
  {
    id: 3,
    prompt: "AI英会話アプリの効果と選び方・おすすめ",
    category: "ノウハウ",
    targetMentioned: true,
    targetCited: false,
    competitors: ["Speak", "ELSA Speak"],
    citationsCount: 22,
    difficulty: 55,
    status: "言及あり・引用なし",
  },
  {
    id: 4,
    prompt: "インサイドセールス代行の費用相場とおすすめ企業",
    category: "相場・費用",
    targetMentioned: false,
    targetCited: false,
    competitors: ["BALES", "ビズメイツ"],
    citationsCount: 12,
    difficulty: 38,
    status: "要対策（競合のみ露出）",
  },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Globe2 className="w-3.5 h-3.5" />
            AI-Search Optimization
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            GEO アナリティクス・ダッシュボード
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Google AI Overviews (AIO)・Gemini・AI検索エンジンにおける自社ブランド露出と引用シェアの定点観測
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/prompts"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            新規プロンプトを調査する
          </Link>
        </div>
      </div>

      {/* 4大 KPI Cards (ミエルカGEO + 光学調整デザイン) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>平均ブランド露出率</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">38.0%</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +6.0%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            調査プロンプト全体で自社ブランドが登場した割合
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>ブランドシェア率 (vs 競合)</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">42.5%</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +8.2%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
            <div className="bg-blue-600 h-full" style={{ width: "42.5%" }} title="自社 Ailo"></div>
            <div className="bg-slate-300 h-full" style={{ width: "57.5%" }} title="競合他社"></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>平均引用率 (URL Cited)</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ExternalLink className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">25.0%</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +4.5%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            AI回答内で自社ドメインが情報ソースとして引用された割合
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>奪取可能ギャップ数</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-amber-600 tracking-tight">8 件</span>
            <span className="text-xs text-slate-400 font-medium">/ 30 本中</span>
          </div>
          <p className="text-[11px] text-slate-400">
            競合が引用され自社が未引用の重要プロンプト
          </p>
        </div>
      </div>

      {/* 時系列シェア推移チャート */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              ブランド言及シェアの時系列推移（週次）
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              直近6週間のAI検索回答における自社 vs 主要競合3社の言及率推移
            </p>
          </div>
          <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            毎週月曜日 自動更新
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAilo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
              <Area type="monotone" dataKey="自社_Ailo" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAilo)" />
              <Area type="monotone" dataKey="競合_Speak" stroke="#9333ea" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
              <Area type="monotone" dataKey="競合_プログリット" stroke="#ea580c" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
              <Area type="monotone" dataKey="競合_DMM" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 追跡プロンプト一覧テーブル ＆ ギャップ奪取アクション */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              追跡プロンプト一覧 ＆ 引用ギャップ
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                {trackedPrompts.length} 本
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              競合に奪われているプロンプトをワンクリックでAEO直答記事として自動生成できます
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilter("gap")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === "gap" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              要対策ギャップのみ
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-6">プロンプト / 質問</th>
                <th className="py-3.5 px-4">カテゴリ</th>
                <th className="py-3.5 px-4 text-center">自社言及</th>
                <th className="py-3.5 px-4 text-center">自社引用</th>
                <th className="py-3.5 px-4">言及された競合</th>
                <th className="py-3.5 px-4 text-center">奪取難易度</th>
                <th className="py-3.5 px-6 text-right">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trackedPrompts
                .filter(p => filter === "all" || (filter === "gap" && !p.targetMentioned))
                .map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-900 max-w-sm">
                      <div className="truncate" title={p.prompt}>
                        {p.prompt}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {p.targetMentioned ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="w-4 h-4" /> ◯
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                          <XCircle className="w-4 h-4" /> ×
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {p.targetCited ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="w-4 h-4" /> ◯
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-300 font-bold">
                          -
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {p.competitors.map((c, i) => (
                          <span key={i} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.difficulty < 40 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : p.difficulty < 60 
                          ? "bg-amber-50 text-amber-700 border border-amber-200" 
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        Lv.{p.difficulty}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/editor?prompt=${encodeURIComponent(p.prompt)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors border border-blue-200/60"
                      >
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        AEO記事を自動生成
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
