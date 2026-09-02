"use client";

import React from "react";
import { TrendingUp, Calendar, RefreshCw } from "lucide-react";

export interface TrackerItem {
  id: string;
  promptText: string;
  articleTitle: string;
  publishedAt: string; // "2026-08-01"
  beforeATS: number; // 42
  afterATS: number;  // 78
  status: 'tracking' | 'achieved' | 'pending';
}

interface BeforeAfterTrackerCardProps {
  items: TrackerItem[];
  onReScan?: (id: string) => void;
}

export function BeforeAfterTrackerCard({ items, onReScan }: BeforeAfterTrackerCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs tracking-wider uppercase mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Closed-Loop ROI Tracker
          </div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Before / After 成果自動トラッカー（対策効果測定）
          </h3>
        </div>
        <span className="text-[11px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold border border-emerald-200 self-start sm:self-auto">
          全 {items.length} 件の対策記事を定点観測中
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        公開したAEO対策記事が、AI検索の露出・信頼度（ATSスコア）をどれだけ向上させたかを公開前後で自動測定します。成果をエビデンスとして可視化します。
      </p>

      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
          まだ計測中の対策記事がありません。AEO記事を公開すると、ここに効果測定結果が表示されます。
        </div>
      ) : (
      <div className="space-y-3">
        {items.map((item, index) => {
          const beforeATS = Number.isFinite(item.beforeATS) ? item.beforeATS : 0;
          const afterATS = Number.isFinite(item.afterATS) ? item.afterATS : 0;
          const atsDiff = afterATS - beforeATS;
          const diffStyle = atsDiff > 0
            ? 'bg-emerald-100 text-emerald-800'
            : atsDiff < 0
              ? 'bg-rose-100 text-rose-700'
              : 'bg-slate-100 text-slate-700';
          const diffLabel = atsDiff > 0 ? `+${atsDiff} pt 向上 🎉` : atsDiff < 0 ? `${atsDiff} pt 低下` : '変化なし (0pt)';

          return (
            <div
              key={item.id || index}
              className="p-4 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
                    プロンプト
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {item.promptText}
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-700">対策記事:</span>
                  <span className="truncate">{item.articleTitle}</span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                    <Calendar className="w-3 h-3" /> {item.publishedAt} 公開
                  </span>
                </div>
              </div>

              {/* Before vs After ATS Score Comparison Box */}
              <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-slate-400">公開前 (Before)</div>
                  <div className="text-sm font-black text-slate-600">{beforeATS} pt</div>
                </div>

                <div className="text-slate-300 font-bold">➔</div>

                <div className="text-center">
                  <div className="text-[10px] font-bold text-emerald-600">公開4週後 (After)</div>
                  <div className="text-sm font-black text-emerald-600">{afterATS} pt</div>
                </div>

                <div className="pl-2 border-l border-slate-100 text-right">
                  <div className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-black ${diffStyle}`}>
                    {diffLabel}
                  </div>
                </div>

                {onReScan && (
                  <button
                    onClick={() => onReScan(item.id)}
                    aria-label="再スキャンして最新のATSを取得"
                    className="pl-2 border-l border-slate-100 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
