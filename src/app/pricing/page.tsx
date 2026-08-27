"use client";

import { useState } from "react";
import { Check, Sparkles, ShieldCheck, Zap, Building2, HelpCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter（ライト）",
    price: "¥9,800",
    period: "/ 月",
    description: "中小企業の1人マーケター・個人メディア運営者向け",
    highlight: false,
    credits: "30 プロンプト / 月",
    articles: "AEO記事生成 5本 / 月",
    features: [
      "自社ドメイン登録: 1 サイト",
      "プロンプト調査 & ファンアウト抽出",
      "競合言及・引用ギャップ分析",
      "35〜65文字直答 AEO記事生成",
      "AI引用メディア分析 (Top 10)",
      "メールサポート",
    ],
    buttonText: "Starter を契約する",
    current: false,
  },
  {
    name: "Growth（スタンダード）",
    price: "¥29,800",
    period: "/ 月",
    description: "専任マーケ部門・中堅成長企業向け（一番人気）",
    highlight: true,
    credits: "150 プロンプト / 月",
    articles: "AEO記事生成 25本 / 月",
    features: [
      "自社ドメイン登録: 3 サイト",
      "週次自動定点観測 & シェア推移グラフ",
      "競合の新規引用アラート通知",
      "クローズドループ効果測定 (Before/After)",
      "AEO記事優先生成 (Thinking高速モード)",
      "操作マニュアル ＆ ナレッジベース閲覧",
    ],
    buttonText: "Growth を契約する",
    current: false,
  },
  {
    name: "Agency（エージェンシー）",
    price: "¥79,800",
    period: "/ 月",
    description: "SEO代理店・Web制作会社・コンサルティング企業向け",
    highlight: false,
    credits: "500 プロンプト / 月",
    articles: "AEO記事生成 100本 / 月",
    features: [
      "クライアントサイト登録: 無制限",
      "自社ロゴ入りホワイトラベル レポート出力 (Excel / PDF)",
      "クライアント別マルチプロジェクト管理",
      "追加クレジット購入枠 (¥5,000 / 100pt)",
      "チームメンバー招待 (最大10名)",
      "優先メールサポート",
    ],
    buttonText: "Agency を契約する",
    current: false,
  },
];

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "決済の初期化に失敗しました。");

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      alert("決済エラー: " + err.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      {/* Back Link */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          トップページに戻る
        </Link>
      </div>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200/60">
          <Sparkles className="w-3.5 h-3.5" />
          Transparent Pricing
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          料金プラン ＆ 月額サブスクリプション
        </h1>
        <p className="text-xs text-slate-500">
          初期費用0円・いつでも解約可能。Stripeによる安全なクレジットカード決済に対応しています
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((p, idx) => {
          const planKey = idx === 0 ? "starter" : idx === 1 ? "growth" : "agency";
          const isLoading = loadingPlan === planKey;

          return (
            <div
              key={idx}
              className={`rounded-2xl p-7 flex flex-col justify-between transition-all ${
                p.highlight
                  ? "bg-white border-2 border-indigo-600 shadow-xl relative -translate-y-1"
                  : "bg-white border border-slate-200/80 shadow-xs hover:border-slate-300"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-md">
                  人気 No.1 プラン
                </div>
              )}

              <div>
                <div className="text-base font-bold text-slate-900 mb-1">{p.name}</div>
                <p className="text-[11px] text-slate-400 min-h-[32px]">{p.description}</p>

                <div className="flex items-baseline gap-1 my-5 pb-5 border-b border-slate-100">
                  <span className="text-3xl font-bold text-slate-900 tracking-tight">{p.price}</span>
                  <span className="text-xs text-slate-400 font-medium">{p.period}</span>
                </div>

                {/* Highlights */}
                <div className="bg-slate-50 rounded-xl p-3.5 mb-5 space-y-1.5 border border-slate-100 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>調査クレジット:</span>
                    <span className="text-indigo-600">{p.credits}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>記事自動生成:</span>
                    <span className="text-emerald-600">{p.articles}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 text-xs text-slate-600 mb-6">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleCheckout(planKey)}
                disabled={isLoading}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                  p.highlight
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 cursor-pointer"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
                }`}
              >
                {isLoading ? "決済画面へ移動中..." : p.buttonText}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
