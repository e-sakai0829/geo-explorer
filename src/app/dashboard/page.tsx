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
import { ATSBenchmarkCard } from "@/components/ATSBenchmarkCard";
import { DynamicAdviceCard } from "@/components/DynamicAdviceCard";
import { FanoutExplorerCard } from "@/components/FanoutExplorerCard";
import { BeforeAfterTrackerCard } from "@/components/BeforeAfterTrackerCard";
import { WhiteLabelReportModal } from "@/components/WhiteLabelReportModal";
import { OutreachModal } from "@/components/OutreachModal";

export default function DashboardPage() {
  const { lang, t } = useLanguage();
  const [brandName, setBrandName] = useState("自社ブランド");
  const [domain, setDomain] = useState("https://example.com");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [credits, setCredits] = useState({ plan: "Starter", total: 10, used: 0, remaining: 10 });
  const [loading, setLoading] = useState(true);

  // モーダルのState管理
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    // プロジェクト設定の取得
    fetch("/api/user/project")
      .then((res) => res.json())
      .then((data) => {
        if (data?.project) {
          setBrandName(data.project.name || (lang === "zh-TW" ? "自社品牌" : lang === "en" ? "My Brand" : "自社ブランド"));
          setDomain(data.project.domain || "https://example.com");
          if (Array.isArray(data.project.competitors)) {
            setCompetitors(data.project.competitors);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch project:", err);
        setFetchError("プロジェクト情報の取得に失敗しました。");
      });

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
      .catch((err) => {
        console.error("Failed to fetch credits:", err);
      })
      .finally(() => setLoading(false));
  }, [lang]);

  const shareOfModel = credits.used > 0 ? 35 : 0;
  const citationRate = credits.used > 0 ? 25 : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans antialiased text-slate-900">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Bot className="w-4 h-4 shrink-0" />
            GEO Visibility Overview
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
            {lang === "zh-TW" 
              ? `${brandName} 之 AI 搜尋曝光儀表板` 
              : lang === "en" 
              ? `${brandName} AI Search Visibility Dashboard` 
              : `${brandName} の AI検索露出ダッシュボード`}
          </h1>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {lang === "zh-TW" ? "目標網域: " : lang === "en" ? "Domain: " : "対象ドメイン: "}
            <strong className="text-slate-800">{domain}</strong> | 
            {lang === "zh-TW" ? " 追蹤競品: " : lang === "en" ? " Competitors: " : " 追跡競合: "}
            <span className="text-slate-800 font-medium">
              {competitors.length > 0 ? competitors.join(", ") : (lang === "zh-TW" ? "未設定" : lang === "en" ? "None" : "未設定")}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <span>⚙️ 競合設定</span>
          </Link>
          <Link
            href="/prompts"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5" />
            <span>スキャン</span>
          </Link>
        </div>
      </div>

      {/* Error Alert Banner */}
      {fetchError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{fetchError}設定画面より情報を再設定してください。</span>
        </div>
      )}

      {/* Prominent Project Onboarding Banner */}
      {(domain.includes("example.com") || brandName === "自社ブランド" || competitors.length === 0) && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-500/30 relative overflow-hidden">
          <div className="space-y-2 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-[11px] font-bold border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              ステップ 1：より精密なAI検索露出診断のために
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              自社サイトURLと競合ブランドを登録して、AI言及・引用シェア率を正確に測定しましょう！
            </h2>
          </div>

          <Link
            href="/settings"
            className="px-6 py-3 bg-white hover:bg-indigo-50 text-indigo-900 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer relative z-10"
          >
            <span>自社サイト・競合を今すぐ登録する</span>
            <ArrowRight className="w-4 h-4 text-indigo-600" />
          </Link>
        </div>
      )}

      {/* 3 Core KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>自社 AI-Trust Score (ATS)</span>
            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold">
              独自信頼指標
            </span>
          </div>
          <div className="text-3xl font-black text-indigo-600 tracking-tight">
            {credits.used > 0 ? 42 : 0} <span className="text-sm font-normal text-slate-400">/ 100 pt</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {credits.used > 0 ? "競合最高(78pt)とのギャップ: -36pt ⚠️" : "プロンプトスキャン後に自動算出"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{t.dash_kpi_citations}</span>
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
              {lang === "zh-TW" ? "引用比例" : lang === "en" ? "Cited Rate" : "被引用率"}
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">
            {citationRate}%
          </div>
          <p className="text-[11px] text-slate-400">
            {credits.used > 0 ? "Google AIO ソースリンクへの掲載率" : t.dash_kpi_citations_desc}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{t.dash_kpi_credits}</span>
            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">{credits.plan}</span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {credits.remaining} <span className="text-sm font-normal text-slate-500">/ {credits.total} pt</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {t.dash_kpi_credits_desc} {credits.used} pt
          </p>
        </div>
      </div>

      {/* ATS Benchmark & Dynamic Advice Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ATSBenchmarkCard
            targetBrand={brandName}
            data={[
              { brandName: brandName, isTarget: true, atsScore: 42, directScore: 15, citationScore: 15, fanoutScore: 12 },
              { brandName: competitors[0] || '競合A社', isTarget: false, atsScore: 78, directScore: 35, citationScore: 28, fanoutScore: 15 },
              { brandName: competitors[1] || '競合B社', isTarget: false, atsScore: 65, directScore: 28, citationScore: 22, fanoutScore: 15 }
            ]}
            gapDiagnosis="自社は「一次情報ソース露出度」で競合A社に13ptの差をつけられています。主要比較メディアへの掲載が不十分です。"
            onExplorePrompts={() => setIsReportModalOpen(true)}
          />
        </div>

        <div>
          <DynamicAdviceCard
            advice={{
              primary_source_type: 'specialized_and_comparison',
              top_influential_media: ['it-trend.jp', 'boxil.jp'],
              gap_pattern: 'source_exposure_lack',
              diagnosis_summary: 'AIは「it-trend.jp, boxil.jp」の専門比較メディアを参照しています。自社が未掲載のため競合A社(78pt)に遅れをとっています。',
              recommended_actions: [
                { priority: 'HIGH', action_type: 'external_listing', title: 'it-trend.jp / boxil.jp への掲載手続き', description: 'AIが最優先参照している比較メディアへの掲載有無を確認しリクエストを実行してください。' },
                { priority: 'MEDIUM', action_type: 'content_rewrite', title: '掲載テキストの35-65文字直答化', description: 'メディア上の概要欄文章をAIが要約しやすいアンサー形式にリライトしてください。' }
              ]
            }}
            onGenerateAEOArticle={() => setIsOutreachModalOpen(true)}
          />
        </div>
      </div>

      {/* 【機能 1】 Before / After 成果自動トラッカー (解約率低減) */}
      <BeforeAfterTrackerCard
        items={[
          {
            id: '1',
            promptText: '営業DX ツール おすすめ 中小企業',
            articleTitle: '中小企業向け営業DXツールの選び方と費用相場',
            publishedAt: '2026-08-05',
            beforeATS: 20,
            afterATS: 75,
            status: 'achieved'
          },
          {
            id: '2',
            promptText: 'パーパスブランディング 会社 比較',
            articleTitle: 'パーパスブランディング支援企業の失敗しない選び方',
            publishedAt: '2026-08-18',
            beforeATS: 42,
            afterATS: 68,
            status: 'achieved'
          }
        ]}
      />

      {/* Fan-out Exploration Card */}
      <FanoutExplorerCard
        fanoutQueries={[
          "営業DX ツール 中小企業 費用相場",
          "SFA CRM 連携 営業DX おすすめ",
          "営業DX 導入 失敗事例 と対策",
          "営業DX ツール 無料お試し あり"
        ]}
        coveredQueries={["営業DX ツール 無料お試し あり"]}
        onInvestigateFanout={(q) => alert(`サブクエリ「${q}」の競合比較分析を実行します（1クレジット消費）`)}
      />

      {/* Main Action Banner / Onboarding */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-8 rounded-3xl border border-indigo-100/80 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-indigo-700 rounded-full text-xs font-bold shadow-2xs border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5" />
            GEO 最適化アクション
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {brandName} のAI露出・引用率向上アクション
          </h2>
          <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
            クエリファンアウトに最適化されたAEO直答記事を生成してAIに選ばれるWebサイトを目指しましょう。
          </p>
        </div>

        <Link
          href="/prompts"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          <span>今すぐスキャンを実行</span>
        </Link>
      </div>

      {/* Modals Integration */}
      <WhiteLabelReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        projectName={brandName}
        targetBrand={brandName}
        targetDomain={domain}
        competitors={competitors}
        atsScore={42}
      />

      <OutreachModal
        isOpen={isOutreachModalOpen}
        onClose={() => setIsOutreachModalOpen(false)}
        targetBrand={brandName}
        targetDomain={domain}
        mediaName="it-trend.jp, boxil.jp"
        outreachType="listing_request"
      />
    </div>
  );
}
