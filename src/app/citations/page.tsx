"use client";

import { useState } from "react";
import { Link2, ExternalLink, TrendingUp, Sparkles, Building2, Globe } from "lucide-react";

const citationDomains = [
  { rank: 1, domain: "prtimes.jp", name: "PR TIMES", category: "プレスリリース", citationShare: 24.5, count: 48, dr: 91, strategy: "公式プレスリリース配信によるAI引用の即時獲得" },
  { rank: 2, domain: "note.com", name: "note", category: "メディア / ブログ", citationShare: 18.2, count: 35, dr: 89, strategy: "専門的知見・一次情報を含む解説記事の寄稿" },
  { rank: 3, domain: "news.mynavi.jp", name: "マイナビニュース", category: "ビジネスメディア", citationShare: 14.8, count: 29, dr: 85, strategy: "製品発表・導入事例のメディア掲載・取材獲得" },
  { rank: 4, domain: "itmedia.co.jp", name: "ITmedia", category: "IT専門メディア", citationShare: 12.1, count: 24, dr: 88, strategy: "BtoB製品レビュー・比較特集への情報提供" },
  { rank: 5, domain: "biz-hint.jp", name: "BizHint", category: "経営・DXメディア", citationShare: 9.5, count: 18, dr: 74, strategy: "経営課題解決ノウハウ・ホワイトペーパー掲載" },
  { rank: 6, domain: "boxil.jp", name: "ボクシルSaaS", category: "SaaS比較サイト", citationShare: 8.2, count: 16, dr: 82, strategy: "口コミ・レビュー獲得による比較表での引用確保" },
];

export default function CitationsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <Link2 className="w-3.5 h-3.5" />
          AI-Citation Sources
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          AI引用元メディア分析 ＆ 掲載先戦略
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          貴社の業界・テーマにおいて、AI検索エンジンが最も頻繁に情報ソースとして引用している外部メディア・ドメインのランキングです
        </p>
      </div>

      {/* Top Info Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              対象カテゴリ: BtoBマーケティング / 法人向けAI・SaaS
            </div>
            <div className="text-[11px] text-slate-500">
              全 180 件のAI回答から抽出されたユニーク引用ドメイン数: <strong className="text-slate-800 font-mono">42 ドメイン</strong>
            </div>
          </div>
        </div>

        <div className="text-xs text-right">
          <span className="text-slate-400">主要上位5ドメインで</span>
          <div className="text-base font-bold text-indigo-600">引用全体の 79.1% を占有</div>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80">
          <h2 className="text-sm font-bold text-slate-900">
            業界別 AI引用ドメイン・ランキング（Top 6）
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-6 text-center w-16">順位</th>
                <th className="py-3.5 px-4">メディア名 / ドメイン</th>
                <th className="py-3.5 px-4">カテゴリ</th>
                <th className="py-3.5 px-4 text-center">AI引用シェア</th>
                <th className="py-3.5 px-4 text-center">引用回数</th>
                <th className="py-3.5 px-6">推奨GEOアクション・出稿戦略</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {citationDomains.map((d) => (
                <tr key={d.rank} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                      d.rank === 1 ? "bg-amber-100 text-amber-800" :
                      d.rank === 2 ? "bg-slate-200 text-slate-700" :
                      d.rank === 3 ? "bg-amber-50 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {d.rank}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-900">
                    <div className="font-bold text-slate-900">{d.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{d.domain}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      {d.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="font-bold text-slate-900 text-sm">{d.citationShare}%</div>
                    <div className="w-16 bg-slate-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${d.citationShare * 3}%` }}></div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-700">
                    {d.count} 回
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    <div className="text-xs bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/60 text-indigo-950 font-medium">
                      💡 {d.strategy}
                    </div>
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
