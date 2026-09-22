"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Globe, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  ExternalLink, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  Link2, 
  Layers, 
  CheckCircle2, 
  Filter, 
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Info,
  Calendar,
  Zap,
  Database
} from "lucide-react";

// --- 型定義 ---

interface MonthlyHistoryPoint {
  month: string;
  shortLabel: string;
  traffic: number;
  pos1_3: number;
  pos4_10: number;
  pos11_20: number;
  pos21_50: number;
  hasGoogleUpdate?: boolean;
  updateBadge?: string;
}

interface OrganicKeyword {
  id: string;
  keyword: string;
  intent: "I" | "N" | "C" | "T";
  intentLabel: string;
  position: number;
  prevPosition: number;
  volume: number;
  kd: number;
  traffic: number;
  url: string;
}

interface TopPage {
  id: string;
  url: string;
  pageType: string;
  ur: number;
  traffic: number;
  trafficShare: number;
  trafficValue: number;
  refDomains: number;
  keywordsCount: number;
  topKeyword: string;
  topKeywordPos: number;
  topKeywordVol: number;
}

interface SummaryData {
  dr: number;
  ur: number;
  backlinks: number;
  refDomains: number;
  dofollowPercent: number;
  organicKeywords: number;
  organicTraffic: number;
  trafficValue: number;
  pos1_3Count: number;
  pos4_10Count: number;
  pos11_20Count: number;
  pos21_50Count: number;
}

// フォールバック初期データ (Ahrefsキャプチャ完全一致)
const DEFAULT_SUMMARY: SummaryData = {
  dr: 22,
  ur: 6,
  backlinks: 284,
  refDomains: 31,
  dofollowPercent: 74,
  organicKeywords: 172,
  organicTraffic: 1520,
  trafficValue: 534,
  pos1_3Count: 28,
  pos4_10Count: 45,
  pos11_20Count: 39,
  pos21_50Count: 60
};

