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
          setBrandName(data.project.name || "自社ブランド");
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
      beforeStatus: "未言及・他社メディア占有",
      afterStatus: "インデックス・AI学習待ち (要再スキャン)",
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
          targetLocale: "ja",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "再検証スキャンに失敗しました。");

      const updated = trackedItems.map((t) => {
        if (t.id === item.id) {
          return {
            ...t,
            status: "verified",
            lastScannedAt: new Date().toISOString(),
            afterStatus: data.brandCited ? "🟢 自社URL参照を獲得！" : "🟡 言及認知あり (引用奪還へ向けて継続補強)",
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
          生成・公開した AEO 直答記事が、Google AI Overviews に引用・推薦されるまでの時系列推移を追跡・効果検証します
        </p>
      </div>

      {/* 1. 公開済み AEO記事 URL 登録フォーム (新規構築) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
            <ExternalLink className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">🔗 公開済み AEO記事（自社URL）の登録</h3>
            <p className="text-[11px] text-slate-400">自社オウンドメディアやWebサイトに公開した記事のURLを登録して効果測定を開始します</p>
          </div>
        </div>

        <form onSubmit={handleRegisterUrl} className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          <div className="md:col-span-5 space-y-1">
            <label className="block font-bold text-slate-700">対策ターゲットKW (プロンプト) <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="例: パーパスブランディング 費用 比較"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-5 space-y-1">
            <label className="block font-bold text-slate-700">公開した記事の自社URL <span className="text-rose-500">*</span></label>
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
              <span>URLを登録</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* 2. Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">公開・トラッキング中記事</div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {trackedItems.length} <span className="text-xs font-normal text-slate-400">本</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {trackedItems.length > 0 ? "自社ドメインの公開記事を監視中" : "記事URLを登録すると自動集計されます"}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">AI Overviews 引用獲得率</div>
          <div className="text-3xl font-black text-indigo-600 tracking-tight">
            {trackedItems.length > 0 
              ? `${Math.round((trackedItems.filter((t) => t.brandCited).length / trackedItems.length) * 100)}%` 
              : "—"}
          </div>
          <div className="text-[11px] text-slate-400">
            {trackedItems.length > 0 
              ? `獲得件数: ${trackedItems.filter((t) => t.brandCited).length} / ${trackedItems.length} 本` 
              : "URL登録後に追跡スキャンが有効化されます"}
          </div>
        </div>
      </div>

      {/* Demo Case Preview Guide (参考事例) */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-indigo-600" />
            {t.perf_best_practice}
          </span>
          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono">
            Best Practice
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-rose-800 text-[11px]">
              {lang === "zh-TW" ? "Before（施策前）" : lang === "en" ? "Before (Unoptimized)" : "Before（施策前）"}
            </div>
            <div className="text-slate-600 text-[11px] leading-relaxed">
              {lang === "zh-TW"
                ? "• AI Overviews 完全未提及自社品牌（推薦率 0%）\n• 競品品牌獨占 AI 摘要之推薦解答"
                : lang === "en"
                ? "• Zero brand mentions in AI Overviews (0% Share of Model)\n• Competitors exclusively recommended in AI summaries"
                : "• AI Overviews に自社ブランドが一切言及されない（言及率 0%）\n• 競合他社のみが AI の「おすすめ」として回答文に独占露出"}
            </div>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-emerald-800 text-[11px]">
              {lang === "zh-TW" ? "After（AEO 專文發布後）" : lang === "en" ? "After (AEO Published)" : "After（AEO 記事公開後）"}
            </div>
            <div className="text-slate-600 text-[11px] leading-relaxed">
              {lang === "zh-TW"
                ? "• 35〜65 字「精準直答區塊」直接被 AI 引用為標準解答\n• 自社網域登上 AI 引用來源連結第 1 位，獲取高意向自然流量"
                : lang === "en"
                ? "• 35–65 word direct-answer block directly cited in AI answer\n• Gained #1 citation link in Google AI Overviews, driving high-intent traffic"
                : "• 35〜65文字の「直答ブロック」が AI 回答文にそのまま引用\n• AI ソースリンク（1位）に自社ドメインが掲載され、検索流入を獲得"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
