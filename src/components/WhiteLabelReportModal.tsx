"use client";

import React, { useState } from "react";
import { FileText, X, Printer, Building } from "lucide-react";
import { useModalBehavior } from "@/lib/useModalBehavior";

interface WhiteLabelReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBrand: string;
  targetDomain: string;
  competitors: string[];
  atsScore: number;
}

export function WhiteLabelReportModal({
  isOpen,
  onClose,
  targetBrand,
  targetDomain,
  competitors,
  atsScore
}: WhiteLabelReportModalProps) {
  const [agencyLogoText, setAgencyLogoText] = useState("Web Marketing Agency Inc.");

  useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const createdAtLabel = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0 print:block"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="white-label-report-title"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print:max-w-none print:max-h-none print:rounded-none print:shadow-none print:border-0 print:overflow-visible"
      >
        {/* Modal Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 print:hidden">
          <div id="white-label-report-title" className="flex items-center gap-2 font-bold text-sm">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>クライアント提出用 ホワイトラベルPDFレポート生成 (Agency機能)</span>
          </div>
          <button onClick={onClose} aria-label="閉じる" className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Agency Logo Customizer Bar */}
        <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <label htmlFor="agency-logo-text" className="font-bold text-indigo-950">自社代理店名 (ヘッダー表示ロゴ):</label>
            <input
              id="agency-logo-text"
              type="text"
              value={agencyLogoText}
              onChange={(e) => setAgencyLogoText(e.target.value)}
              className="bg-white border border-indigo-200 rounded-lg px-3 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>PDF出力 / 印刷実行</span>
          </button>
        </div>

        {/* Printable Report Document View */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-900 font-sans print:p-0 print:overflow-visible">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{agencyLogoText}</div>
              <h1 className="text-xl font-black text-slate-950 tracking-tight mt-0.5">
                AI検索 (GEO/LLMO) 露出 ＆ 競合勝敗月次レポート
              </h1>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>作成日: {createdAtLabel}</div>
              <div className="font-bold text-slate-800">対象: {targetBrand} 様</div>
            </div>
          </div>

          {/* Report Overview Box */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500 font-bold">対象ドメイン</div>
              <div className="font-black text-slate-900 mt-1 truncate">{targetDomain}</div>
            </div>

            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="text-indigo-700 font-bold">自社 AI-Trust Score (ATS)</div>
              <div className="text-xl font-black text-indigo-700 mt-0.5">{atsScore} / 100 pt</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500 font-bold">ベンチマーク競合社数</div>
              <div className="font-black text-slate-900 mt-1">{competitors.length > 0 ? `${competitors.length} 社` : '3 社'}</div>
            </div>
          </div>

          {/* Benchmark Table */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-l-4 border-indigo-600 pl-2">
              1. 競合 ATS ベンチマーク分析
            </h2>
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-2.5">ブランド名</th>
                  <th className="p-2.5 text-center">総合 ATS</th>
                  <th className="p-2.5 text-center">① AI言及 (40pt)</th>
                  <th className="p-2.5 text-center">② 一次ソース (40pt)</th>
                  <th className="p-2.5 text-center">③ ファンアウト (20pt)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-indigo-50/80 font-bold text-slate-900">
                  <td className="p-2.5">{targetBrand} (自社)</td>
                  <td className="p-2.5 text-center text-indigo-700 font-black">{atsScore} pt</td>
                  <td className="p-2.5 text-center">15 pt</td>
                  <td className="p-2.5 text-center">15 pt ⚠️</td>
                  <td className="p-2.5 text-center">12 pt</td>
                </tr>
                {competitors.map((comp, idx) => (
                  <tr key={`${comp}-${idx}`} className="text-slate-700">
                    <td className="p-2.5">{comp}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">{Math.max(0, 78 - idx * 10)} pt</td>
                    <td className="p-2.5 text-center">35 pt</td>
                    <td className="p-2.5 text-center">28 pt</td>
                    <td className="p-2.5 text-center">15 pt</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Recommendations */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-l-4 border-indigo-600 pl-2">
              2. 来月度の推奨アクションプラン
            </h2>
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs space-y-2 text-amber-950">
              <div className="font-bold text-amber-900">💡 診断結果: 専門比較メディアへの露出強化が最優先</div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                AI回答の根拠として大手比較サイト（it-trend.jp, boxil.jp）が参照されています。自社ドメインの未掲載分を解消するため、掲載申請および概要テキストの「35-65文字直答化」を実行いたします。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
