"use client";

import React from "react";
import { ShieldCheck, Trophy, AlertTriangle, ArrowUpRight, Award, ChevronRight } from "lucide-react";

export interface CompetitorATSData {
  brandName: string;
  isTarget: boolean;
  atsScore: number;
  directScore: number;
  citationScore: number;
  fanoutScore: number;
}

interface ATSBenchmarkCardProps {
  targetBrand: string;
  data: CompetitorATSData[];
  gapDiagnosis?: string;
  onExplorePrompts?: () => void;
  exploreButtonLabel?: string;
}

export function ATSBenchmarkCard({
  targetBrand,
  data,
  gapDiagnosis,
  onExplorePrompts,
  exploreButtonLabel = "プロンプト詳細を調査"
}: ATSBenchmarkCardProps) {
  // スコア順にソート
  const sortedData = [...data].sort((a, b) => b.atsScore - a.atsScore);
  const targetItem = data.find(d => d.isTarget);
  const topCompetitor = sortedData.find(d => !d.isTarget);
  const atsGap = targetItem && topCompetitor ? targetItem.atsScore - topCompetitor.atsScore : 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            AI-Trust Score (ATS) Benchmarking
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            自社 vs 競合 AI信頼・参照強度 (ATS) 比較
          </h2>
        </div>

        {targetItem && (
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-500 font-semibold">自社スコア:</span>
            <span className={`text-2xl font-black ${targetItem.atsScore >= 70 ? 'text-emerald-600' : targetItem.atsScore >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
              {targetItem.atsScore} <span className="text-xs font-semibold text-slate-400">/ 100 pt</span>
            </span>
          </div>
        )}
      </div>

      {/* Main Ranking Table */}
      {sortedData.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
          比較できるデータがまだありません。プロンプトスキャンを実行してください。
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" aria-label="自社と競合のAI-Trust Score比較テーブル">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200/70">
              <th scope="col" className="py-3 px-3">順位</th>
              <th scope="col" className="py-3 px-3">ブランド / ドメイン</th>
              <th scope="col" className="py-3 px-3 text-center">総合 ATS</th>
              <th scope="col" className="py-3 px-3 text-center">① AI言及 (40pt)</th>
              <th scope="col" className="py-3 px-3 text-center">② 一次ソース (40pt)</th>
              <th scope="col" className="py-3 px-3 text-center">③ ファンアウト (20pt)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.map((item, index) => {
              const rank = index + 1;
              return (
                <tr
                  key={`${item.brandName}-${index}`}
                  className={`transition-colors ${
                    item.isTarget 
                      ? 'bg-indigo-50/60 font-semibold text-slate-900 border-l-4 border-l-indigo-600' 
                      : 'hover:bg-slate-50/80 text-slate-700'
                  }`}
                >
                  <td className="py-3.5 px-3">
                    <span className="flex items-center gap-1">
                      {rank === 1 ? (
                        <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : rank === 2 ? (
                        <Award className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <span className="w-4 text-center font-bold text-slate-400">{rank}</span>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-bold">{item.brandName}</span>
                    {item.isTarget && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white font-bold text-[10px] rounded-full">
                        自社
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`font-black text-sm ${item.atsScore >= 70 ? 'text-emerald-600' : item.atsScore >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {item.atsScore} pt
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-600 font-semibold">
                    {item.directScore} pt
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-600 font-semibold">
                    {item.citationScore} pt
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-600 font-semibold">
                    {item.fanoutScore} pt
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      {/* Gap Analysis Summary & CTA */}
      {sortedData.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-amber-900">勝敗要因診断: </span>
              <span className="text-amber-800">
                {gapDiagnosis || (atsGap < 0
                  ? `首位競合と ${Math.abs(atsGap)}pt の差が開いています。「一次情報ソース露出」と「ファンアウト網羅度」の改善が必要です。`
                  : '首位を維持しています。主要参照メディアでの最新露出をキープしてください。')}
              </span>
            </div>
          </div>

          {onExplorePrompts && (
            <button
              onClick={onExplorePrompts}
              className="inline-flex items-center gap-1 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              <span>{exploreButtonLabel}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
