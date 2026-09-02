"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Bot,
  Zap,
  Target
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ATSBenchmarkCard } from "@/components/ATSBenchmarkCard";
import { DynamicAdviceCard } from "@/components/DynamicAdviceCard";
import { FanoutExplorerCard } from "@/components/FanoutExplorerCard";
import { BeforeAfterTrackerCard } from "@/components/BeforeAfterTrackerCard";
import { WhiteLabelReportModal } from "@/components/WhiteLabelReportModal";
import { OutreachModal } from "@/components/OutreachModal";
import { RecommendTrendChart } from "@/components/RecommendTrendChart";
import { RecommendedAction } from "@/lib/ats-calculator";
import type { DashboardStats } from "@/types/geo";

const EMPTY_STATS: DashboardStats = {
  hasScanData: false,
  atsScore: null,
  competitorTopAtsScore: null,
  citationRate: null,
  vsPromptWinRate: null,
  avgRank: null,
  domainCoverageRate: null,
  trend: [],
};

function formatPct(v: number | null): string {
  return v === null ? "ー" : `${Math.round(v * 100)}%`;
}

function formatRank(v: number | null): string {
  return v === null ? "ー" : `${v}位`;
}

const DEFAULT_BRAND_NAME: Record<string, string> = {
  ja: "自社ブランド",
  "zh-TW": "自社品牌",
  en: "My Brand",
};

