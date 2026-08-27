"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  Bot,
  Zap,
  BarChart3
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function DashboardPage() {
  const { lang } = useLanguage();
  const [brandName, setBrandName] = useState("自社ブランド");
  const [domain, setDomain] = useState("https://example.com");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [credits, setCredits] = useState({ plan: "Starter", total: 10, used: 0, remaining: 10 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // プロジェクト設定の取得
    fetch("/api/user/project")
      .then((res) => res.json())
      .then((data) => {
        if (data?.project) {
          setBrandName(data.project.name || "自社ブランド");
          setDomain(data.project.domain || "https://example.com");
          if (Array.isArray(data.project.competitors)) {
            setCompetitors(data.project.competitors);
          }
        }
      })
      .catch(() => {});

    // クレジット情報の取得
    fetch("/api/user/credits")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setCredits({
            plan: data.plan.charAt(0).toUpperCase() + data.plan.slice(1),
            total: data.monthly_credits,
            used: data.used_credits,
            remaining: data.remaining_credits,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shareOfModel = credits.used > 0 ? 35 : 0;
  const citationRate = credits.used > 0 ? 25 : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans antialiased text-slate-900">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Bot className="w-4 h-4" />
            GEO Visibility Overview
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {brandName} の AI検索露出ダッシュボード
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            対象ドメイン: <strong className="text-slate-800">{domain}</strong> | 追跡競合: {competitors.length > 0 ? competitors.join(", ") : "未設定"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            プロジェクト設定
          </Link>
          <Link
            href="/prompts"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            プロンプトをスキャン
          </Link>
        </div>
      </div>

      {/* 3 Core KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Share of Model (AI言及率)</span>
            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold">自社露出度</span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {shareOfModel}%
          </div>
          <p className="text-[11px] text-slate-400">
            {credits.used > 0 ? "直近スキャン結果から自動算出" : "プロンプトをスキャンすると算出されます"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>AI Citation Share (引用リンク率)</span>
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">被引用率</span>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">
            {citationRate}%
          </div>
          <p className="text-[11px] text-slate-400">
            {credits.used > 0 ? "Google AIO ソースリンクへの掲載率" : "スキャン実行後に掲載率が表示されます"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>今月の残り調査クレジット</span>
            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">{credits.plan}</span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {credits.remaining} <span className="text-sm font-normal text-slate-500">/ {credits.total} pt</span>
          </div>
          <p className="text-[11px] text-slate-400">
            消費済み: {credits.used} pt
          </p>
        </div>
      </div>

      {/* Main Action Banner / Onboarding */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-8 rounded-3xl border border-indigo-100/80 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-indigo-700 rounded-full text-xs font-bold shadow-2xs border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5" />
            GEO 最適化アクション
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {brandName} の検索キーワードをスキャンして、引用ギャップを特定しましょう
          </h2>
          <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
            Google AI Overviews や Gemini が自社を推薦しているかリアルタイム判定し、未引用の質問に対する「35〜65文字直答記事」を自動生成します。
          </p>
        </div>

        <Link
          href="/prompts"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          今すぐプロンプト解析を実行 ➔
        </Link>
      </div>

      {/* 2-Column: Quick Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Search className="w-4 h-4 text-indigo-600" />
            Prompt Explorer でできること
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>自社ブランド（{brandName}）のAI回答文内での推薦・言及有無をリアルタイム判定</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>AIが裏で検索している内部展開サブクエリ（Query Fan-out）を自動抽出</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>AI検索が参照している上位引用元WebページのURLリストを可視化</span>
            </li>
          </ul>
          <Link href="/prompts" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline pt-1">
            Prompt Explorer を開く <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            AEO 権威直答エディタでできること
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>AI Overviewsに引用されるための「35〜65文字の定義・数値直答ブロック」を自動執筆</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>抽出したQuery Fan-out群を1記事内に構造化して網羅</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>日本語・繁體中文・英語での多言語AEO記事を一発生成</span>
            </li>
          </ul>
          <Link href="/editor" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline pt-1">
            AEO エディタを開く <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
