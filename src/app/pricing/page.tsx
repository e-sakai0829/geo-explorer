"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, CreditCard, ShieldCheck, ArrowRight, Loader2, HelpCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PricingPage() {
  const { lang, t } = useLanguage();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "決済セッションの作成に失敗しました。");

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      alert("エラー: " + err.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20 font-sans antialiased text-slate-900">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold shadow-2xs border border-indigo-100">
          <Sparkles className="w-3.5 h-3.5" />
          Subscription Plans & Pricing
        </div>
        <h1 className="text-3xl font-black text-slate-950 tracking-tight">
          {t.pricing_title}
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          {t.pricing_desc}
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {/* Starter Plan */}
        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="font-bold text-slate-900 text-lg">Starter</div>
            <div className="text-3xl font-black text-slate-950 my-3">
              {lang === "zh-TW" ? "NT$ 2,190" : lang === "en" ? "$69" : "¥9,800"} 
              <span className="text-xs font-normal text-slate-500">/{lang === "zh-TW" ? "月" : lang === "en" ? "mo" : "月"}</span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              {lang === "zh-TW" ? "適合中小企業個人行銷人員・自媒體" : lang === "en" ? "For in-house marketers and single brands" : "中小企業の1人マーケター・個人メディア向け"}
            </p>
            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>30 {lang === "zh-TW" ? "提示詞追蹤 /月" : lang === "en" ? "Prompts tracked /mo" : "プロンプト追跡 /月"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>5 {lang === "zh-TW" ? "篇 AEO 文章生成 /月" : lang === "en" ? "AEO Articles /mo" : "本 AEO記事生成 /月"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{lang === "zh-TW" ? "引用差距 ＆ 擴展查詢提取" : lang === "en" ? "Citation gaps & Fan-out extraction" : "引用ギャップ・ファンアウト抽出"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{lang === "zh-TW" ? "標準 Email 技術支援" : lang === "en" ? "Standard Email Support" : "メールサポート"}</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => handleSubscribe("starter")}
            disabled={loadingPlan === "starter"}
            className="mt-8 w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loadingPlan === "starter" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {lang === "zh-TW" ? "訂閱 Starter 方案" : lang === "en" ? "Get Starter" : "Starter を申し込む"}
          </button>
        </div>

        {/* Growth Plan (Popular) */}
        <div className="bg-white p-7 rounded-3xl border-2 border-indigo-600 shadow-xl relative -translate-y-1 flex flex-col justify-between">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3.5 py-0.5 rounded-full shadow-md">
            {lang === "zh-TW" ? "最受歡迎 No.1" : lang === "en" ? "Most Popular" : "人気 No.1"}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-lg">Growth</div>
            <div className="text-3xl font-black text-slate-950 my-3">
              {lang === "zh-TW" ? "NT$ 6,590" : lang === "en" ? "$199" : "¥29,800"} 
              <span className="text-xs font-normal text-slate-500">/{lang === "zh-TW" ? "月" : lang === "en" ? "mo" : "月"}</span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              {lang === "zh-TW" ? "適合專任行銷團隊・快速成長型企業" : lang === "en" ? "For marketing teams and growing brands" : "専任マーケ部門・中堅成長企業向け"}
            </p>
            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>150 {lang === "zh-TW" ? "提示詞追蹤 /月" : lang === "en" ? "Prompts tracked /mo" : "プロンプト追跡 /月"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>25 {lang === "zh-TW" ? "篇 AEO 文章生成 /月" : lang === "en" ? "AEO Articles /mo" : "本 AEO記事生成 /月"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{lang === "zh-TW" ? "每週自動定期監測 ＆ 成效追蹤" : lang === "en" ? "Weekly auto-monitoring & tracker" : "週次自動定点観測 & 効果測定"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{lang === "zh-TW" ? "優先客服支援" : lang === "en" ? "Priority Support" : "優先サポート"}</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => handleSubscribe("growth")}
            disabled={loadingPlan === "growth"}
            className="mt-8 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loadingPlan === "growth" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {lang === "zh-TW" ? "訂閱 Growth 方案" : lang === "en" ? "Get Growth" : "Growth を申し込む"}
          </button>
        </div>

        {/* Agency Plan */}
        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="font-bold text-slate-900 text-lg">Agency</div>
            <div className="text-3xl font-black text-slate-950 my-3">
              {lang === "zh-TW" ? "NT$ 17,900" : lang === "en" ? "$499" : "¥79,800"} 
              <span className="text-xs font-normal text-slate-500">/{lang === "zh-TW" ? "月" : lang === "en" ? "mo" : "月"}</span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              {lang === "zh-TW" ? "適合 SEO/數位代理商・顧問公司" : lang === "en" ? "For SEO agencies and consulting firms" : "SEO代理店・Webコンサルティング企業向け"}
            </p>
            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>500 {lang === "zh-TW" ? "提示詞追蹤 /月" : lang === "en" ? "Prompts tracked /mo" : "プロンプト追跡 /月"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100 {lang === "zh-TW" ? "篇 AEO 文章生成 /月" : lang === "en" ? "AEO Articles /mo" : "本 AEO記事生成 /月"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{lang === "zh-TW" ? "自訂品牌 Logo 白標報告匯出" : lang === "en" ? "Custom White-label Reports" : "自社ロゴ入りホワイトラベル出力"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{lang === "zh-TW" ? "專屬客戶經理與 SLA 保證" : lang === "en" ? "Dedicated Account Manager & SLA" : "専任担当者 & SLA"}</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => handleSubscribe("agency")}
            disabled={loadingPlan === "agency"}
            className="mt-8 w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loadingPlan === "agency" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {lang === "zh-TW" ? "訂閱 Agency 方案" : lang === "en" ? "Get Agency" : "Agency を申し込む"}
          </button>
        </div>
      </div>
    </div>
  );
}