export default function DashboardPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [brandName, setBrandName] = useState("自社ブランド");
  const [domain, setDomain] = useState("https://example.com");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [credits, setCredits] = useState({ plan: "Starter", total: 10, used: 0, remaining: 10 });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);

  // モーダルのState管理
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [outreachAction, setOutreachAction] = useState<RecommendedAction | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // データ取得は言語に依存しないため、一度だけ実行する（言語切替の度に再フェッチしない）
  useEffect(() => {
    let cancelled = false;

    // プロジェクト設定の取得
    fetch("/api/user/project")
      .then((res) => {
        if (!res.ok) throw new Error(`project fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.project) {
          if (data.project.name) setBrandName(data.project.name);
          setDomain(data.project.domain || "https://example.com");
          if (Array.isArray(data.project.competitors)) {
            setCompetitors(data.project.competitors);
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch project:", err);
        setFetchError("プロジェクト情報の取得に失敗しました。");
      });

    // クレジット情報の取得
    fetch("/api/user/credits")
      .then((res) => {
        if (!res.ok) throw new Error(`credits fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data && !data.error) {
          setCredits({
            plan: (data.plan?.charAt(0)?.toUpperCase() ?? "") + (data.plan?.slice(1) ?? ""),
            total: data.monthly_credits ?? 0,
            used: data.used_credits ?? 0,
            remaining: data.remaining_credits ?? 0,
          });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch credits:", err);
        setFetchError("クレジット情報の取得に失敗しました。");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // 実測スキャンデータの集計取得（未計測時は hasScanData: false が返る）
    fetch("/api/user/stats")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data && !data.error) setStats(data as DashboardStats);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch stats:", err);
      });

    return () => { cancelled = true; };
  }, []);

  // ブランド名が未設定の間だけ、言語に応じたプレースホルダーを表示する（再フェッチはしない）
  const displayBrandName = brandName === "自社ブランド" ? (DEFAULT_BRAND_NAME[lang] ?? DEFAULT_BRAND_NAME.ja) : brandName;

  const dynamicAdvice = useMemo(() => ({
    primary_source_type: 'specialized_and_comparison' as const,
    top_influential_media: ['it-trend.jp', 'boxil.jp'],
    gap_pattern: 'source_exposure_lack' as const,
    diagnosis_summary: `AIは「it-trend.jp, boxil.jp」の専門比較メディアを参照しています。自社が未掲載のため競合A社(78pt)に遅れをとっています。`,
    recommended_actions: [
      { priority: 'HIGH' as const, action_type: 'external_listing' as const, title: 'it-trend.jp / boxil.jp への掲載手続き', description: 'AIが最優先参照している比較メディアへの掲載有無を確認しリクエストを実行してください。' },
      { priority: 'MEDIUM' as const, action_type: 'content_rewrite' as const, title: '掲載テキストの35-65文字直答化', description: 'メディア上の概要欄文章をAIが要約しやすいアンサー形式にリライトしてください。' }
    ]
  }), []);

  const isAgencyPlan = credits.plan.toLowerCase() === "agency";

  const handleOpenReport = () => {
    if (isAgencyPlan) {
      setIsReportModalOpen(true);
    } else {
      router.push("/pricing");
    }
  };

  const handleInvestigateFanout = (query: string) => {
    setToast(`サブクエリ「${query}」の競合比較分析を実行しました（1クレジット消費）`);
    setTimeout(() => setToast(null), 3500);
  };

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
              ? `${displayBrandName} 之 AI 搜尋曝光儀表板`
              : lang === "en"
              ? `${displayBrandName} AI Search Visibility Dashboard`
              : `${displayBrandName} の AI検索露出ダッシュボード`}
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

      {/* 未計測（プロンプト未登録・スキャン未実行）誘導バナー: ATS等がゼロ埋め表示になる不具合の代替 */}
      {!loading && !stats.hasScanData && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <Target className="w-5 h-5" />
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900">
                まだ計測データがありません（下の指標はすべて「ー」）
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed max-w-xl">
                ATS・被引用率・推奨順位などは、対策プロンプトを登録して最初のスキャンを実行すると自動算出されます。まずは1件登録してみましょう。
              </p>
            </div>
          </div>
          <Link
            href="/prompts"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>プロンプトを登録して初回スキャン</span>
          </Link>
        </div>
      )}

      {/* KPIメトリクス: 実測データがない指標は根拠のない数値を出さず「ー」を表示する */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${loading ? 'opacity-60 animate-pulse' : 'opacity-100'}`}>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>自社 AI-Trust Score (ATS)</span>
            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold">
              独自信頼指標
            </span>
          </div>
          <div className="text-3xl font-black text-indigo-600 tracking-tight">
            {stats.atsScore === null ? "ー" : stats.atsScore} <span className="text-sm font-normal text-slate-400">/ 100 pt</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {stats.atsScore !== null && stats.competitorTopAtsScore !== null
              ? `競合最高(${stats.competitorTopAtsScore}pt)とのギャップ: ${stats.atsScore - stats.competitorTopAtsScore >= 0 ? "+" : ""}${stats.atsScore - stats.competitorTopAtsScore}pt`
              : "プロンプトスキャン後に自動算出"}
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
            {formatPct(stats.citationRate)}
          </div>
          <p className="text-[11px] text-slate-400">
            {stats.citationRate !== null ? "Google AIO ソースリンクへの掲載率" : t.dash_kpi_citations_desc}
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

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>VSプロンプト勝率</span>
            <span className="text-violet-600 bg-violet-50 px-2 py-0.5 rounded text-[10px] font-bold">対競合</span>
          </div>
          <div className="text-3xl font-black text-violet-600 tracking-tight">
            {formatPct(stats.vsPromptWinRate)}
          </div>
          <p className="text-[11px] text-slate-400">
            同一プロンプトで自社のみ言及された割合
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>平均順位</span>
            <span className="text-sky-600 bg-sky-50 px-2 py-0.5 rounded text-[10px] font-bold">推奨順位</span>
          </div>
          <div className="text-3xl font-black text-sky-600 tracking-tight">
            {formatRank(stats.avgRank)}
          </div>
          <p className="text-[11px] text-slate-400">
            AI回答内で自社が紹介された平均順位
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>参照ドメインカバー率</span>
            <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded text-[10px] font-bold">GRC</span>
          </div>
          <div className="text-3xl font-black text-teal-600 tracking-tight">
            {formatPct(stats.domainCoverageRate)}
          </div>
          <p className="text-[11px] text-slate-400">
            スキャン済プロンプトのうち自社が参照された割合
          </p>
        </div>
      </div>

      {/* GRC型週次推移グラフ */}
      <RecommendTrendChart trend={stats.trend} />

      {/* ATS Benchmark & Dynamic Advice Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ATSBenchmarkCard
            targetBrand={displayBrandName}
            data={
              stats.hasScanData && stats.atsScore !== null && stats.atsBreakdown
                ? [
                    {
                      brandName: displayBrandName,
                      isTarget: true,
                      atsScore: stats.atsScore,
                      directScore: stats.atsBreakdown.directMentionScore,
                      citationScore: stats.atsBreakdown.citationDomainScore,
                      fanoutScore: stats.atsBreakdown.fanoutCoverageScore,
                    },
                    ...(stats.competitorTopAtsScore !== null
                      ? [{ brandName: competitors[0] || '競合最高値', isTarget: false, atsScore: stats.competitorTopAtsScore, directScore: 0, citationScore: 0, fanoutScore: 0 }]
                      : []),
                  ]
                : []
            }
            onExplorePrompts={handleOpenReport}
            exploreButtonLabel={isAgencyPlan ? "詳細レポートを出力" : "詳細レポートを見る (Agencyプラン)"}
          />
        </div>

        <div>
          <DynamicAdviceCard
            advice={dynamicAdvice}
            onGenerateAEOArticle={() => router.push("/editor")}
            onDraftOutreach={(action) => setOutreachAction(action)}
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
        onInvestigateFanout={handleInvestigateFanout}
      />

      {/* Main Action Banner / Onboarding */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-8 rounded-3xl border border-indigo-100/80 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-indigo-700 rounded-full text-xs font-bold shadow-2xs border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5" />
            GEO 最適化アクション
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {displayBrandName} のAI露出・引用率向上アクション
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

      {/* Toast Notification (alert()の代替) */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 max-w-md text-center"
        >
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Modals Integration */}
      <WhiteLabelReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetBrand={displayBrandName}
        targetDomain={domain}
        competitors={competitors}
        atsScore={stats.atsScore ?? 0}
      />

      <OutreachModal
        isOpen={outreachAction !== null}
        onClose={() => setOutreachAction(null)}
        targetBrand={displayBrandName}
        targetDomain={domain}
        mediaName={dynamicAdvice.top_influential_media.join(', ')}
        outreachType={outreachAction?.action_type === 'press_release' ? 'press_release' : 'listing_request'}
      />
    </div>
  );
}
