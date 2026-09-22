"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
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
  Info
} from "lucide-react";

// --- モックデータ定義 (Ahrefs 01〜03 キャプチャ完全準拠) ---

interface OrganicKeyword {
  id: string;
  keyword: string;
  intent: "I" | "N" | "C" | "T";
  intentLabel: string;
  position: number;
  prevPosition: number;
  volume: number;
  kd: number; // 0 - 100
  traffic: number;
  url: string;
}

interface TopPage {
  id: string;
  url: string;
  pageType: "Article" | "Guide" | "Definition" | "Product" | "Listing";
  ur: number;
  traffic: number;
  trafficShare: number; // %
  trafficValue: number; // $
  refDomains: number;
  keywordsCount: number;
  topKeyword: string;
  topKeywordPos: number;
  topKeywordVol: number;
}

const INITIAL_KEYWORDS: OrganicKeyword[] = [
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
  { id: "11", keyword: "ヤマト 私用", intent: "I", intentLabel: "Informational", position: 9, prevPosition: 12, volume: 200, kd: 14, traffic: 14, url: "https://www.daiwa-logi.co.jp/case/2024/04/27/113" },
  { id: "12", keyword: "白黒梱包機", intent: "C", intentLabel: "Commercial", position: 1, prevPosition: 2, volume: 400, kd: 19, traffic: 13, url: "https://www.daiwa-logi.co.jp/case/2024/04/21/116" },
  { id: "13", keyword: "シュリンクとは", intent: "I", intentLabel: "Informational", position: 21, prevPosition: 24, volume: 15000, kd: 45, traffic: 11, url: "https://www.daiwa-logi.co.jp/case/2024/06/03/43" },
  { id: "14", keyword: "ピッキングミスが多い人", intent: "I", intentLabel: "Informational", position: 7, prevPosition: 8, volume: 250, kd: 16, traffic: 9, url: "https://www.daiwa-logi.co.jp/case/2025/05/14/150" },
  { id: "15", keyword: "物流 dx 事例", intent: "C", intentLabel: "Commercial", position: 6, prevPosition: 6, volume: 150, kd: 27, traffic: 8, url: "https://www.daiwa-logi.co.jp/case/2025/05/07/147" },
  { id: "16", keyword: "2026年問題", intent: "I", intentLabel: "Informational", position: 30, prevPosition: 30, volume: 1300, kd: 38, traffic: 5, url: "https://www.daiwa-logi.co.jp/case/2026/04/27/119" },
  { id: "17", keyword: "梱包 自動化", intent: "C", intentLabel: "Commercial", position: 3, prevPosition: 3, volume: 10, kd: 11, traffic: 1, url: "https://www.daiwa-logi.co.jp/case/2024/04/01/27" }
];