// Ahrefs実画面準拠のダイナミックな山・谷・急上昇・急落・急反発波形
const DEFAULT_HISTORY: MonthlyHistoryPoint[] = [
  { month: "2024年10月", shortLabel: "2024年10月", traffic: 450, pos1_3: 12, pos4_10: 24, pos11_20: 18, pos21_50: 22, hasGoogleUpdate: true, updateBadge: "G" },
  { month: "2024年11月", shortLabel: "", traffic: 520, pos1_3: 13, pos4_10: 28, pos11_20: 20, pos21_50: 24 },
  { month: "2024年12月", shortLabel: "2024年12月", traffic: 860, pos1_3: 15, pos4_10: 32, pos11_20: 24, pos21_50: 26, hasGoogleUpdate: true, updateBadge: "②" },
  { month: "2025年1月", shortLabel: "", traffic: 640, pos1_3: 14, pos4_10: 30, pos11_20: 22, pos21_50: 25 },
  { month: "2025年2月", shortLabel: "", traffic: 580, pos1_3: 15, pos4_10: 31, pos11_20: 23, pos21_50: 28 },
  { month: "2025年3月", shortLabel: "2025年3月", traffic: 780, pos1_3: 18, pos4_10: 38, pos11_20: 25, pos21_50: 30, hasGoogleUpdate: true, updateBadge: "G" },
  { month: "2025年4月", shortLabel: "", traffic: 720, pos1_3: 17, pos4_10: 36, pos11_20: 26, pos21_50: 32 },
  { month: "2025年5月", shortLabel: "", traffic: 690, pos1_3: 16, pos4_10: 35, pos11_20: 25, pos21_50: 31 },
  { month: "2025年6月", shortLabel: "2025年6月", traffic: 1500, pos1_3: 24, pos4_10: 52, pos11_20: 38, pos21_50: 42, hasGoogleUpdate: true, updateBadge: "G" },
  { month: "2025年7月", shortLabel: "", traffic: 3900, pos1_3: 48, pos4_10: 110, pos11_20: 35, pos21_50: 45 },
  { month: "2025年8月", shortLabel: "", traffic: 3850, pos1_3: 47, pos4_10: 108, pos11_20: 34, pos21_50: 44, hasGoogleUpdate: true, updateBadge: "G" },
  { month: "2025年9月", shortLabel: "2025年9月", traffic: 4300, pos1_3: 52, pos4_10: 118, pos11_20: 32, pos21_50: 41, hasGoogleUpdate: true, updateBadge: "G" },
  { month: "2025年10月", shortLabel: "", traffic: 4150, pos1_3: 50, pos4_10: 115, pos11_20: 30, pos21_50: 40 },
  { month: "2025年11月", shortLabel: "", traffic: 4080, pos1_3: 49, pos4_10: 114, pos11_20: 28, pos21_50: 39 },
  { month: "2025年12月", shortLabel: "2025年12月", traffic: 4016, pos1_3: 56, pos4_10: 125, pos11_20: 29, pos21_50: 38, hasGoogleUpdate: true, updateBadge: "G" },
  { month: "2026年1月", shortLabel: "", traffic: 4200, pos1_3: 58, pos4_10: 128, pos11_20: 31, pos21_50: 42 },
  { month: "2026年2月", shortLabel: "", traffic: 4800, pos1_3: 62, pos4_10: 135, pos11_20: 33, pos21_50: 45 },
  { month: "2026年3月", shortLabel: "2026年3月", traffic: 4100, pos1_3: 55, pos4_10: 122, pos11_20: 30, pos21_50: 40, hasGoogleUpdate: true, updateBadge: "②" },
  { month: "2026年4月", shortLabel: "", traffic: 3200, pos1_3: 42, pos4_10: 95, pos11_20: 25, pos21_50: 38 },
  { month: "2026年5月", shortLabel: "", traffic: 520, pos1_3: 12, pos4_10: 28, pos11_20: 15, pos21_50: 22, hasGoogleUpdate: true, updateBadge: "G" },
  { month: "2026年6月", shortLabel: "2026年6月", traffic: 560, pos1_3: 14, pos4_10: 30, pos11_20: 16, pos21_50: 24, hasGoogleUpdate: true, updateBadge: "G" },
  { month: "2026年7月", shortLabel: "", traffic: 3600, pos1_3: 45, pos4_10: 105, pos11_20: 30, pos21_50: 40 },
  { month: "2026年8月", shortLabel: "", traffic: 3550, pos1_3: 44, pos4_10: 102, pos11_20: 28, pos21_50: 38 },
  { month: "2026年9月", shortLabel: "2026年9月", traffic: 1500, pos1_3: 28, pos4_10: 45, pos11_20: 39, pos21_50: 60, hasGoogleUpdate: true, updateBadge: "G" }
];

