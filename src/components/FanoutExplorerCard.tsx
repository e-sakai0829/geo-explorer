"use client";

import React from "react";
import { Layers, Zap, ArrowRight, CheckCircle } from "lucide-react";

interface FanoutExplorerCardProps {
  fanoutQueries: string[];
  coveredQueries?: string[];
  onInvestigateFanout: (query: string) => void;
}

export function FanoutExplorerCard({
  fanoutQueries,
  coveredQueries = [],
  onInvestigateFanout
}: FanoutExplorerCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">AI内部展開サブクエリ（クエリファンアウト解析）</h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          全 {fanoutQueries.length} クエリ検出
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        AIはメイン検索の裏で、ユーザーの深掘り意図を推測して以下のサブクエリを同時検索しています。各サブクエリでの競合勝敗を追跡・深掘り調査できます。
      </p>

      {fanoutQueries.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
          サブクエリはまだ検出されていません。プロンプトスキャンを実行してください。
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fanoutQueries.map((query, index) => {
          const isCovered = coveredQueries.includes(query);
          return (
            <div
              key={`${query}-${index}`}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                isCovered
                  ? 'bg-emerald-50/50 border-emerald-200/80'
                  : 'bg-slate-50 hover:bg-indigo-50/30 border-slate-200/80 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 leading-snug">
                  {query}
                </span>
                {isCovered && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle className="w-3 h-3" />
                    自社言及済
                  </span>
                )}
              </div>

              <button
                onClick={() => onInvestigateFanout(query)}
                className="w-full py-2 px-3 bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-[11px] rounded-lg border border-indigo-200 shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>このサブクエリで競合比較を実行 (1 pt)</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