const INITIAL_TOP_PAGES: TopPage[] = [
  { id: "1", url: "https://www.daiwa-logi.co.jp/case/2025/05/16/47", pageType: "Article", ur: 4.5, traffic: 1204, trafficShare: 78.0, trafficValue: 3.7, refDomains: 3, keywordsCount: 84, topKeyword: "メール便とは", topKeywordPos: 5, topKeywordVol: 8200 },
  { id: "2", url: "https://www.daiwa-logi.co.jp/case/2024/04/27/97", pageType: "How-to" as any, ur: 4.5, traffic: 51, trafficShare: 3.3, trafficValue: 1.9, refDomains: 0, keywordsCount: 18, topKeyword: "クリックポスト やり方", topKeywordPos: 15, topKeywordVol: 5700 },
  { id: "3", url: "https://www.daiwa-logi.co.jp/product.html", pageType: "Product", ur: 5.0, traffic: 43, trafficShare: 2.8, trafficValue: 31.0, refDomains: 1, keywordsCount: 7, topKeyword: "自動梱包機", topKeywordPos: 7, topKeywordVol: 400 },
  { id: "4", url: "https://www.daiwa-logi.co.jp/case/2025/05/29/188", pageType: "Article", ur: 4.4, traffic: 37, trafficShare: 2.4, trafficValue: 1.7, refDomains: 0, keywordsCount: 7, topKeyword: "物流 規格 一覧", topKeywordPos: 5, topKeywordVol: 100 },
  { id: "5", url: "https://www.daiwa-logi.co.jp/case/2025/05/07/137", pageType: "Guide", ur: 4.5, traffic: 32, trafficShare: 2.1, trafficValue: 1.7, refDomains: 0, keywordsCount: 9, topKeyword: "本の梱包", topKeywordPos: 9, topKeywordVol: 200 },
  { id: "6", url: "https://www.daiwa-logi.co.jp/column", pageType: "Article", ur: 0, traffic: 29, trafficShare: 1.9, trafficValue: 4.5, refDomains: 0, keywordsCount: 8, topKeyword: "物流 呼称", topKeywordPos: 9, topKeywordVol: 450 },
  { id: "7", url: "https://www.daiwa-logi.co.jp", pageType: "Product", ur: 6.0, traffic: 22, trafficShare: 1.4, trafficValue: 0.28, refDomains: 19, keywordsCount: 11, topKeyword: "メール便 種類", topKeywordPos: 1, topKeywordVol: 60 },
  { id: "8", url: "https://www.daiwa-logi.co.jp/case/2024/04/21/111", pageType: "Guide", ur: 0, traffic: 18, trafficShare: 1.2, trafficValue: 4.9, refDomains: 0, keywordsCount: 1, topKeyword: "シュリンク包装", topKeywordPos: 1, topKeywordVol: 400 },
  { id: "9", url: "https://www.daiwa-logi.co.jp/case/2024/01/10/65", pageType: "Article", ur: 4.5, traffic: 17, trafficShare: 1.1, trafficValue: 13.0, refDomains: 0, keywordsCount: 1, topKeyword: "緩衝材", topKeywordPos: 1, topKeywordVol: 500 },
  { id: "10", url: "https://www.daiwa-logi.co.jp/case/2024/04/21/90", pageType: "Guide", ur: 0, traffic: 16, trafficShare: 1.0, trafficValue: 0.0, refDomains: 0, keywordsCount: 3, topKeyword: "梱包 読み方", topKeywordPos: 14, topKeywordVol: 700 }
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

  // フィルター
  const [kwSearch, setKwSearch] = useState<string>("");
  const [kwPosFilter, setKwPosFilter] = useState<string>("all");
  const [kwIntentFilter, setKwIntentFilter] = useState<string>("all");

  // アクティブタブの同期
  useEffect(() => {
    if (activeTabParam === "keywords" || activeTabParam === "pages" || activeTabParam === "overview") {
      setActiveTab(activeTabParam);
    }
  }, [activeTabParam]);

  const handleTabChange = (tab: "overview" | "keywords" | "pages") => {
    setActiveTab(tab);
    router.push(`/seo/site-explorer?tab=${tab}`);
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 600);
  };

  // キーワード絞り込み
  const filteredKeywords = useMemo(() => {
    return INITIAL_KEYWORDS.filter((item) => {
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
  }, [kwSearch, kwPosFilter, kwIntentFilter]);

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
      rows = INITIAL_TOP_PAGES.map(p => 
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
                placeholder="自社または競合のドメインを入力 (例: example.co.jp)"
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
              <span>{isAnalyzing ? "分析中..." : "検索・分析"}</span>
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
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    自社分析対象
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>最終同期: 2026年9月20日</span>
                  <span>•</span>
                  <span>過去2年データ取得済み</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">表示モード:</span>
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
              <div className="text-2xl font-black text-slate-900 mt-1">22</div>
              <div className="text-[10px] text-slate-400 mt-0.5">順位 7,492,410</div>
            </div>

            {/* UR */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">UR (URL強さ)</div>
              <div className="text-2xl font-black text-slate-900 mt-1">6</div>
              <div className="text-[10px] text-slate-400 mt-0.5">トップページ基準</div>
            </div>

            {/* 被リンク数 */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>被リンク数</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +12
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">284</div>
              <div className="text-[10px] text-slate-400 mt-0.5">全期間 786</div>
            </div>

            {/* 参照ドメイン */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">参照ドメイン</div>
              <div className="text-2xl font-black text-slate-900 mt-1">31</div>
              <div className="text-[10px] text-slate-400 mt-0.5">DoFollow: 74%</div>
            </div>

            {/* オーガニックKW */}
            <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100">
              <div className="text-[11px] font-semibold text-indigo-900 flex items-center justify-between">
                <span>オーガニックKW</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +19
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-900 mt-1">172</div>
              <div className="text-[10px] text-indigo-600 font-medium mt-0.5">上位3位: 28件</div>
            </div>

            {/* オーガニックトラフィック */}
            <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100">
              <div className="text-[11px] font-semibold text-indigo-900 flex items-center justify-between">
                <span>月間トラフィック</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +124
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-900 mt-1">1.5K</div>
              <div className="text-[10px] text-indigo-600 font-medium mt-0.5">1,520 セッション</div>
            </div>

            {/* トラフィック価値 */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>推定広告価値</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +$219
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">$534</div>
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
              172
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
              23
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
                {/* トラフィック推移波形 */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>オーガニックトラフィック推移 (過去2年間)</span>
                      </h2>
                      <p className="text-xs text-slate-400">日次の推定検索流入セッション数の変動波形</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        オーガニックトラフィック
                      </span>
                    </div>
                  </div>

                  {/* SVG波形グラフ */}
                  <div className="h-48 w-full relative pt-4">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* グリッド破線 */}
                      <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="3 3" />
                      <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
                      <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeDasharray="3 3" />
                      
                      {/* 面 */}
                      <path
                        d="M 0 110 Q 70 105, 120 90 T 220 85 T 300 45 T 380 70 T 440 50 T 500 40 L 500 120 L 0 120 Z"
                        fill="url(#trafficGradient)"
                      />
                      {/* 線 */}
                      <path
                        d="M 0 110 Q 70 105, 120 90 T 220 85 T 300 45 T 380 70 T 440 50 T 500 40"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                      />
                      {/* ポイント */}
                      <circle cx="300" cy="45" r="4" fill="#f59e0b" className="animate-pulse" />
                      <circle cx="500" cy="40" r="4" fill="#f59e0b" />
                    </svg>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                      <span>2024年10月</span>
                      <span>2025年4月</span>
                      <span>2025年10月</span>
                      <span>2026年4月</span>
                      <span>現在 (2026年9月)</span>
                    </div>
                  </div>
                </div>

                {/* 順位帯推移スタック */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">オーガニックポジション推移</h2>
                      <p className="text-xs text-slate-400">獲得キーワードの順位帯別（1-3位、4-10位、11-20位など）の分布推移</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-amber-600"></span> 1-3位 (28)</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-amber-400"></span> 4-10位 (45)</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-amber-200"></span> 11-20位 (39)</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-slate-200"></span> 21-50位 (60)</span>
                    </div>
                  </div>

                  <div className="h-36 w-full relative pt-2">
                    <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="posGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d97706" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#fde68a" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 95 Q 100 85, 200 70 T 350 40 T 500 25 L 500 100 L 0 100 Z"
                        fill="url(#posGradient)"
                      />
                      <path
                        d="M 0 95 Q 100 85, 200 70 T 350 40 T 500 25"
                        fill="none"
                        stroke="#d97706"
                        strokeWidth="2"
                      />
                    </svg>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                      <span>2024年10月</span>
                      <span>2025年4月</span>
                      <span>2025年10月</span>
                      <span>2026年4月</span>
                      <span>現在 (2026年9月)</span>
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
                        <span className="font-mono text-slate-700 font-bold">1.5K (99.4%)</span>
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
                        <div className="font-bold text-slate-900">1.1K 流入</div>
                        <div className="text-[10px] text-slate-400">118 KW</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center">C</span>
                        <span className="font-medium text-slate-700">比較検討 (Commercial)</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">250 流入</div>
                        <div className="text-[10px] text-slate-400">32 KW</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black flex items-center justify-center">N</span>
                        <span className="font-medium text-slate-700">指名・案内 (Nav)</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">140 流入</div>
                        <div className="text-[10px] text-slate-400">15 KW</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-black flex items-center justify-center">T</span>
                        <span className="font-medium text-slate-700">購買行動 (Trans)</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">30 流入</div>
                        <div className="text-[10px] text-slate-400">7 KW</div>
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
                      <span className="font-bold text-slate-800">222 (78.2%)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">NoFollow リンク</span>
                      <span className="font-bold text-slate-800">62 (21.8%)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">参照IP数</span>
                      <span className="font-bold text-slate-800">28 IP</span>
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
                  <span> / 172 件</span>
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
                    {INITIAL_TOP_PAGES.map((page) => (
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