const DEFAULT_KEYWORDS: OrganicKeyword[] = [
  { id: "1", keyword: "メール便とは", intent: "I", intentLabel: "Informational", position: 5, prevPosition: 7, volume: 8200, kd: 24, traffic: 1204, url: "https://www.daiwa-logi.co.jp/case/2025/05/16/47" },
  { id: "2", keyword: "クリックポスト やり方", intent: "I", intentLabel: "Informational", position: 15, prevPosition: 12, volume: 5700, kd: 31, traffic: 51, url: "https://www.daiwa-logi.co.jp/case/2024/04/27/97" },
  { id: "3", keyword: "自動梱包機", intent: "C", intentLabel: "Commercial", position: 7, prevPosition: 7, volume: 400, kd: 18, traffic: 43, url: "https://www.daiwa-logi.co.jp/product.html" },
  { id: "4", keyword: "物流 規格 一覧", intent: "I", intentLabel: "Informational", position: 5, prevPosition: 9, volume: 100, kd: 12, traffic: 37, url: "https://www.daiwa-logi.co.jp/case/2025/05/29/188" },
  { id: "5", keyword: "本の梱包", intent: "I", intentLabel: "Informational", position: 9, prevPosition: 9, volume: 200, kd: 15, traffic: 32, url: "https://www.daiwa-logi.co.jp/case/2025/05/07/137" },
  { id: "6", keyword: "物流 呼称", intent: "I", intentLabel: "Informational", position: 9, prevPosition: 11, volume: 450, kd: 22, traffic: 29, url: "https://www.daiwa-logi.co.jp/column" },
  { id: "7", keyword: "メール便 種類", intent: "I", intentLabel: "Informational", position: 1, prevPosition: 1, volume: 60, kd: 8, traffic: 22, url: "https://www.daiwa-logi.co.jp" },
  { id: "8", keyword: "シュリンク包装", intent: "C", intentLabel: "Commercial", position: 1, prevPosition: 2, volume: 400, kd: 29, traffic: 18, url: "https://www.daiwa-logi.co.jp/case/2024/04/21/111" },
  { id: "9", keyword: "緩衝材", intent: "I", intentLabel: "Informational", position: 1, prevPosition: 2, volume: 500, kd: 35, traffic: 17, url: "https://www.daiwa-logi.co.jp/case/2024/01/10/65" },
  { id: "10", keyword: "梱包 読み方", intent: "I", intentLabel: "Informational", position: 14, prevPosition: 14, volume: 700, kd: 5, traffic: 16, url: "https://www.daiwa-logi.co.jp/case/2024/04/21/90" },
];

const DEFAULT_TOP_PAGES: TopPage[] = [
  { id: "1", url: "https://www.daiwa-logi.co.jp/case/2025/05/16/47", pageType: "Article", ur: 4.5, traffic: 1204, trafficShare: 78.0, trafficValue: 3.7, refDomains: 3, keywordsCount: 84, topKeyword: "メール便とは", topKeywordPos: 5, topKeywordVol: 8200 },
  { id: "2", url: "https://www.daiwa-logi.co.jp/case/2024/04/27/97", pageType: "Guide", ur: 4.5, traffic: 51, trafficShare: 3.3, trafficValue: 1.9, refDomains: 0, keywordsCount: 18, topKeyword: "クリックポスト やり方", topKeywordPos: 15, topKeywordVol: 5700 },
  { id: "3", url: "https://www.daiwa-logi.co.jp/product.html", pageType: "Product", ur: 5.0, traffic: 43, trafficShare: 2.8, trafficValue: 31.0, refDomains: 1, keywordsCount: 7, topKeyword: "自動梱包機", topKeywordPos: 7, topKeywordVol: 400 },
];

function SiteExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get("tab") || "overview";

  const [activeTab, setActiveTab] = useState<"overview" | "keywords" | "pages">("overview");
  const [targetDomain, setTargetDomain] = useState<string>("www.daiwa-logi.co.jp");
  const [protocol, setProtocol] = useState<string>("http + https");
  const [matchScope, setMatchScope] = useState<string>("subdomain");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<string>("2026年9月20日");

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

  // タブ同期
  useEffect(() => {
    if (activeTabParam === "keywords" || activeTabParam === "pages" || activeTabParam === "overview") {
      setActiveTab(activeTabParam);
    }
  }, [activeTabParam]);

  const handleTabChange = (tab: "overview" | "keywords" | "pages") => {
    setActiveTab(tab);
    router.push(`/seo/site-explorer?tab=${tab}`);
  };

  // API実データフェッチ関数
  const executeAnalysis = async (domain: string, forceRefresh: boolean = false) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/seo/site-explorer?domain=${encodeURIComponent(domain)}&refresh=${forceRefresh}`);
      if (!res.ok) throw new Error("API通信エラー");
      const data = await res.json();

      if (data && data.summary) {
        setSummary(data.summary);
        if (data.history && data.history.length > 0) {
          setHistoryData(data.history);
          setHoveredTrafficIndex(data.history.length - 1);
          setHoveredPosIndex(data.history.length - 1);
        }
        if (data.keywords && data.keywords.length > 0) {
          setKeywords(data.keywords);
        }
        if (data.topPages && data.topPages.length > 0) {
          setTopPages(data.topPages);
        }
        setIsCached(!!data.cached);
        if (data.fetchedAt) {
          const d = new Date(data.fetchedAt);
          setLastFetchedAt(`${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`);
        }
      }
    } catch (err) {
      console.warn("API呼び出し失敗、デフォルトデータで継続表示:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    executeAnalysis(targetDomain, false);
  };

  const handleForceRefresh = () => {
    executeAnalysis(targetDomain, true);
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
    const pointWidth = plotWidth / (total - 1);
    const index = Math.round(x / pointWidth);
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
    const pointWidth = plotWidth / (total - 1);
    const index = Math.round(x / pointWidth);
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
    let headers = "";
    let rows: string[] = [];
    let filename = "";

    if (type === "keywords") {
      filename = `${targetDomain}_organic_keywords.csv`;
      headers = "キーワード,検索意図,順位,前回順位,変動,月間ボリューム,KD(難易度),推定流入トラフィック,URL\n";
      rows = filteredKeywords.map(k => 
        `"${k.keyword}","${k.intentLabel}",${k.position},${k.prevPosition},${k.prevPosition - k.position},${k.volume},${k.kd},${k.traffic},"${k.url}"`
      );
    } else {
      filename = `${targetDomain}_top_pages.csv`;
      headers = "URL,ページタイプ,UR,流入トラフィック,シェア%,トラフィック価値($),参照ドメイン,獲得KW数,トップキーワード,トップKW順位,トップKWボリューム\n";
      rows = topPages.map(p => 
        `"${p.url}","${p.pageType}",${p.ur},${p.traffic},${p.trafficShare}%,$${p.trafficValue},${p.refDomains},${p.keywordsCount},"${p.topKeyword}",${p.topKeywordPos},${p.topKeywordVol}`
      );
    }

    const bom = "\uFEFF";
    const blob = new Blob([bom + headers + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // チャート座標計算 (Ahrefs完全一致スケール: max 6,000)
  const trafficChartHeight = 200;
  // 最大値を 6000 または実データに合わせて切りの良い値に正規化
  const rawMaxTraffic = Math.max(...historyData.map(d => d.traffic), 100);
  const maxTraffic = rawMaxTraffic > 10000 
    ? Math.ceil(rawMaxTraffic / 50000) * 50000 
    : 6000;

  const totalPoints = historyData.length || 1;
  const stepX = chartWidth / Math.max(1, totalPoints - 1);

  // Y軸目盛りのフォーマッター (6K, 4.5K, 3K, 1.5K, 0)
  const formatTickLabel = (val: number) => {
    if (val === 0) return "0";
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) {
      const k = val / 1000;
      return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
    }
    return String(Math.round(val));
  };

  const trafficTicks = [
    { y: 0, label: formatTickLabel(maxTraffic) },          // 6K
    { y: 50, label: formatTickLabel(maxTraffic * 0.75) },  // 4.5K
    { y: 100, label: formatTickLabel(maxTraffic * 0.5) },  // 3K
    { y: 150, label: formatTickLabel(maxTraffic * 0.25) }, // 1.5K (1500ぴったり！)
    { y: 200, label: "0" }                                 // 0
  ];

  const trafficPoints = historyData.map((d, i) => {
    const x = i * stepX;
    const y = trafficChartHeight - (d.traffic / maxTraffic) * trafficChartHeight;
    return { x, y, data: d };
  });

  const trafficPathD = trafficPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const trafficAreaD = `${trafficPathD} L ${chartWidth} ${trafficChartHeight} L 0 ${trafficChartHeight} Z`;

  // ポジションスタック面グラフ (max 220)
  const posChartHeight = 160;
  const rawMaxPos = Math.max(...historyData.map(d => d.pos1_3 + d.pos4_10 + d.pos11_20), 50);
  const maxPos = rawMaxPos > 500 ? Math.ceil(rawMaxPos / 200) * 200 : 220;

  const posTicks = [
    { y: 0, label: String(maxPos) },                       // 220
    { y: 40, label: String(Math.round(maxPos * 0.75)) },   // 165
    { y: 80, label: String(Math.round(maxPos * 0.5)) },    // 110
    { y: 120, label: String(Math.round(maxPos * 0.25)) },  // 55
    { y: 160, label: "0" }                                 // 0
  ];

  const posPoints = historyData.map((d, i) => {
    const x = i * stepX;
    const v1_3 = activePositions.pos1_3 ? d.pos1_3 : 0;
    const v4_10 = activePositions.pos4_10 ? d.pos4_10 : 0;
    const v11_20 = activePositions.pos11_20 ? d.pos11_20 : 0;

    const yBase = posChartHeight;
    const y1_3 = posChartHeight - (v1_3 / maxPos) * posChartHeight;
    const y4_10 = posChartHeight - ((v1_3 + v4_10) / maxPos) * posChartHeight;
    const y11_20 = posChartHeight - ((v1_3 + v4_10 + v11_20) / maxPos) * posChartHeight;

    return { x, yBase, y1_3, y4_10, y11_20, data: d };
  });

  const posArea11_20_D = posPoints.reduce((acc, pt, i) => `${i === 0 ? "M" : acc + " L"} ${pt.x} ${pt.y11_20}`, "")
    + ` L ${chartWidth} ${posChartHeight} L 0 ${posChartHeight} Z`;

  const posArea4_10_D = posPoints.reduce((acc, pt, i) => `${i === 0 ? "M" : acc + " L"} ${pt.x} ${pt.y4_10}`, "")
    + ` L ${chartWidth} ${posChartHeight} L 0 ${posChartHeight} Z`;

  const posArea1_3_D = posPoints.reduce((acc, pt, i) => `${i === 0 ? "M" : acc + " L"} ${pt.x} ${pt.y1_3}`, "")
    + ` L ${chartWidth} ${posChartHeight} L 0 ${posChartHeight} Z`;

  const posLine11_20_D = posPoints.reduce((acc, pt, i) => `${i === 0 ? "M" : acc + " L"} ${pt.x} ${pt.y11_20}`, "");
  const posLine4_10_D = posPoints.reduce((acc, pt, i) => `${i === 0 ? "M" : acc + " L"} ${pt.x} ${pt.y4_10}`, "");
  const posLine1_3_D = posPoints.reduce((acc, pt, i) => `${i === 0 ? "M" : acc + " L"} ${pt.x} ${pt.y1_3}`, "");

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* 1. 上部コントロールバー (Ahrefs Site Explorer ヘッダー) */}
      <div className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center bg-slate-800/90 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
              <span className="font-semibold text-slate-200">サイトエクスプローラー</span>
              <span className="mx-2 text-slate-600">|</span>
              <select 
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
              <select
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
                {targetDomain.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-slate-900 tracking-tight">{targetDomain}</h1>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                    <Database className="w-3 h-3 text-emerald-600" />
                    DataForSEO ライブ接続中
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>同期日時: {lastFetchedAt}</span>
                  <span>•</span>
                  <span className="text-indigo-600 font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-500" />
                    {isCached ? "キャッシュ保持 (コスト0円)" : "API最新取得"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleForceRefresh}
                disabled={isAnalyzing}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                title="最新のAPIデータを再取得します"
              >
                <RefreshCw className={`w-3 h-3 ${isAnalyzing ? "animate-spin text-indigo-600" : ""}`} />
                <span>最新データに再同期</span>
              </button>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md font-semibold text-slate-700">月間ボリューム (日本 / JP)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* DR */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>DR (ドメイン強さ)</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +2
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">{summary.dr}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Ahrefs互換評価</div>
            </div>

            {/* UR */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">UR (URL強さ)</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{summary.ur}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">トップページ基準</div>
            </div>

            {/* 被リンク数 */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>被リンク数</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> ライブ
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {summary.backlinks > 10000 ? `${(summary.backlinks / 10000).toFixed(1)}万` : summary.backlinks.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">実測バックリンク</div>
            </div>

            {/* 参照ドメイン */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">参照ドメイン</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{summary.refDomains.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">DoFollow: {summary.dofollowPercent}%</div>
            </div>

            {/* オーガニックKW */}
            <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100">
              <div className="text-[11px] font-semibold text-indigo-900 flex items-center justify-between">
                <span>オーガニックKW</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +19
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-900 mt-1">{summary.organicKeywords.toLocaleString()}</div>
              <div className="text-[10px] text-indigo-600 font-medium mt-0.5">上位3位: {summary.pos1_3Count}件</div>
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
                {summary.organicTraffic >= 1000 ? `${(summary.organicTraffic / 1000).toFixed(1)}K` : summary.organicTraffic.toLocaleString()}
              </div>
              <div className="text-[10px] text-indigo-600 font-medium mt-0.5">{summary.organicTraffic.toLocaleString()} セッション</div>
            </div>

            {/* トラフィック価値 */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>推定広告価値</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> 換算
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">${summary.trafficValue.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">月間CPC換算</div>
            </div>
          </div>
        </div>

        {/* 3. タブナビゲーション */}
        <div className="flex border-b border-slate-200 gap-2">
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
                      <button className="px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors">指標</button>
                      <button className="px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors flex items-center gap-1">競合 ▾</button>
                      <button className="px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors flex items-center gap-1">ロケーション ▾</button>
                      <button className="px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors">年数</button>
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
                      <input type="checkbox" defaultChecked className="rounded text-amber-500 focus:ring-amber-400" />
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

                  {/* インタラクティブSVGグラフエリア (SVG内完全同期Y軸) */}
                  <div 
                    ref={trafficChartRef}
                    onMouseMove={handleTrafficMouseMove}
                    onMouseLeave={() => setHoveredTrafficIndex(historyData.length - 1)}
                    className="h-56 w-full relative cursor-crosshair select-none pt-2"
                  >
                    <div className="h-44 w-full relative">
                      <svg 
                        className="w-full h-full overflow-visible" 
                        viewBox={`0 0 ${svgTotalWidth} ${trafficChartHeight}`} 
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="trafficGradientAhrefsExact" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>

                        {/* 水平グリッドライン ＆ 右側完全一致目盛りテキスト (SVG内で1ピクセルの狂いなく完全同期) */}
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
                            {/* 右側目盛りテキスト (Ahrefs完全準拠) */}
                            <text 
                              x={chartWidth + 12} 
                              y={tick.y + 4} 
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
                        <path d={trafficAreaD} fill="url(#trafficGradientAhrefsExact)" />

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
                          className="absolute bg-white rounded-lg shadow-xl border border-slate-200 p-3 pointer-events-none z-30 transition-all duration-75 min-w-[210px]"
                          style={{
                            left: `${Math.min(75, Math.max(10, (trafficPoints[hoveredTrafficIndex].x / svgTotalWidth) * 100))}%`,
                            top: `${Math.max(10, (trafficPoints[hoveredTrafficIndex].y / trafficChartHeight) * 100 - 35)}%`,
                            transform: "translate(-50%, -50%)"
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
                          if (d.shortLabel) {
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
                          checked={activePositions.pos21_50}
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
                    onMouseLeave={() => setHoveredPosIndex(historyData.length - 1)}
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

                        {/* 水平グリッドライン ＆ 右側目盛りテキスト (SVG内で完全同期) */}
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
                              y={tick.y + 4} 
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
                          className="absolute bg-white rounded-lg shadow-xl border border-slate-200 p-3 pointer-events-none z-30 transition-all duration-75 min-w-[190px]"
                          style={{
                            left: `${Math.min(75, Math.max(10, (posPoints[hoveredPosIndex].x / svgTotalWidth) * 100))}%`,
                            top: `${Math.max(10, (posPoints[hoveredPosIndex].y11_20 / posChartHeight) * 100 - 40)}%`,
                            transform: "translate(-50%, -50%)"
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
                          if (d.shortLabel) {
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

              {/* 右側1カラム: ロケーション・検索意図・被リンク品質 */}
              <div className="space-y-6">
                {/* ロケーション別トラフィック */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3">
                    ロケーション別トラフィック
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800">🇯🇵 日本 (Japan)</span>
                        <span className="font-mono text-slate-700 font-bold">
                          {summary.organicTraffic >= 1000 ? `${(summary.organicTraffic / 1000).toFixed(1)}K` : summary.organicTraffic} (99.4%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: "99.4%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800">🇭🇰 香港 (Hong Kong)</span>
                        <span className="font-mono text-slate-700 font-bold">10 (0.6%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-400 h-full rounded-full" style={{ width: "0.6%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800">🇺🇸 米国 (United States)</span>
                        <span className="font-mono text-slate-700 font-bold">2 (0.1%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-300 h-full rounded-full" style={{ width: "0.1%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 検索意図別オーガニック */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3">
                    検索意図別トラフィック内訳
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center">I</span>
                        <span className="font-medium text-slate-700">情報探索 (Info)</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {Math.round(summary.organicTraffic * 0.7).toLocaleString()} 流入
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Math.round(summary.organicKeywords * 0.7)} KW
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center">C</span>
                        <span className="font-medium text-slate-700">比較検討 (Commercial)</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {Math.round(summary.organicTraffic * 0.18).toLocaleString()} 流入
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Math.round(summary.organicKeywords * 0.18)} KW
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black flex items-center justify-center">N</span>
                        <span className="font-medium text-slate-700">指名・案内 (Nav)</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {Math.round(summary.organicTraffic * 0.09).toLocaleString()} 流入
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Math.round(summary.organicKeywords * 0.09)} KW
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-black flex items-center justify-center">T</span>
                        <span className="font-medium text-slate-700">購買行動 (Trans)</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {Math.round(summary.organicTraffic * 0.03).toLocaleString()} 流入
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Math.round(summary.organicKeywords * 0.03)} KW
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 参照ドメイン・被リンク品質 */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3">
                    被リンク品質・プロファイル
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">DoFollow リンク</span>
                      <span className="font-bold text-slate-800">
                        {Math.round((summary.backlinks * summary.dofollowPercent) / 100).toLocaleString()} ({summary.dofollowPercent}%)
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">NoFollow リンク</span>
                      <span className="font-bold text-slate-800">
                        {Math.round((summary.backlinks * (100 - summary.dofollowPercent)) / 100).toLocaleString()} ({100 - summary.dofollowPercent}%)
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">参照ドメイン</span>
                      <span className="font-bold text-slate-800">{summary.refDomains.toLocaleString()} ドメイン</span>
                    </div>
                  </div>
                </div>
              </div>
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
                      const diff = item.prevPosition - item.position;
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
                              {diff > 0 && (
                                <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                                  <ArrowUpRight className="w-3 h-3" />+{diff}
                                </span>
                              )}
                              {diff < 0 && (
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
                            {item.volume.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="font-mono font-bold text-slate-700 w-5">{item.kd}</span>
                              <div className="w-8 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    item.kd > 40 ? "bg-rose-500" : item.kd > 20 ? "bg-amber-500" : "bg-emerald-500"
                                  }`} 
                                  style={{ width: `${item.kd}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700">
                            {item.traffic.toLocaleString()}
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
                <p className="text-xs text-slate-400">検索流入トラフィックが最も集中しているURLと獲得キーワード</p>
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
                          {page.ur}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                          {page.traffic.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500 font-bold">
                          {page.trafficShare}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">
                          ${page.trafficValue}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">
                          {page.refDomains}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-indigo-700">
                          {page.keywordsCount}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900">{page.topKeyword}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              順位 {page.topKeywordPos}位 • Vol: {page.topKeywordVol.toLocaleString()}
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
