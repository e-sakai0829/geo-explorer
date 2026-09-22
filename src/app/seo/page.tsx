"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Search,
  Download,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Globe,
  Loader2,
  Filter,
  ExternalLink,
  Target,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useProject } from "@/context/ProjectContext";
import type { KeywordGapItem, DomainSeoSummary } from "@/app/api/seo/keyword-gap/route";

const INTENT_LABEL: Record<string, { label: string; color: string }> = {
  commercial: { label: "比較検討", color: "bg-purple-50 text-purple-700 border-purple-200" },
  investigation: { label: "評判・調査", color: "bg-blue-50 text-blue-700 border-blue-200" },
  transactional: { label: "導入・購入", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  informational: { label: "ノウハウ情報", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function SeoKeywordGapPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { projectId, currentProject } = useProject();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    targetBrand: string;
    targetDomain: string;
    competitors: string[];
    summaries: DomainSeoSummary[];
    keywords: KeywordGapItem[];
    missingOpportunityVolume: number;
    dataVintage: string;
  } | null>(null);

  const [filterType, setFilterType] = useState<"all" | "missing" | "weak" | "strong">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/seo/keyword-gap?projectId=${projectId}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "データの取得に失敗しました。");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // キーワードのフィルタリング
  const filteredKeywords = useMemo(() => {
    if (!data?.keywords) return [];
    return data.keywords.filter((item) => {
      const matchFilter = filterType === "all" ? true : item.gapType === filterType;
      const matchSearch = searchQuery.trim() === ""
        ? true
        : item.keyword.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchFilter && matchSearch;
    });
  }, [data?.keywords, filterType, searchQuery]);

  // CSVダウンロード
  const handleExportCsv = () => {
    if (!data || filteredKeywords.length === 0) return;

    const headers = [
      "キーワード",
      "検索意図",
      "月間検索ボリューム",
      "SEO難易度(KD)",
      "推定CPC(円)",
      `自社順位(${data.targetBrand})`,
      ...data.competitors.map((c) => `競合順位(${c})`),
      "ギャップ判定",
      "AI検索おすすめプロンプト",
    ];

    const rows = filteredKeywords.map((item) => [
      `"${item.keyword}"`,
      `"${INTENT_LABEL[item.intent]?.label || item.intent}"`,
      item.volume,
      item.kd,
      item.cpc,
      item.targetRank ? item.targetRank : "圏外",
      ...data.competitors.map((c) => (item.competitorRanks[c] ? item.competitorRanks[c] : "圏外")),
      `"${
        item.gapType === "missing"
          ? "自社未獲得チャンス"
          : item.gapType === "weak"
          ? "競合優勢"
          : item.gapType === "strong"
          ? "自社優勢"
          : "共通上位"
      }"`,
      `"${item.suggestedPrompt}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SEO_Keyword_Gap_${data.targetBrand}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // AIスキャン画面への引き渡し
  const handleLaunchGeoScan = (suggestedPrompt: string) => {
    router.push(`/prompts?prompt=${encodeURIComponent(suggestedPrompt)}`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans antialiased text-slate-900">
      {/* 画面ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Target className="w-3.5 h-3.5" />
            SEO × AIO Integrated Intelligence
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>SEO 競合キーワードギャップ ＆ ドメイン診断</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
              New
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            自社と競合ドメインの獲得キーワードを比較・特定。競合優勢のギャップKWからワンクリックでAI検索（GEO）露出診断へ連携します。
          </p>
        </div>

        {/* CSV出力ボタン */}
        <button
          onClick={handleExportCsv}
          disabled={loading || !data}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-indigo-400" />
          <span>📥 CSVエクスポート</span>
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ローディング */}
      {loading && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs font-medium text-slate-600">ドメイン別のオーガニックキーワード ＆ 順位ギャップを分析中...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* 機会損失ハイライトバナー */}
          <div className="p-5 bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-purple-500/10 border border-amber-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  自社が圏外・競合が独占している重要キーワードの機会損失
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  競合が検索上位を獲得しているにもかかわらず、自社サイトが取りこぼしている推定検索ボリュームは合計で{" "}
                  <strong className="text-amber-700 text-sm font-black">
                    {data.missingOpportunityVolume.toLocaleString()} 回 / 月
                  </strong>{" "}
                  です。
                </p>
              </div>
            </div>
            <Link
              href="/prompts"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>AI検索での露出を調べる</span>
            </Link>
          </div>

          {/* セクション①: ドメインSEO強度 ＆ 順位分布ベンチマーク */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>ドメインSEO強度 ＆ 検索順位分布ベンチマーク</span>
              </h2>
              <span className="text-[11px] text-slate-400">
                更新日時: {new Date(data.dataVintage).toLocaleDateString("ja-JP")} (推計値)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.summaries.map((summary, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border shadow-xs space-y-4 transition-all ${
                    summary.isTarget
                      ? "bg-white border-indigo-300 ring-2 ring-indigo-500/10"
                      : "bg-slate-50/70 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{summary.name}</span>
                        {summary.isTarget && (
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                            自社
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{summary.domain}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-500 block">獲得キーワード総数</span>
                      <strong className="text-lg font-black text-slate-900">
                        {summary.totalKeywords.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">推定月間トラフィック</span>
                      <strong className="text-lg font-black text-slate-900">
                        {summary.estimatedTraffic.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* 順位分布バー */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>検索順位分布</span>
                      <span>1〜3位: {summary.rankDistribution.top3}件</span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        style={{
                          width: `${Math.max(5, (summary.rankDistribution.top3 / summary.rankDistribution.top50) * 100)}%`,
                        }}
                        className="bg-amber-400"
                        title={`1-3位: ${summary.rankDistribution.top3}件`}
                      />
                      <div
                        style={{
                          width: `${Math.max(5, ((summary.rankDistribution.top10 - summary.rankDistribution.top3) / summary.rankDistribution.top50) * 100)}%`,
                        }}
                        className="bg-emerald-500"
                        title={`4-10位: ${summary.rankDistribution.top10 - summary.rankDistribution.top3}件`}
                      />
                      <div
                        style={{
                          width: `${Math.max(5, ((summary.rankDistribution.top20 - summary.rankDistribution.top10) / summary.rankDistribution.top50) * 100)}%`,
                        }}
                        className="bg-sky-400"
                        title={`11-20位: ${summary.rankDistribution.top20 - summary.rankDistribution.top10}件`}
                      />
                      <div
                        style={{
                          width: `${Math.max(5, ((summary.rankDistribution.top50 - summary.rankDistribution.top20) / summary.rankDistribution.top50) * 100)}%`,
                        }}
                        className="bg-slate-400"
                        title={`21-50位: ${summary.rankDistribution.top50 - summary.rankDistribution.top20}件`}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>1-3位</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>4-10位</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>11-20位</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>21-50位</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* セクション②: 競合KWギャップ分析テーブル */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>キーワード別 順位ギャップ一覧</span>
                  <span className="text-xs text-slate-400 font-normal">({filteredKeywords.length}件)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  「自社未獲得チャンス」をクリックして、競合が独占している重要キーワードから優先的にGEO/AEO対策を進めましょう。
                </p>
              </div>

              {/* 検索入力 */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="キーワードで絞り込み..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* フィルタタブ */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  filterType === "all"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                すべて ({data.keywords.length})
              </button>
              <button
                onClick={() => setFilterType("missing")}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  filterType === "missing"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white text-rose-700 border-rose-200 hover:border-rose-400"
                }`}
              >
                🎯 自社未獲得チャンス ({data.keywords.filter((k) => k.gapType === "missing").length})
              </button>
              <button
                onClick={() => setFilterType("weak")}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  filterType === "weak"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"
                }`}
              >
                ⚠️ 競合優勢 ({data.keywords.filter((k) => k.gapType === "weak").length})
              </button>
              <button
                onClick={() => setFilterType("strong")}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  filterType === "strong"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400"
                }`}
              >
                🏆 自社優勢 ({data.keywords.filter((k) => k.gapType === "strong").length})
              </button>
            </div>

            {/* テーブル */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-3">キーワード / 検索意図</th>
                    <th className="py-3 px-3 text-right">月間Vol</th>
                    <th className="py-3 px-3 text-center">難易度(KD)</th>
                    <th className="py-3 px-3 text-center">自社順位</th>
                    {data.competitors.map((comp, idx) => (
                      <th key={idx} className="py-3 px-3 text-center truncate max-w-[120px]">
                        {comp}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center">ギャップ状態</th>
                    <th className="py-3 px-3 text-right">SEO ➔ AI検索 連携</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredKeywords.map((item) => (
                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.keyword}</div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border mt-0.5 ${
                            INTENT_LABEL[item.intent]?.color || "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {INTENT_LABEL[item.intent]?.label || item.intent}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        {item.volume.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            item.kd >= 50
                              ? "bg-rose-100 text-rose-800"
                              : item.kd >= 35
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.kd}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {item.targetRank ? (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-black ${
                              item.targetRank <= 3
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : item.targetRank <= 10
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            第 {item.targetRank} 位
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">圏外</span>
                        )}
                      </td>

                      {data.competitors.map((comp, idx) => {
                        const rank = item.competitorRanks[comp];
                        return (
                          <td key={idx} className="py-3 px-3 text-center">
                            {rank ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  rank <= 3
                                    ? "bg-purple-100 text-purple-900"
                                    : rank <= 10
                                    ? "bg-blue-100 text-blue-900"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {rank}位
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono text-[11px]">—</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.gapType === "missing" && (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-lg border border-rose-200 text-[10px] inline-flex items-center gap-1">
                            🎯 自社未獲得チャンス
                          </span>
                        )}
                        {item.gapType === "weak" && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200 text-[10px] inline-flex items-center gap-1">
                            ⚠️ 競合優勢
                          </span>
                        )}
                        {item.gapType === "strong" && (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[10px] inline-flex items-center gap-1">
                            🏆 自社優勢
                          </span>
                        )}
                        {item.gapType === "shared" && (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 text-[10px] inline-flex items-center gap-1">
                            共通上位
                          </span>
                        )}
                      </td>

                      {/* アクション: AI検索スキャンへ連携 */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleLaunchGeoScan(item.suggestedPrompt)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold rounded-xl transition-all text-xs flex items-center gap-1 ml-auto cursor-pointer shadow-2xs group"
                          title="このキーワードでPrompt Explorerを開き、AI言及・引用状況をリアルタイムスキャンします"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 group-hover:text-white" />
                          <span>AI言及を調べる</span>
                          <ArrowRight className="w-3 h-3 ml-0.5 opacity-60 group-hover:opacity-100" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
