"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, Search, Download, ExternalLink, FileText, BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Zap, Database } from "lucide-react";

import type { SiteExplorerResult, FormattedKeyword as OrganicKeyword, FormattedTopPage as TopPage, FormattedMonthlyData as MonthlyHistoryPoint } from "@/lib/dataforseo";
import { calculateNiceScale, csvCell, displayMetric } from "@/lib/seo-chart";
type SummaryData = SiteExplorerResult['summary'];
const DEFAULT_SUMMARY: SummaryData = { dr: null, ur: null, backlinks: null, refDomains: null, dofollowPercent: null, organicKeywords: null, organicTraffic: null, trafficValue: null, pos1_3Count: null, pos4_10Count: null, pos11_20Count: null, pos21_50Count: null };
const DEFAULT_HISTORY: MonthlyHistoryPoint[] = [];
const DEFAULT_KEYWORDS: OrganicKeyword[] = [];
const DEFAULT_TOP_PAGES: TopPage[] = [];

function SiteExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get("tab") || "overview";

  const activeTab = activeTabParam === "keywords" || activeTabParam === "pages" ? activeTabParam : "overview";
  const [targetDomain, setTargetDomain] = useState<string>("www.daiwa-logi.co.jp");
  const [protocol, setProtocol] = useState<string>("http + https");
  const [matchScope, setMatchScope] = useState<string>("subdomain");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [resultDomain, setResultDomain] = useState('未取得');
  const [notice, setNotice] = useState('ドメインを入力して解析を実行してください。');
  const request = useRef<{ id: number; controller?: AbortController }>({ id: 0 });
  useEffect(() => () => { request.current.id++; request.current.controller?.abort(); }, []);
  const [lastFetchedAt, setLastFetchedAt] = useState<string>("未取得");

  // 実データ状態管理
  const [summary, setSummary] = useState<SummaryData>(DEFAULT_SUMMARY);
  const [historyData, setHistoryData] = useState<MonthlyHistoryPoint[]>(DEFAULT_HISTORY);
  const [keywords, setKeywords] = useState<OrganicKeyword[]>(DEFAULT_KEYWORDS);
  const [topPages, setTopPages] = useState<TopPage[]>(DEFAULT_TOP_PAGES);

  // チャート・インタラクティブ用状態 (初期値: 最新月 2026年9月)
  const [hoveredTrafficIndex, setHoveredTrafficIndex] = useState<number | null>(DEFAULT_HISTORY.length - 1);
  const [hoveredPosIndex, setHoveredPosIndex] = useState<number | null>(DEFAULT_HISTORY.length - 1);
  const [activePositions, setActivePositions] = useState({
    pos1_3: true,
    pos4_10: true,
    pos11_20: true,
    pos21_50: false,
    pos51_plus: false
  });

  const trafficChartRef = useRef<HTMLDivElement>(null);
  const posChartRef = useRef<HTMLDivElement>(null);

  // フィルター
  const [kwSearch, setKwSearch] = useState<string>("");
  const [kwPosFilter, setKwPosFilter] = useState<string>("all");
  const [kwIntentFilter, setKwIntentFilter] = useState<string>("all");

  const handleTabChange = (tab: "overview" | "keywords" | "pages") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push('/seo/site-explorer?' + params.toString(), { scroll: false });
  };

  const executeAnalysis = async (domain: string) => {
    request.current.controller?.abort();
    const id = ++request.current.id;
    const controller = new AbortController();
    request.current.controller = controller;
    setIsAnalyzing(true);
    setSummary(DEFAULT_SUMMARY); setHistoryData([]); setKeywords([]); setTopPages([]);
    setHoveredTrafficIndex(null); setHoveredPosIndex(null);
    setResultDomain('取得中'); setLastFetchedAt('未取得'); setIsCached(false); setNotice('');
    try {
      const res = await fetch('/api/seo/site-explorer?domain=' + encodeURIComponent(domain), { signal: controller.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'データを取得できませんでした。');
      if (id !== request.current.id) return;
      if (data.schemaVersion !== 2 || !data.summary || !Array.isArray(data.history) || !Array.isArray(data.keywords) || !Array.isArray(data.topPages)) throw new Error('応答形式を確認できませんでした。');
      setSummary(data.summary); setHistoryData(data.history); setKeywords(data.keywords); setTopPages(data.topPages);
      setResultDomain(data.domain); setIsCached(!!data.cached);
      setLastFetchedAt(new Date(data.fetchedAt).toLocaleString('ja-JP'));
      setNotice([...(data.warnings || []), data.history.length ? '' : '履歴データは未取得です。'].filter(Boolean).join(' '));
    } catch (error) {
      if (id === request.current.id && !controller.signal.aborted) {
        setResultDomain('未取得'); setNotice(error instanceof Error ? error.message : 'データを取得できませんでした。');
      }
    } finally { if (id === request.current.id) setIsAnalyzing(false); }
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    executeAnalysis(targetDomain);
  };

  const handleForceRefresh = () => {
    executeAnalysis(targetDomain);
  };

  // チャートマウスイベント処理 (プロット領域幅に対応)
  const chartWidth = 740;
  const rightAxisWidth = 60;
  const svgTotalWidth = chartWidth + rightAxisWidth; // 800

  const handleTrafficMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trafficChartRef.current || historyData.length === 0) return;
    const rect = trafficChartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const plotWidth = rect.width * (chartWidth / svgTotalWidth);
    const total = historyData.length;
    const pointWidth = plotWidth / Math.max(1, total - 1);
    const index = total === 1 ? 0 : Math.max(0, Math.min(total - 1, Math.round(x / Math.max(1, pointWidth))));
    if (index >= 0 && index < total) {
      setHoveredTrafficIndex(index);
    }
  };

  const handlePosMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!posChartRef.current || historyData.length === 0) return;
    const rect = posChartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const plotWidth = rect.width * (chartWidth / svgTotalWidth);
    const total = historyData.length;
    const pointWidth = plotWidth / Math.max(1, total - 1);
    const index = total === 1 ? 0 : Math.max(0, Math.min(total - 1, Math.round(x / Math.max(1, pointWidth))));
    if (index >= 0 && index < total) {
      setHoveredPosIndex(index);
    }
  };

  // キーワード絞り込み
  const filteredKeywords = useMemo(() => {
    return keywords.filter((item) => {
      if (kwSearch && !item.keyword.toLowerCase().includes(kwSearch.toLowerCase()) && !item.url.includes(kwSearch)) {
        return false;
      }
      if (kwPosFilter === "top3" && (item.position < 1 || item.position > 3)) return false;
      if (kwPosFilter === "top10" && (item.position < 4 || item.position > 10)) return false;
      if (kwPosFilter === "top20" && (item.position < 11 || item.position > 20)) return false;
      if (kwPosFilter === "21plus" && item.position < 21) return false;
      if (kwIntentFilter !== "all" && item.intent !== kwIntentFilter) return false;
      return true;
    });
  }, [keywords, kwSearch, kwPosFilter, kwIntentFilter]);

  // CSVダウンロード機能
  const downloadCsv = (type: "keywords" | "pages") => {
    const filename = resultDomain + '_' + type + '.csv';
    const fields = type === 'keywords'
      ? ['キーワード', '検索意図', '順位', '前回順位', '月間ボリューム', 'KD', '推定流入', 'URL']
      : ['URL', '流入トラフィック（取得KW内）', 'シェア%', '推定価値', '取得KW数', 'トップKW', '順位'];
    const headers = fields.map(csvCell).join(',') + '\n';
    const values = type === 'keywords'
      ? filteredKeywords.map(k => [k.keyword, k.intentLabel, k.position, k.prevPosition, k.volume, k.kd, k.traffic, k.url])
      : topPages.map(p => [p.url, p.traffic, p.trafficShare, p.trafficValue, p.keywordsCount, p.topKeyword, p.topKeywordPos]);
    const rows = values.map(row => row.map(csvCell).join(','));
    const bom = "\uFEFF";
    const blob = new Blob([bom + headers + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // --- 動的Y軸スケール計算 (Ahrefs完全準拠のNice Scale) ---
  const trafficChartHeight = 200;
  const rawMaxTraffic = Math.max(...historyData.map(d => d.traffic), 0);
  const trafficScale = calculateNiceScale(rawMaxTraffic, 4);
  const maxTraffic = trafficScale.max;

  const totalPoints = historyData.length || 1;
  const stepX = chartWidth / Math.max(1, totalPoints - 1);

  // 4等分の動的目盛り (SVG高さ200pxに対応)
  const trafficTicks = trafficScale.ticks.map(t => ({
    y: (t.yPercent / 100) * trafficChartHeight,
    label: t.label
  }));

  const trafficPoints = historyData.map((d, i) => {
    const x = totalPoints === 1 ? chartWidth / 2 : i * stepX;
    const y = trafficChartHeight - (d.traffic / maxTraffic) * trafficChartHeight;
    return { x, y, data: d };
  });

  const trafficPathD = trafficPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const trafficAreaD = trafficPoints.length ? `${trafficPathD} L ${trafficPoints.at(-1)!.x} ${trafficChartHeight} L ${trafficPoints[0].x} ${trafficChartHeight} Z` : "";

  // ポジションスタック面グラフ (動的Nice Scale)
  const posChartHeight = 160;
  const rawMaxPos = Math.max(...historyData.map(d => d.pos1_3 + d.pos4_10 + d.pos11_20), 0);
  const posScale = calculateNiceScale(rawMaxPos, 4);
  const maxPos = posScale.max;

  const posTicks = posScale.ticks.map(t => ({
    y: (t.yPercent / 100) * posChartHeight,
    label: t.label
  }));

  const posPoints = historyData.map((d, i) => {
    const x = totalPoints === 1 ? chartWidth / 2 : i * stepX;
    const v1_3 = activePositions.pos1_3 ? d.pos1_3 : 0;
    const v4_10 = activePositions.pos4_10 ? d.pos4_10 : 0;
    const v11_20 = activePositions.pos11_20 ? d.pos11_20 : 0;

    const yBase = posChartHeight;
    const y1_3 = posChartHeight - (v1_3 / maxPos) * posChartHeight;
    const y4_10 = posChartHeight - ((v1_3 + v4_10) / maxPos) * posChartHeight;
    const y11_20 = posChartHeight - ((v1_3 + v4_10 + v11_20) / maxPos) * posChartHeight;

    return { x, yBase, y1_3, y4_10, y11_20, data: d };
  });

  const posArea11_20_D = !posPoints.length ? "" : posPoints.reduce((acc, pt, i) => `${i === 0 ? "M" : acc + " L"} ${pt.x} ${pt.y11_20}`, "")
    + ` L ${posPoints.at(-1)!.x} ${posChartHeight} L ${posPoints[0].x} ${posChartHeight} Z`;

  const posArea4_10_D = !posPoints.length ? "" : posPoints.reduce((acc, pt, i) => `${i === 0 ? "M" : acc + " L"} ${pt.x} ${pt.y4_10}`, "")
    + ` L ${posPoints.at(-1)!.x} ${posChartHeight} L ${posPoints[0].x} ${posChartHeight} Z`;

  const posArea1_3_D = !posPoints.length ? "" : posPoints.reduce((acc, pt, i) => `${i === 0 ? "M" : acc + " L"} ${pt.x} ${pt.y1_3}`, "")
    + ` L ${posPoints.at(-1)!.x} ${posChartHeight} L ${posPoints[0].x} ${posChartHeight} Z`;

  const posLine11_20_D = posPoints.reduce((acc, pt, i) => `${i === 0 ? "M" : acc + " L"} ${pt.x} ${pt.y11_20}`, "");
  const posLine4_10_D = posPoints.reduce((acc, pt, i) => `${i === 0 ? "M" : acc + " L"} ${pt.x} ${pt.y4_10}`, "");
  const posLine1_3_D = posPoints.reduce((acc, pt, i) => `${i === 0 ? "M" : acc + " L"} ${pt.x} ${pt.y1_3}`, "");

  return (
    <div className="min-h-screen w-[calc(100vw-20rem)] min-w-0 bg-slate-50 font-sans pb-20">
      {/* 1. 上部コントロールバー (Ahrefs Site Explorer ヘッダー) */}
      <div className="bg-slate-900 text-white border-b border-slate-800 sticky top-14 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center bg-slate-800/90 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
              <span className="font-semibold text-slate-200">サイトエクスプローラー</span>
              <span className="mx-2 text-slate-600">|</span>
              <select disabled title="現在はhttp・https両方が対象です"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="http + https" className="bg-slate-800">http + https</option>
                <option value="https only" className="bg-slate-800">https only</option>
              </select>
            </div>

            {/* ドメイン入力フィールド */}
            <div className="flex-1 flex items-center bg-white rounded-lg border border-slate-300 overflow-hidden shadow-inner">
              <div className="pl-3 pr-1 text-slate-400">
                <Globe className="w-4 h-4 text-indigo-600" />
              </div>
              <input
                type="text"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                placeholder="自社または競合のドメインを入力 (例: mercari.com, yahoo.co.jp)"
                className="w-full px-2 py-2 text-sm text-slate-900 font-medium focus:outline-none"
              />
              <select disabled title="現在はサブドメインを含むドメイン集計です"
                value={matchScope}
                onChange={(e) => setMatchScope(e.target.value)}
                className="bg-slate-100 text-xs font-semibold text-slate-700 px-3 py-2 border-l border-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="subdomain">サブドメイン</option>
                <option value="domain">ドメイン全体</option>
                <option value="exact">完全一致 URL</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
              <span>{isAnalyzing ? "分析実行中..." : "検索・分析"}</span>
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* 2. 主要KPIサマリーカード群 (Ahrefs完全再現) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base shadow-xs">
                {resultDomain.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-slate-900 tracking-tight">{resultDomain}</h1>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                    <Database className="w-3 h-3 text-emerald-600" />
                    DataForSEO データ
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>同期日時: {lastFetchedAt}</span>
                  <span>•</span>
                  <span className="text-indigo-600 font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-500" />
                    {isCached ? "キャッシュ表示" : (lastFetchedAt === "未取得" ? "未取得" : "API取得データ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleForceRefresh}
                disabled={isAnalyzing}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                title="7日間のキャッシュを確認し、有効なデータがない場合に再取得します"
              >
                <RefreshCw className={`w-3 h-3 ${isAnalyzing ? "animate-spin text-indigo-600" : ""}`} />
                <span>データを再確認</span>
              </button>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md font-semibold text-slate-700">月間ボリューム (日本 / JP)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* DR */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>DataForSEO Rank</span>

              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">{displayMetric(summary.dr)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">DataForSEO Rank（0〜1000）</div>
            </div>

            {/* UR */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">UR (URL強さ)</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{displayMetric(summary.ur)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">このAPIでは未取得</div>
            </div>

            {/* 被リンク数 */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>被リンク数</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> 取得値
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {displayMetric(summary.backlinks)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">プロバイダー取得値</div>
            </div>

            {/* 参照ドメイン */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">参照ドメイン</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{displayMetric(summary.refDomains)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">DoFollow: {displayMetric(summary.dofollowPercent)}%</div>
            </div>

            {/* オーガニックKW */}
            <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100">
              <div className="text-[11px] font-semibold text-indigo-900 flex items-center justify-between">
                <span>オーガニックKW</span>

              </div>
              <div className="text-2xl font-black text-indigo-900 mt-1">{displayMetric(summary.organicKeywords)}</div>
              <div className="text-[10px] text-indigo-600 font-medium mt-0.5">上位3位: {displayMetric(summary.pos1_3Count)}件</div>
            </div>

            {/* オーガニックトラフィック */}
            <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100">
              <div className="text-[11px] font-semibold text-indigo-900 flex items-center justify-between">
                <span>月間トラフィック</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> 推定
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-900 mt-1">
                {displayMetric(summary.organicTraffic)}
              </div>
              <div className="text-[10px] text-indigo-600 font-medium mt-0.5">{displayMetric(summary.organicTraffic)} 推定検索流入</div>
            </div>

            {/* トラフィック価値 */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>推定広告価値</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> 換算
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">${displayMetric(summary.trafficValue)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">月間CPC換算</div>
            </div>
          </div>
        </div>

        <p role="status" className="text-sm text-amber-800">{notice}</p>
        <p className="text-xs text-slate-500">表示対象: {resultDomain} ・ キーワード上位100件まで / 推定流入 ・ 未取得値は「—」</p>
        {/* 3. タブナビゲーション */}
        <div className="flex flex-wrap border-b border-slate-200 gap-2">
          <button
            onClick={() => handleTabChange("overview")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>概要 (Overview)</span>
          </button>

          <button
            onClick={() => handleTabChange("keywords")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "keywords"
                ? "border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>オーガニックキーワード</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-mono">
              {keywords.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("pages")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "pages"
                ? "border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>上位ページ (Top Pages)</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-mono">
              {topPages.length}
            </span>
          </button>
        </div>

        {/* 4. タブ内容 */}

        {/* ===== [TAB 1: 概要] ===== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左側2カラム: パフォーマンス推移グラフ ＆ 順位帯推移 */}
              <div className="lg:col-span-2 space-y-6">

                {/* 1. パフォーマンス (オーガニックトラフィック推移) */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold text-slate-900 text-sm mr-2">パフォーマンス</span>
                      <button disabled title="未対応" className="px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors">指標</button>
                      <button disabled title="未対応" className="px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors flex items-center gap-1">競合 ▾</button>
                      <button disabled title="未対応" className="px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors flex items-center gap-1">ロケーション ▾</button>
                      <button disabled title="未対応" className="px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors">年数</button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-semibold cursor-pointer">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>過去 2 年間 ▾</span>
                      </div>
                      <div className="bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-semibold cursor-pointer">
                        <span>毎月 ▾</span>
                      </div>
                    </div>
                  </div>

                  {/* チェックボックス項目バー */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-600 mb-4 pb-2 border-b border-slate-50">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" className="rounded text-slate-400" disabled />
                      <span>参照ドメイン</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" className="rounded text-slate-400" disabled />
                      <span>平均ドメイン評価</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" className="rounded text-slate-400" disabled />
                      <span>平均 URL 評価</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer font-bold text-amber-600">
                      <input type="checkbox" checked readOnly className="rounded text-amber-500 focus:ring-amber-400" />
                      <span>平均オーガニックトラフィック</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" className="rounded text-slate-400" disabled />
                      <span>平均オーガニックトラフィック値</span>
                    </label>
                  </div>

                  {/* グラフヘッダー凡例 */}
                  <div className="flex justify-end text-xs font-bold text-amber-600 mb-1">
                    <span>平均オーガニックトラフィック</span>
                  </div>

                  {/* インタラクティブSVGグラフエリア (動的Niceスケール＆SVG内完全同期) */}
                  <div
                    ref={trafficChartRef}
                    onMouseMove={handleTrafficMouseMove}
                    onMouseLeave={() => setHoveredTrafficIndex(null)}
                    className="h-56 w-full relative cursor-crosshair select-none pt-2"
                  >
                    <div className="h-44 w-full relative">
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox={`0 0 ${svgTotalWidth} ${trafficChartHeight}`}
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="trafficGradientAhrefsDynamic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>

                        {/* 水平グリッドライン ＆ 右側完全一致目盛りテキスト */}
                        {trafficTicks.map((tick, idx) => (
                          <g key={idx}>
                            <line
                              x1={0}
                              y1={tick.y}
                              x2={chartWidth}
                              y2={tick.y}
                              stroke={tick.y === 200 ? "#e2e8f0" : "#f1f5f9"}
                              strokeDasharray={tick.y === 200 ? "none" : "3 3"}
                            />
                            <text
                              x={chartWidth + 12}
                              y={tick.y} dominantBaseline="middle"
                              fill="#d97706"
                              fontSize="11"
                              fontFamily="monospace"
                              fontWeight="600"
                              textAnchor="start"
                            >
                              {tick.label}
                            </text>
                          </g>
                        ))}

                        {/* 面グラデーション */}
                        <path d={trafficAreaD} fill="url(#trafficGradientAhrefsDynamic)" />

                        {/* 折れ線 */}
                        <path d={trafficPathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

                        {/* ホバー時のガイドライン ＆ ポイント */}
                        {hoveredTrafficIndex !== null && trafficPoints[hoveredTrafficIndex] && (
                          <g>
                            <line
                              x1={trafficPoints[hoveredTrafficIndex].x}
                              y1={0}
                              x2={trafficPoints[hoveredTrafficIndex].x}
                              y2={trafficChartHeight}
                              stroke="#cbd5e1"
                              strokeWidth="1.5"
                              strokeDasharray="4 3"
                            />
                            <circle
                              cx={trafficPoints[hoveredTrafficIndex].x}
                              cy={trafficPoints[hoveredTrafficIndex].y}
                              r="5"
                              fill="#f59e0b"
                              stroke="#ffffff"
                              strokeWidth="2.5"
                              className="filter drop-shadow-xs"
                            />
                          </g>
                        )}
                      </svg>

                      {/* ホバー時のツールチップ */}
                      {hoveredTrafficIndex !== null && trafficPoints[hoveredTrafficIndex] && (
                        <div
                          className="absolute break-words bg-white rounded-lg shadow-xl border border-slate-200 p-3 pointer-events-none z-30 transition-all duration-75 w-[210px] max-w-[calc(100%-16px)]"
                          style={{
                            left: `max(8px, min(calc(100% - 228px), calc(${trafficPoints[hoveredTrafficIndex].x / svgTotalWidth * 100}% - 110px)))`,
                            top: `max(8px, min(calc(100% - 84px), calc(${trafficPoints[hoveredTrafficIndex].y / trafficChartHeight * 100}% - 72px)))`
                          }}
                        >
                          <div className="text-xs font-bold text-slate-800 pb-1.5 mb-1.5 border-b border-slate-100">
                            {historyData[hoveredTrafficIndex]?.month}
                          </div>
                          <div className="flex items-center justify-between text-xs gap-3">
                            <span className="text-slate-500 font-medium">平均オーガニックトラフィック</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {historyData[hoveredTrafficIndex]?.traffic.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* X軸タイムライン目盛り */}
                    <div className="relative w-full pr-12 mt-1.5 pt-2 border-t border-slate-200">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        {historyData.map((d, i) => {
                          if (d.shortLabel && (i % Math.max(1, Math.ceil(historyData.length / 5)) === 0 || i === historyData.length - 1)) {
                            return (
                              <div key={i} className="flex flex-col items-center">
                                {d.hasGoogleUpdate && (
                                  <div className="w-4 h-4 rounded-full border border-slate-300 bg-white text-[9px] font-bold text-slate-500 flex items-center justify-center mb-1 shadow-2xs">
                                    {d.updateBadge}
                                  </div>
                                )}
                                <span>{d.shortLabel}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. オーガニックポジション推移 (スタック面グラフ) */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm">オーガニックポジション ▾</span>
                    </div>

                    {/* 順位帯フィルターチェックボックス */}
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activePositions.pos1_3}
                          onChange={(e) => setActivePositions({ ...activePositions, pos1_3: e.target.checked })}
                          className="rounded text-amber-700 focus:ring-amber-600"
                        />
                        <span className="font-bold text-amber-900 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-xs bg-[#b45309]"></span>
                          1-3
                        </span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activePositions.pos4_10}
                          onChange={(e) => setActivePositions({ ...activePositions, pos4_10: e.target.checked })}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-bold text-amber-800 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-xs bg-[#ea580c]"></span>
                          4-10
                        </span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activePositions.pos11_20}
                          onChange={(e) => setActivePositions({ ...activePositions, pos11_20: e.target.checked })}
                          className="rounded text-amber-400 focus:ring-amber-400"
                        />
                        <span className="font-bold text-amber-700 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-xs bg-[#f59e0b]"></span>
                          11-20
                        </span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-400">
                        <input
                          type="checkbox"
                          disabled checked={false}
                          onChange={(e) => setActivePositions({ ...activePositions, pos21_50: e.target.checked })}
                          className="rounded text-slate-300"
                        />
                        <span>21-50</span>
                      </label>
                    </div>
                  </div>

                  {/* インタラクティブSVGスタック面グラフ */}
                  <div
                    ref={posChartRef}
                    onMouseMove={handlePosMouseMove}
                    onMouseLeave={() => setHoveredPosIndex(null)}
                    className="h-52 w-full relative cursor-crosshair select-none pt-2"
                  >
                    <div className="h-40 w-full relative">
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox={`0 0 ${svgTotalWidth} ${posChartHeight}`}
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="posGradient11_20LiveExact" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
                          </linearGradient>
                          <linearGradient id="posGradient4_10LiveExact" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.55" />
                            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.2" />
                          </linearGradient>
                          <linearGradient id="posGradient1_3LiveExact" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#b45309" stopOpacity="0.65" />
                            <stop offset="100%" stopColor="#b45309" stopOpacity="0.3" />
                          </linearGradient>
                        </defs>

                        {/* 水平グリッドライン ＆ 右側目盛りテキスト */}
                        {posTicks.map((tick, idx) => (
                          <g key={idx}>
                            <line
                              x1={0}
                              y1={tick.y}
                              x2={chartWidth}
                              y2={tick.y}
                              stroke={tick.y === 160 ? "#e2e8f0" : "#f1f5f9"}
                              strokeDasharray={tick.y === 160 ? "none" : "3 3"}
                            />
                            <text
                              x={chartWidth + 12}
                              y={tick.y} dominantBaseline="middle"
                              fill="#94a3b8"
                              fontSize="11"
                              fontFamily="monospace"
                              fontWeight="600"
                              textAnchor="start"
                            >
                              {tick.label}
                            </text>
                          </g>
                        ))}

                        {/* 各順位帯のスタック面 */}
                        {activePositions.pos11_20 && (
                          <path d={posArea11_20_D} fill="url(#posGradient11_20LiveExact)" />
                        )}
                        {activePositions.pos4_10 && (
                          <path d={posArea4_10_D} fill="url(#posGradient4_10LiveExact)" />
                        )}
                        {activePositions.pos1_3 && (
                          <path d={posArea1_3_D} fill="url(#posGradient1_3LiveExact)" />
                        )}

                        {/* 折れ線境界 */}
                        {activePositions.pos11_20 && (
                          <path d={posLine11_20_D} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />
                        )}
                        {activePositions.pos4_10 && (
                          <path d={posLine4_10_D} fill="none" stroke="#ea580c" strokeWidth="1.5" strokeLinejoin="round" />
                        )}
                        {activePositions.pos1_3 && (
                          <path d={posLine1_3_D} fill="none" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round" />
                        )}

                        {/* ホバー時のガイドライン ＆ サークル */}
                        {hoveredPosIndex !== null && posPoints[hoveredPosIndex] && (
                          <g>
                            <line
                              x1={posPoints[hoveredPosIndex].x}
                              y1={0}
                              x2={posPoints[hoveredPosIndex].x}
                              y2={posChartHeight}
                              stroke="#cbd5e1"
                              strokeWidth="1.5"
                              strokeDasharray="4 3"
                            />
                            {activePositions.pos11_20 && (
                              <circle cx={posPoints[hoveredPosIndex].x} cy={posPoints[hoveredPosIndex].y11_20} r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                            )}
                            {activePositions.pos4_10 && (
                              <circle cx={posPoints[hoveredPosIndex].x} cy={posPoints[hoveredPosIndex].y4_10} r="4" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
                            )}
                            {activePositions.pos1_3 && (
                              <circle cx={posPoints[hoveredPosIndex].x} cy={posPoints[hoveredPosIndex].y1_3} r="4" fill="#b45309" stroke="#ffffff" strokeWidth="2" />
                            )}
                          </g>
                        )}
                      </svg>

                      {/* ホバー時のツールチップ */}
                      {hoveredPosIndex !== null && posPoints[hoveredPosIndex] && (
                        <div
                          className="absolute break-words bg-white rounded-lg shadow-xl border border-slate-200 p-3 pointer-events-none z-30 transition-all duration-75 min-w-[190px]"
                          style={{
                            left: `max(8px, min(calc(100% - 228px), calc(${posPoints[hoveredPosIndex].x / svgTotalWidth * 100}% - 110px)))`,
                            top: `max(8px, min(calc(100% - 128px), calc(${posPoints[hoveredPosIndex].y11_20 / posChartHeight * 100}% - 116px)))`
                          }}
                        >
                          <div className="text-xs font-bold text-slate-800 pb-1.5 mb-1.5 border-b border-slate-100">
                            {historyData[hoveredPosIndex]?.month}
                          </div>

                          <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-1.5 mb-1 border-b border-slate-100">
                            <span>すべての順位</span>
                            <span className="font-mono text-slate-900">
                              {(historyData[hoveredPosIndex]?.pos1_3 + historyData[hoveredPosIndex]?.pos4_10 + historyData[hoveredPosIndex]?.pos11_20)}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                                <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
                                11-20
                              </span>
                              <span className="font-mono font-bold text-slate-800">
                                {historyData[hoveredPosIndex]?.pos11_20}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                                <span className="w-2 h-2 rounded-full bg-[#ea580c]"></span>
                                4-10
                              </span>
                              <span className="font-mono font-bold text-slate-800">
                                {historyData[hoveredPosIndex]?.pos4_10}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                                <span className="w-2 h-2 rounded-full bg-[#b45309]"></span>
                                1-3
                              </span>
                              <span className="font-mono font-bold text-slate-800">
                                {historyData[hoveredPosIndex]?.pos1_3}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* X軸タイムライン目盛り */}
                    <div className="relative w-full pr-12 mt-1.5 pt-2 border-t border-slate-200">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        {historyData.map((d, i) => {
                          if (d.shortLabel && (i % Math.max(1, Math.ceil(historyData.length / 5)) === 0 || i === historyData.length - 1)) {
                            return (
                              <div key={i} className="flex flex-col items-center">
                                {d.hasGoogleUpdate && (
                                  <div className="w-4 h-4 rounded-full border border-slate-300 bg-white text-[9px] font-bold text-slate-500 flex items-center justify-center mb-1 shadow-2xs">
                                    {d.updateBadge}
                                  </div>
                                )}
                                <span>{d.shortLabel}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="bg-white rounded-xl border border-slate-200 p-5 text-sm text-slate-600 space-y-3 self-start">
                <h3 className="font-bold text-slate-900">集計範囲</h3>
                <p>Google 日本・日本語。ドメインと配下のサブドメインが対象です。</p>
                <p>トラフィックはDataForSEOの推定検索流入で、実測PVではありません。</p>
                <p>キーワードは推定流入上位100件まで。上位ページの流入・シェアは取得キーワード内の集計です。</p>
                <p>DR・UR互換値、国別内訳、Googleアップデート（未連携）情報は未取得です。</p>
                <p>取得KWの検索意図: {['I', 'C', 'N', 'T', '?'].map(intent => intent + ': ' + keywords.filter(k => k.intent === intent).length).join(' / ')}</p>
              </aside>
            </div>
          </div>
        )}

        {/* ===== [TAB 2: オーガニックキーワード] ===== */}
        {activeTab === "keywords" && (
          <div className="space-y-4">
            {/* フィルター ＆ アクションバー */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* 検索窓 */}
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={kwSearch}
                    onChange={(e) => setKwSearch(e.target.value)}
                    placeholder="キーワードまたはURLで絞り込み..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* 順位帯フィルター */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500 font-medium">順位:</span>
                  <select
                    value={kwPosFilter}
                    onChange={(e) => setKwPosFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="all">すべて (1-100位)</option>
                    <option value="top3">1 - 3位</option>
                    <option value="top10">4 - 10位</option>
                    <option value="top20">11 - 20位</option>
                    <option value="21plus">21位以下</option>
                  </select>
                </div>

                {/* 検索意図フィルター */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500 font-medium">意図:</span>
                  <select
                    value={kwIntentFilter}
                    onChange={(e) => setKwIntentFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="all">すべての意図</option>
                    <option value="I">I (Informational)</option>
                    <option value="C">C (Commercial)</option>
                    <option value="N">N (Navigational)</option>
                    <option value="T">T (Transactional)</option>
                  </select>
                </div>

                <div className="text-xs text-slate-400 pl-2">
                  <span>表示中: </span>
                  <strong className="text-slate-800 font-mono">{filteredKeywords.length}</strong>
                  <span> / {keywords.length} 件</span>
                </div>
              </div>

              {/* CSVエクスポートボタン */}
              <button
                onClick={() => downloadCsv("keywords")}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSVエクスポート</span>
              </button>
            </div>

            {/* キーワードテーブル (Ahrefs完全再現) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-3 px-4 w-64">キーワード</th>
                      <th className="py-3 px-3 text-center w-16">意図</th>
                      <th className="py-3 px-3 text-center w-24">順位</th>
                      <th className="py-3 px-3 text-right w-24">ボリューム</th>
                      <th className="py-3 px-3 text-center w-20">難易度 (KD)</th>
                      <th className="py-3 px-3 text-right w-24">推定流入</th>
                      <th className="py-3 px-4">獲得URL</th>
                      <th className="py-3 px-3 text-center w-24">アクション</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredKeywords.map((item) => {
                      const diff = item.prevPosition === null ? null : item.prevPosition - item.position;
                      return (
                        <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {item.keyword}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              title={item.intentLabel}
                              className={`inline-flex items-center justify-center w-5 h-5 rounded-md font-black text-[10px] ${
                                item.intent === "I" ? "bg-blue-100 text-blue-700" :
                                item.intent === "C" ? "bg-emerald-100 text-emerald-700" :
                                item.intent === "N" ? "bg-purple-100 text-purple-700" :
                                "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {item.intent}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-black text-sm text-slate-900">{item.position}</span>
                              {diff !== null && diff > 0 && (
                                <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                                  <ArrowUpRight className="w-3 h-3" />+{diff}
                                </span>
                              )}
                              {diff !== null && diff < 0 && (
                                <span className="text-[10px] font-bold text-rose-600 flex items-center">
                                  <ArrowDownRight className="w-3 h-3" />{diff}
                                </span>
                              )}
                              {diff === 0 && (
                                <span className="text-[10px] text-slate-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                            {displayMetric(item.volume)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="font-mono font-bold text-slate-700 w-5">{displayMetric(item.kd)}</span>
                              <div className="w-8 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    (item.kd ?? 0) > 40 ? "bg-rose-500" : (item.kd ?? 0) > 20 ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${displayMetric(item.kd)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700">
                            {displayMetric(item.traffic)}
                          </td>
                          <td className="py-3 px-4 truncate max-w-xs">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-indigo-600 hover:underline flex items-center gap-1 truncate text-[11px]"
                            >
                              <span className="truncate">{item.url}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Link
                              href={`/seo/article-generator?keyword=${encodeURIComponent(item.keyword)}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[10px] font-bold rounded-md transition-colors"
                              title="このキーワードで記事構成を作成"
                            >
                              <FileText className="w-3 h-3" />
                              <span>記事化</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== [TAB 3: 上位ページ] ===== */}
        {activeTab === "pages" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">上位ページ一覧 (Top Pages by Traffic)</h2>
                <p className="text-xs text-slate-400">取得キーワード上位100件内のURL集計（サイト全体の流入ではありません）</p>
              </div>

              <button
                onClick={() => downloadCsv("pages")}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSVエクスポート</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-3 px-4">ページURL</th>
                      <th className="py-3 px-3 text-center w-24">タイプ</th>
                      <th className="py-3 px-3 text-center w-16">UR</th>
                      <th className="py-3 px-3 text-right w-28">流入トラフィック</th>
                      <th className="py-3 px-3 text-right w-20">シェア</th>
                      <th className="py-3 px-3 text-right w-24">推定価値</th>
                      <th className="py-3 px-3 text-center w-20">参照Domain</th>
                      <th className="py-3 px-3 text-center w-20">KW数</th>
                      <th className="py-3 px-4 w-60">トップ流入キーワード</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topPages.map((page) => (
                      <tr key={page.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-3 px-4 max-w-sm truncate">
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-indigo-700 hover:underline flex items-center gap-1 truncate"
                          >
                            <span className="truncate">{page.url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                          </a>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {page.pageType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {displayMetric(page.ur)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                          {displayMetric(page.traffic)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500 font-bold">
                          {displayMetric(page.trafficShare)}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">
                          ${displayMetric(page.trafficValue)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">
                          {displayMetric(page.refDomains)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-indigo-700">
                          {page.keywordsCount}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900">{page.topKeyword}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              順位 {page.topKeywordPos}位 • Vol: {displayMetric(page.topKeywordVol)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SiteExplorerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">読み込み中...</div>}>
      <SiteExplorerContent />
    </Suspense>
  );
}
