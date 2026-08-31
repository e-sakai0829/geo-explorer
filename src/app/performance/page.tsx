"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ExternalLink, 
  Search,
  Bot,
  Layers,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PerformancePage() {
  const { lang, t } = useLanguage();
  const [brandName, setBrandName] = useState("自社ブランド");
  const [domain, setDomain] = useState("https://example.com");
  const [hasArticles, setHasArticles] = useState(false);

  const [trackedItems, setTrackedItems] = useState<any[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [rescanningId, setRescanningId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/user/project")
      .then((res) => res.json())
      .then((data) => {
        if (data?.project) {
          setBrandName(data.project.name || (lang === "zh-TW" ? "自社品牌" : lang === "en" ? "My Brand" : "自社ブランド"));
          setDomain(data.project.domain || "https://example.com");
        }
      })
      .catch(() => {});
  }, [lang]);

  // ローカルストレージからの復元
  useEffect(() => {
    const saved = localStorage.getItem("geo_performance_tracked");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTrackedItems(parsed);
        if (parsed.length > 0) setHasArticles(true);
      } catch (e) {}
    }
  }, []);

  const saveTrackedItems = (items: any[]) => {
    setTrackedItems(items);
    setHasArticles(items.length > 0);
    localStorage.setItem("geo_performance_tracked", JSON.stringify(items));
  };

  // 公開URLの新規登録
  const handleRegisterUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt || !newUrl) return;

    const newItem = {
      id: Date.now().toString(),
      prompt: newPrompt,
      url: newUrl,
      date: new Date().toISOString(),
      status: "pending",
      beforeStatus: lang === "zh-TW" ? "未提及・競品佔有" : lang === "en" ? "Not Mentioned / Competitor Occupied" : "未言及・他社メディア占有",
      afterStatus: lang === "zh-TW" ? "索引與AI學習中 (需再次掃描)" : lang === "en" ? "Indexing & AI Learning (Rescan Required)" : "インデックス・AI学習待ち (要再スキャン)",
      lastScannedAt: null,
      aiResponse: null,
      brandMentioned: false,
      brandCited: false,
    };

    const updated = [newItem, ...trackedItems];
    saveTrackedItems(updated);
    setNewPrompt("");
    setNewUrl("");
  };

  // 1クレジットを使って効果測定（再スキャン）を実行
  const handleRescan = async (item: any) => {
    setRescanningId(item.id);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: item.prompt,
          brandName: brandName,
          competitors: [],
          targetLocale: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (lang === "zh-TW" ? "再次掃描驗證失敗" : lang === "en" ? "Rescan failed" : "再検証スキャンに失敗しました。"));

      const updated = trackedItems.map((t) => {
        if (t.id === item.id) {
          return {
            ...t,
            status: "verified",
            lastScannedAt: new Date().toISOString(),
            afterStatus: data.brandCited 
              ? (lang === "zh-TW" ? "🟢 已獲得自社網域引用！" : lang === "en" ? "🟢 Won Direct Citation!" : "🟢 自社URL参照を獲得！")
              : (lang === "zh-TW" ? "🟡 已提及品牌 (持續補強中)" : lang === "en" ? "🟡 Mentioned (Enhance content)" : "🟡 言及認知あり (引用奪還へ向けて継続補強)"),
            brandMentioned: data.brandMentioned,
            brandCited: data.brandCited,
            aiResponse: data.aiResponse,
            citationSources: data.citationSources || [],
          };
        }
        return t;
      });

      saveTrackedItems(updated);
      const currentVerified = updated.find((t) => t.id === item.id);
      setActiveReport(currentVerified);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRescanningId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans antialiased text-slate-900">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <TrendingUp className="w-3.5 h-3.5" />
          Closed-loop Performance Tracker
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t.perf_title}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {lang === "zh-TW"
            ? "追蹤並驗證發布之 AEO 直答專文在 Google AI Overviews 中的引用與推薦時序成效"
            : lang === "en"
            ? "Track and verify the timeline impact of your published AEO articles in Google AI Overviews."
            : "生成・公開した AEO 直答記事が、Google AI Overviews に引用・推薦されるまでの時系列推移を追跡・効果検証します"}
        </p>
      </div>

      {/* 1. 公開済み AEO記事 URL 登録フォーム */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
            <ExternalLink className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {lang === "zh-TW" ? "🔗 註冊已發布之 AEO 專文 (自社網址)" : lang === "en" ? "🔗 Register Published AEO Article URL" : "🔗 公開済み AEO記事（自社URL）の登録"}
            </h3>
            <p className="text-[11px] text-slate-400">
              {lang === "zh-TW"
                ? "輸入已發布於自社網站或官方媒體之專文 URL 以開啟成效追蹤"
                : lang === "en"
                ? "Register the URL published on your official website to start tracking performance."
                : "自社オウンドメディアやWebサイトに公開した記事のURLを登録して効果測定を開始します"}
            </p>
          </div>
        </div>

        <form onSubmit={handleRegisterUrl} className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          <div className="md:col-span-5 space-y-1">
            <label className="block font-bold text-slate-700">
              {lang === "zh-TW" ? "目標商業提示詞 (KW)" : lang === "en" ? "Target Query (KW)" : "対策ターゲットKW (プロンプト)"} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder={lang === "zh-TW" ? "例如: 企業品牌定位 費用 比較" : lang === "en" ? "e.g. Purpose Branding Agency Comparison" : "例: パーパスブランディング 費用 比較"}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-5 space-y-1">
            <label className="block font-bold text-slate-700">
              {lang === "zh-TW" ? "已發布專文之自社 URL" : lang === "en" ? "Published Article URL" : "公開した記事の自社URL"} <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://www.smo-inc.com/purpose-branding-guide"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              <span>{lang === "zh-TW" ? "註冊 URL" : lang === "en" ? "Register URL" : "URLを登録"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* 2. Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">
            {lang === "zh-TW" ? "追蹤中發布專文" : lang === "en" ? "Tracked Articles" : "公開・トラッキング中記事"}
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {trackedItems.length} <span className="text-xs font-normal text-slate-400">{lang === "zh-TW" ? "篇" : lang === "en" ? "Articles" : "本"}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {trackedItems.length > 0 
              ? (lang === "zh-TW" ? "正在監控自社網域之公開專文" : lang === "en" ? "Monitoring published domain articles" : "自社ドメインの公開記事を監視中")
              : (lang === "zh-TW" ? "註冊 URL 後將自動累計" : lang === "en" ? "Auto-tracked upon URL registration" : "記事URLを登録すると自動集計されます")}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">AI Overviews {lang === "zh-TW" ? "引用獲得率" : lang === "en" ? "Citation Win Rate" : "引用獲得率"}</div>
          <div className="text-3xl font-black text-indigo-600 tracking-tight">
            {trackedItems.length > 0 
              ? `${Math.round((trackedItems.filter((t) => t.brandCited).length / trackedItems.length) * 100)}%` 
              : "—"}
          </div>
          <div className="text-[11px] text-slate-400">
            {trackedItems.length > 0 
              ? (lang === "zh-TW" ? `已獲得: ${trackedItems.filter((t) => t.brandCited).length} / ${trackedItems.length} 篇` : lang === "en" ? `Won: ${trackedItems.filter((t) => t.brandCited).length} / ${trackedItems.length}` : `獲得件数: ${trackedItems.filter((t) => t.brandCited).length} / ${trackedItems.length} 本`)
              : (lang === "zh-TW" ? "註冊 URL 後開啟追蹤掃描" : lang === "en" ? "Tracking begins upon registration" : "URL登録後に追跡スキャンが有効化されます")}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">
            {lang === "zh-TW" ? "預估獲得引用平均天數" : lang === "en" ? "Est. Days to Citation" : "平均引用獲得までの目安"}
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            14 <span className="text-xs font-normal text-slate-400">{lang === "zh-TW" ? "天" : lang === "en" ? "Days" : "日"}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {lang === "zh-TW" ? "從專文發布至獲得 AIO 引用" : lang === "en" ? "From AEO published to AIO citation" : "AEO 記事公開から AIO ソース採用まで"}
          </div>
        </div>
      </div>

      {/* 3. トラッキング登録済みURL＆効果測定一覧テーブル */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Search className="w-4 h-4 text-indigo-600" />
            <span>{lang === "zh-TW" ? "已對策 URL 追蹤與成效驗證清單" : lang === "en" ? "Tracked URLs & Performance Tracker" : "対策済みURL・効果測定トラッカー一覧"}</span>
            <span className="text-xs text-slate-400 font-normal">({trackedItems.length} {lang === "zh-TW" ? "個 URL" : lang === "en" ? "URLs" : "件の公開URL"})</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {lang === "zh-TW" ? "點擊「1額度再次驗證」直接檢測 AI 搜尋反映成效" : lang === "en" ? "Click '1-Credit Rescan' to test live AI Overview impact" : "「1クレジット再検証」でAI検索への反映効果を直接測定できます"}
          </span>
        </div>

        {trackedItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">{lang === "zh-TW" ? "註冊日期" : lang === "en" ? "Date" : "登録日時"}</th>
                  <th className="py-3 px-3">{lang === "zh-TW" ? "目標 KW / 已發布 URL" : lang === "en" ? "Target KW / Published URL" : "ターゲットKW / 公開自社URL"}</th>
                  <th className="py-3 px-3">{lang === "zh-TW" ? "成效追蹤狀態 (After Status)" : lang === "en" ? "After Status" : "効果測定状況 (After Status)"}</th>
                  <th className="py-3 px-3 text-right">{lang === "zh-TW" ? "驗證操作" : lang === "en" ? "Action" : "検証操作"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {trackedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div className="text-slate-900 font-bold">{item.prompt}</div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-600 hover:underline font-mono inline-flex items-center gap-1 truncate max-w-xs"
                      >
                        <span>{item.url}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 px-3 font-semibold text-xs">
                      {item.brandCited ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {lang === "zh-TW" ? "已獲得自社網域引用！" : lang === "en" ? "Direct Citation Won!" : "直接参照を獲得！"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[11px]">
                          {item.afterStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleRescan(item)}
                        disabled={rescanningId === item.id}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-lg transition-colors text-xs inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{rescanningId === item.id ? (lang === "zh-TW" ? "掃描中..." : lang === "en" ? "Scanning..." : "再スキャン中...") : (lang === "zh-TW" ? "1額度再次驗證" : lang === "en" ? "1-Credit Rescan" : "1クレジットで再検証")}</span>
                      </button>

                      {item.lastScannedAt && (
                        <button
                          onClick={() => setActiveReport(item)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>📊 Before/After {lang === "zh-TW" ? "報告" : lang === "en" ? "Report" : "レポート"}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <div>{lang === "zh-TW" ? "尚無追蹤中之 AEO 專文 URL" : lang === "en" ? "No tracked AEO article URLs yet." : "まだ効果測定対象のAEO記事URLが登録されていません。"}</div>
            <div className="text-[11px] text-slate-500">
              {lang === "zh-TW" ? "請於上方表單註冊已發布之 URL，並執行「1額度再次驗證」。" : lang === "en" ? "Register your published URL above and click '1-Credit Rescan'." : "上のフォームから公開した自社URLを登録し、「1クレジット再検証」を実行してください。"}
            </div>
          </div>
        )}
      </div>

      {/* 4. Active Before/After Report Modal / Card */}
      {activeReport && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/30 space-y-6">
          <div className="flex items-center justify-between border-b border-indigo-500/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                <TrendingUp className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                  {lang === "zh-TW" ? "成效實證 Before / After 報告" : lang === "en" ? "Proven Impact Before / After Report" : "成果実証 Before / After レポート"}
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                  {lang === "zh-TW" ? "關鍵字" : lang === "en" ? "Keyword" : "キーワード"}: 「{activeReport.prompt}」
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Before */}
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
              <span className="text-[10px] font-extrabold text-rose-400 bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/30 uppercase tracking-wider">
                Before ({lang === "zh-TW" ? "對策前" : lang === "en" ? "Unoptimized" : "対策前"})
              </span>
              <h4 className="text-sm font-bold text-slate-200">
                {lang === "zh-TW" ? "AI 解答僅獨占引用競品或外部媒體" : lang === "en" ? "AI Overviews Exclusively Cited Competitors" : "AI回答内で他社メディアのみが独占参照"}
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {lang === "zh-TW"
                  ? "自社官方網域未被引用，高意向流量被競品比較媒體或新聞奪取。"
                  : lang === "en"
                  ? "No official domain citations; high-intent search traffic was lost to competitor media."
                  : "自社公式ドメインからの引用がなく、他社の比較サイトやニュースメディアにAI検索ユーザーの流入を奪われている状態。"}
              </p>
            </div>

            {/* After */}
            <div className="bg-indigo-900/60 p-5 rounded-2xl border border-indigo-400/40 space-y-2">
              <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                After ({lang === "zh-TW" ? "AEO專文發布後" : lang === "en" ? "AEO Published" : "AEO記事公開後"})
              </span>
              <h4 className="text-sm font-bold text-emerald-300">
                {activeReport.brandCited 
                  ? (lang === "zh-TW" ? "🎉 自社網站 URL 成功奪取 AI 直接引用區塊！" : lang === "en" ? "🎉 Official URL Won Direct AI Citation Card!" : "🎉 自社サイトURLがAIの直接参照枠を獲得！")
                  : (lang === "zh-TW" ? "AI 知識空間中品牌提及度提升" : lang === "en" ? "Brand Awareness Enhanced in AI Knowledge Space" : "AIナレッジ空間でブランドが言及認知向上")}
              </h4>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {activeReport.brandCited
                  ? (lang === "zh-TW" 
                    ? `自社網域（${activeReport.url}）獲採用為 Google AI Overviews 官方引用卡片，獲取高意向自然流量。` 
                    : lang === "en"
                    ? `Official domain (${activeReport.url}) adopted as a Google AI Overviews Web Card, capturing high-intent organic traffic.`
                    : `自社ドメイン（${activeReport.url}）がGoogle AI Overviewsの公式参照カードとして採用され、検索ユーザーからの信頼流入を獲得。`)
                  : (lang === "zh-TW"
                    ? `自社品牌名已出現在 AI 解答本文中。請持續補強專文內容以奪取引用卡片。`
                    : lang === "en"
                    ? `Brand name now mentioned in AI response. Continue enhancing content to capture the Web Card.`
                    : `自社ブランド名がAI回答本文に登場。引用URL枠の奪還に向けてコンテンツを維持・拡充してください。`)}
              </p>
            </div>
          </div>

          {activeReport.aiResponse && (
            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 text-xs space-y-2">
              <div className="text-indigo-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === "zh-TW" ? "最新 Gemini 掃描解答結果" : lang === "en" ? "Latest Gemini Scan Response" : "最新のGeminiスキャン回答結果"}
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap font-sans">
                {activeReport.aiResponse}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Demo Case Preview Guide */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white space-y-3 shadow-md border border-indigo-500/30">
        <div className="font-bold text-xs text-indigo-300 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          {lang === "zh-TW" ? "【參考】AEO 策略獲得引用流程 (實證模型)" : lang === "en" ? "[Reference] AEO Citation Acquisition Flow" : "【参考】AEO 施策による引用獲得フロー（実証モデル）"}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <div className="font-bold text-rose-400">{lang === "zh-TW" ? "Before（對策前）" : lang === "en" ? "Before (Unoptimized)" : "Before（施策前）"}</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {lang === "zh-TW"
                ? "• AI Overviews 完全未提及自社品牌（推薦率 0%）\n• 競品品牌獨占 AI 摘要之推薦解答"
                : lang === "en"
                ? "• Zero brand mentions in AI Overviews (0% Share of Model)\n• Competitors exclusively recommended in AI summaries"
                : "• AI Overviews に自社ブランドが一切言及されない（言及率 0%）\n• 競合他社のみが AI の「おすすめ」として回答文に独占露出"}
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <div className="font-bold text-emerald-400">{lang === "zh-TW" ? "After（AEO 專文發布後）" : lang === "en" ? "After (AEO Published)" : "After（AEO 記事公開後）"}</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {lang === "zh-TW"
                ? "• 35〜65 字「精準直答區塊」直接被 AI 引用為標準解答\n• 自社網域登上 AI 引用來源連結第 1 位，獲取高意向自然流量"
                : lang === "en"
                ? "• 35–65 word direct-answer block directly cited in AI answer\n• Gained #1 citation link in Google AI Overviews, driving high-intent traffic"
                : "• 35〜65文字の「直答ブロック」が AI 回答文にそのまま引用\n• AI ソースリンク（1位）に自社ドメインが掲載され、検索流入を獲得"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
