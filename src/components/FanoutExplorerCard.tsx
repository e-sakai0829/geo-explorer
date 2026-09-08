"use client";

import React from "react";
import { Layers, Zap, ArrowRight, CheckCircle } from "lucide-react";

interface FanoutExplorerCardProps {
  fanoutQueries: string[];
  coveredQueries?: string[];
  parentPrompt?: string;
  onInvestigateFanout: (query: string) => void;
}

/** 単語をスペースや句読点でトークン分割する */
function tokenizeWords(text: string): string[] {
  if (!text) return [];
  return text
    .trim()
    .split(/[\s　,、+＋/／|｜-]+/)
    .filter((w) => w.length > 0);
}

/** 親プロンプトとサブクエリの単語差分を算出する (Elmo型 Query Rewrite Engine) */
function getWordDiff(parentText: string, subQuery: string) {
  const parentTokens = tokenizeWords(parentText);
  const subTokens = tokenizeWords(subQuery);

  if (parentTokens.length === 0) {
    return {
      tokens: subTokens.map((w) => ({ word: w, type: "kept" as const })),
      addedCount: 0,
      dropped: [] as string[],
    };
  }

  const parentSet = new Set(parentTokens.map((w) => w.toLowerCase()));
  const subSet = new Set(subTokens.map((w) => w.toLowerCase()));

  const tokens = subTokens.map((word) => {
    const isAdded = !parentSet.has(word.toLowerCase());
    return {
      word,
      type: isAdded ? ("added" as const) : ("kept" as const),
    };
  });

  const addedCount = tokens.filter((t) => t.type === "added").length;
  const dropped = parentTokens.filter((w) => !subSet.has(w.toLowerCase()));

  return { tokens, addedCount, dropped };
}

export function FanoutExplorerCard({
  fanoutQueries,
  coveredQueries = [],
  parentPrompt = "営業DX ツール 比較",
  onInvestigateFanout
}: FanoutExplorerCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">AI内部展開サブクエリ（クエリファンアウト ＆ 単語リライト解析）</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black border border-indigo-200">
            Query Rewrite Engine
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            全 {fanoutQueries.length} クエリ検出
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <p className="leading-relaxed">
          AIは入力された検索クエリの裏で、意図を補完するために以下のサブクエリを同時検索しています。
        </p>
        <div className="flex items-center gap-2 text-[10px] shrink-0 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          <span className="inline-flex items-center gap-1 text-indigo-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span> +追加語 (意図補完)
          </span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <span className="line-through">除外語</span>
          </span>
        </div>
      </div>

      {fanoutQueries.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
          サブクエリはまだ検出されていません。プロンプトスキャンを実行してください。
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fanoutQueries.map((query, index) => {
          const isCovered = coveredQueries.includes(query);
          const diff = getWordDiff(parentPrompt, query);

          return (
            <div
              key={`${query}-${index}`}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                isCovered
                  ? 'bg-emerald-50/50 border-emerald-200/80'
                  : 'bg-slate-50 hover:bg-indigo-50/30 border-slate-200/80 hover:border-indigo-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  {/* 単語差分ハイライト描画 */}
                  <div className="flex flex-wrap items-center gap-1 text-xs leading-relaxed">
                    {diff.tokens.map((token, tIdx) => (
                      <span
                        key={tIdx}
                        className={
                          token.type === "added"
                            ? "px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold border border-indigo-200 text-[11px]"
                            : "text-slate-800 font-bold"
                        }
                      >
                        {token.type === "added" ? `+${token.word}` : token.word}
                      </span>
                    ))}
                  </div>

                  {isCovered && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle className="w-3 h-3" />
                      自社言及済
                    </span>
                  )}
                </div>

                {/* AIが削った単語（Dropped）の可視化 */}
                {diff.dropped.length > 0 && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>AI除外語:</span>
                    <span className="line-through text-slate-400 font-medium">
                      {diff.dropped.join(", ")}
                    </span>
                  </div>
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
