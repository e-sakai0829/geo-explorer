"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Download,
  Search,
  Crown,
  Loader2,
  Home,
} from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import type { MierucaDomainSummary, MierucaKeywordItem } from "@/app/api/seo/keyword-gap/route";
import { csvCell } from "@/lib/seo-chart";

export default function MierucaCompetitorKeywordPage() {
  const { projectId } = useProject();
  return <KeywordGapContent key={projectId ?? 'none'} projectId={projectId} />;
}

function KeywordGapContent({ projectId }: { projectId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    theme: string;
    author: string;
    date: string;
    country: string;
    domains: { domain: string; name: string; color: string }[];
    summaries: MierucaDomainSummary[];
    keywords: MierucaKeywordItem[];
    totalCount: number;
    source: string;
    keywordLimitPerDomain: number;
    coverageNote: string;
    stale: boolean;
  } | null>(null);

  const requestId = useRef(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKws, setSelectedKws] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    if (!projectId) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/seo/keyword-gap?projectId=${projectId}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "データの取得に失敗しました。");
      }
      const json = await res.json();
      if (id === requestId.current) setData(json);
    } catch (err: unknown) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : "データの取得に失敗しました。");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    const guard = requestId;
    return () => { guard.current++; };
  }, []);

  // 検索フィルタリング
  const filteredKeywords = useMemo(() => {
    if (!data?.keywords) return [];
    if (!searchQuery.trim()) return data.keywords;
    const q = searchQuery.toLowerCase().trim();
    return data.keywords.filter((item) => item.keyword.toLowerCase().includes(q));
  }, [data, searchQuery]);

  // チェックボックス全選択
  const toggleSelectAll = () => {
    if (selectedKws.size === filteredKeywords.length) {
      setSelectedKws(new Set());
    } else {
      setSelectedKws(new Set(filteredKeywords.map((k) => k.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedKws((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // CSVダウンロード（推計値・未計測値を区別）
  const handleDownloadCsv = () => {
    if (!data || filteredKeywords.length === 0) return;

    const headers = [
      "キーワード",
      "月間検索数",
      "CPC (USD)",
      ...data.summaries.flatMap((s) => [
        `${s.domain}_順位`,
        `${s.domain}_流入数`,
        `${s.domain}_順位変化`,
      ]),
    ];

    const rows = filteredKeywords.map((item) => {
      const row: (string | number)[] = [
        item.keyword,
        item.volume ?? "",
        item.cpc ?? "",
      ];
      data.summaries.forEach((s) => {
        const stat = item.domainStats[s.domain];
        row.push(stat?.rank ?? "");
        row.push(stat?.traffic ?? "");
        row.push("");
      });
      return row.map(csvCell).join(",");
    });

    const metadata = [
      ['データソース', data.source],
      ['対象', data.country],
      ['取得範囲', data.coverageNote],
      ...data.summaries.map(summary => [`${summary.domain} 取得日時`, summary.fetchedAt]),
      ['順位変化', '未計測'],
    ];
    const csvContent = "\uFEFF" + [...metadata.map(items => items.map(csvCell).join(',')),
      '', headers.map(csvCell).join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `競合流入キーワード調査_${data.theme}_${data.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 font-sans text-slate-800 antialiased">
      {/* 1. パンくずナビゲーション */}
      <div className="flex items-center gap-1.5 text-xs text-sky-600 font-medium">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/dashboard" className="hover:underline">ダッシュボード</Link>
        <span className="text-slate-400">&gt;</span>
        <span className="text-slate-600">競合分析</span>
        <span className="text-slate-400">&gt;</span>
        <span className="text-slate-900 font-bold">競合流入キーワード調査</span>
      </div>

      {/* 2. メイン見出し ＆ 機能解説ボタン */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            競合流入キーワード調査
          </h1>
          <button onClick={fetchData} disabled={!projectId || loading} className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-md disabled:opacity-50">
            {loading ? '取得中…' : '競合データを取得'}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-600 -mt-3 flex items-center gap-1">
        自社と登録済み競合の推定検索流入を比較します。取得ボタンを押すと、未キャッシュのドメインでDataForSEOの有料取得が発生します。
      </p>

      {/* 3. サブコントロールバー（ミエルカ仕様） */}
      <div className="p-2 bg-slate-200/70 rounded-lg flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 shadow-2xs cursor-pointer"
            title="戻る"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadCsv}
            disabled={loading || !data}
            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 shadow-2xs cursor-pointer disabled:opacity-50"
            title="CSVダウンロード"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        <span className="px-4 py-1.5 bg-sky-500 text-white font-bold rounded text-xs">キーワードで見る</span>
      </div>

      {loading && (
        <div className="bg-white p-16 rounded-xl border border-slate-200 shadow-xs text-center space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-sky-500 mx-auto" />
          <p className="text-xs font-bold text-slate-600">競合流入キーワードおよび検索順位を読込中...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* 4. 調査メタデータ表示ブロック */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {data.theme}
            </h2>
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
              <div>比較日: <strong className="text-slate-900 font-mono">{data.date}</strong></div>
              <div>作成者: <strong className="text-slate-900">{data.author}</strong></div>
              <div>対象国: <strong className="text-slate-900">{data.country}</strong></div>
            </div>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2" role="status">
              {data.source}による推計値。{data.coverageNote} 順位変化は過去の同条件データがないため未計測です。
              {data.stale ? ' 再取得に失敗したため、以前のデータを表示しています。' : ''}
            </p>

            <div className="text-xs text-slate-600 flex items-center gap-2 pt-1 flex-wrap">
              <span className="font-semibold text-slate-500">調査ドメイン:</span>
              {data.summaries.map((s, idx) => (
                <span key={idx} className="flex items-center gap-1.5 mr-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                  <span className="font-mono text-slate-800">{s.url}</span>
                  <span className="text-slate-500">取得: {new Date(s.fetchedAt).toLocaleString('ja-JP')}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 5. 上部比較サマリー（合計流入数 ＆ 検索順位分布の2大グラフ） */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
            {/* 左側: 合計流入数（直近1カ月） */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-3 bg-sky-500 inline-block rounded-xs"></span>
                <span>推定月間オーガニック流入</span>
              </div>

              <div className="space-y-4 pt-2">
                {data.summaries.map((s, idx) => {
                  const maxTraffic = Math.max(0, ...data.summaries.map((item) => item.totalTraffic ?? 0));
                  const widthPercent = s.totalTraffic === null || maxTraffic === 0 ? 0 : Math.max(3, (s.totalTraffic / maxTraffic) * 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                        <span className="font-mono text-[11px] text-slate-700 truncate">{s.url}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-4 bg-slate-100 rounded-sm w-full max-w-[280px] overflow-hidden flex">
                          <div
                            style={{
                              width: `${widthPercent}%`,
                              backgroundColor: s.color,
                            }}
                            className="h-full rounded-sm transition-all"
                          />
                        </div>
                        <span className="font-mono font-black text-sm text-slate-900">
                          {s.totalTraffic?.toLocaleString() ?? '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 右側: 検索順位分布（直近1カ月） */}
            <div className="lg:col-span-7 space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-3 bg-sky-500 inline-block rounded-xs"></span>
                <span>オーガニック検索順位分布</span>
              </div>

              <div className="space-y-4 pt-2">
                {data.summaries.map((s, idx) => {
                  const dist = s.rankDistribution;
                  const total = s.totalKeywords ?? 0;
                  const width = (value: number | null) => total > 0 && value !== null ? `${Math.min(100, value / total * 100)}%` : '0%';

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                        <span className="font-mono text-[11px] text-slate-700 truncate">{s.url}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-4 bg-slate-100 rounded-sm flex-1 flex overflow-hidden shadow-inner">
                          <div style={{ width: width(dist.pos1_3) }} className="bg-[#0284c7]" title={`1-3位: ${dist.pos1_3 ?? '未計測'}件`} />
                          <div style={{ width: width(dist.pos4_10) }} className="bg-[#bae6fd]" title={`4-10位: ${dist.pos4_10 ?? '未計測'}件`} />
                          <div style={{ width: width(dist.pos11_20) }} className="bg-[#94a3b8]" title={`11-20位: ${dist.pos11_20 ?? '未計測'}件`} />
                          <div style={{ width: width(dist.pos21_plus) }} className="bg-[#cbd5e1]" title={`21位以下: ${dist.pos21_plus ?? '未計測'}件`} />
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-700 w-10 text-right">
                          {s.totalKeywords?.toLocaleString() ?? '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* 凡例 */}
                <div className="flex items-center gap-4 text-[11px] text-slate-600 pt-2 flex-wrap">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#0284c7] inline-block rounded-xs"></span> 1-3位</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#bae6fd] inline-block rounded-xs"></span> 4位-10位</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#94a3b8] inline-block rounded-xs"></span> 11位-20位</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#cbd5e1] inline-block rounded-xs"></span> 21位以下</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. キーワード詳細テーブル */}
          <div className="space-y-2 pt-6">
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
              <span>{filteredKeywords.length} / {data.totalCount} 件</span>
            </div>

            {/* 検索バー */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="キーワードで絞り込み"
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-sky-500 focus:outline-hidden"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">各ドメイン上位{data.keywordLimitPerDomain}件</span>
            </div>

            {/* テーブル */}
            <div className="border border-slate-300 rounded overflow-x-auto shadow-2xs bg-white">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  {/* メインヘッダー */}
                  <tr className="bg-[#1e293b] text-white font-bold divide-x divide-slate-700 text-[11px]">
                    <th className="py-2.5 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={selectedKws.size > 0 && selectedKws.size === filteredKeywords.length}
                        onChange={toggleSelectAll}
                        className="rounded cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 min-w-[180px]">
                      キーワード
                    </th>
                    <th className="py-2.5 px-3 text-right min-w-[90px]">
                      月間検索数
                    </th>
                    <th className="py-2.5 px-3 text-right min-w-[70px]">
                      CPC (USD)
                    </th>

                    {/* 各ドメインのサブ列ヘッダー */}
                    {data.summaries.map((s, idx) => (
                      <th key={idx} className="py-2 px-3 text-center min-w-[210px] bg-slate-800">
                        <div className="flex items-center justify-center gap-1.5 truncate pb-1 border-b border-slate-700">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }}></span>
                          <span className="font-mono text-[10px] truncate max-w-[180px]">{s.domain}</span>
                        </div>
                        <div className="grid grid-cols-3 text-[10px] text-slate-300 pt-1 font-normal">
                          <span className="text-center">順位</span>
                          <span className="text-center">推定流入</span>
                          <span className="text-center">変化</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {filteredKeywords.map((item, rowIdx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-sky-50/40 transition-colors ${
                        rowIdx % 2 === 1 ? "bg-slate-50/50" : "bg-white"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedKws.has(item.id)}
                          onChange={() => toggleSelectOne(item.id)}
                          className="rounded cursor-pointer"
                        />
                      </td>

                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {item.keyword}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {item.volume?.toLocaleString() ?? '—'}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {item.cpc === null ? '—' : `$${item.cpc.toFixed(2)}`}
                      </td>

                      {/* 各ドメインの3指標（順位 / 流入数 / 変化） */}
                      {data.summaries.map((s, sIdx) => {
                        const stat = item.domainStats[s.domain];
                        const rank = stat?.rank;
                        const traffic = stat?.traffic;

                        return (
                          <td key={sIdx} className="py-2.5 px-3 border-l border-slate-200">
                            <div className="grid grid-cols-3 items-center text-center text-xs">
                              {/* 順位 */}
                              <div className="font-mono flex items-center justify-center gap-1">
                                {rank ? (
                                  <>
                                    <span className="font-bold">{rank}</span>
                                    {rank <= 30 && (
                                      <Crown className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
                                    )}
                                  </>
                                ) : (
                                  <span className="text-slate-400 font-normal">-</span>
                                )}
                              </div>

                              {/* 流入数 */}
                              <div className="font-mono text-slate-700">
                                {traffic !== null && traffic !== undefined && traffic > 0 ? (
                                  traffic.toLocaleString()
                                ) : (
                                  <span className="text-slate-400 font-normal">{traffic === 0 ? "0" : "-"}</span>
                                )}
                              </div>

                              {/* 変化 */}
                              <div className="font-mono text-[11px] flex items-center justify-center gap-0.5">
                                <span className="text-slate-400 font-normal">—</span>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* フッター著作表記（ミエルカスタイル） */}
            <div className="text-center text-[11px] text-slate-400 pt-8 space-y-1">
              <div className="space-x-3">
                <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
                <span>-</span>
                <Link href="/terms" className="hover:underline">利用規約</Link>
                <span>-</span>
                <Link href="/settings" className="hover:underline">利用環境</Link>
              </div>
              <p>© 2026 GEO Explorer SEO Intelligence. All Rights Reserved.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
