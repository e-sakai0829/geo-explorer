"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { MonthlyLLMReport } from "@/types/geo";

// dataviz スキル参照パレット 先頭3スロット（3系列all-pairs検証済み: blue/orange/aqua）
const COLOR_GEMINI = "#2a78d6";
const COLOR_CHATGPT = "#eb6834";
const COLOR_COMPETITOR = "#1baf7a";

const INK_SECONDARY = "#52514e";
const GRID_LINE = "#e1e0d9";

interface RecommendTrendChartProps {
  trend: MonthlyLLMReport[];
}

function formatWeek(label: string) {
  const d = new Date(label);
  if (Number.isNaN(d.getTime())) return label;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function pct(v: number | null | undefined) {
  return v === null || v === undefined ? undefined : Math.round(v * 1000) / 10;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-xs space-y-1.5">
      <div className="font-bold text-slate-900">{formatWeek(label)} 週</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-bold text-slate-900 font-mono">
            {p.value === undefined || p.value === null ? "ー" : `${p.value}%`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RecommendTrendChart({ trend }: RecommendTrendChartProps) {
  const hasEnoughData = trend.length >= 2;

  const chartData = trend.map((t) => ({
    week: t.periodLabel,
    gemini: pct(t.geminiRecommendRate),
    chatgpt: pct(t.chatgptRecommendRate),
    competitor: pct(t.competitorAvgRecommendRate),
  }));

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          推奨率の週次推移（GRCモニタリング）
        </div>
        <span className="text-[11px] text-slate-400">Gemini / ChatGPT / 競合平均</span>
      </div>

      {!hasEnoughData ? (
        <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-1">
          <div>週次データが2件以上たまるとここに推移グラフが表示されます。</div>
          <div className="text-slate-300">プロンプトスキャンを継続的に実行してください。</div>
        </div>
      ) : (
        <div className="h-72" role="img" aria-label="Gemini・ChatGPT・競合平均の推奨率の週次推移を示す折れ線グラフ">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={GRID_LINE} strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="week"
                tickFormatter={formatWeek}
                tick={{ fill: INK_SECONDARY, fontSize: 11 }}
                axisLine={{ stroke: GRID_LINE }}
                tickLine={false}
              />
              <YAxis
                unit="%"
                domain={[0, 100]}
                tick={{ fill: INK_SECONDARY, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={28}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: INK_SECONDARY }}
              />
              <Line
                type="monotone"
                dataKey="gemini"
                name="Gemini推奨率"
                stroke={COLOR_GEMINI}
                strokeWidth={2}
                dot={{ r: 3, fill: COLOR_GEMINI, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="chatgpt"
                name="ChatGPT推奨率"
                stroke={COLOR_CHATGPT}
                strokeWidth={2}
                dot={{ r: 3, fill: COLOR_CHATGPT, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="competitor"
                name="競合平均推奨率"
                stroke={COLOR_COMPETITOR}
                strokeWidth={2}
                dot={{ r: 3, fill: COLOR_COMPETITOR, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
