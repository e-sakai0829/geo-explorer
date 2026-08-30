"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { 
  Settings, 
  User, 
  CreditCard, 
  ShieldCheck, 
  LogOut, 
  Building2, 
  Mail, 
  ExternalLink, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Globe, 
  AlertTriangle, 
  FileText, 
  Loader2 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { lang, t } = useLanguage();
  const [userEmail, setUserEmail] = useState<string>("");
  const [targetBrand, setTargetBrand] = useState("自社ブランド");
  const [targetDomain, setTargetDomain] = useState("https://example.com");
  const [competitors, setCompetitors] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [credits, setCredits] = useState({ plan: "Starter", total: 10, used: 0, remaining: 10, resetAt: "2026-09-27" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    });

    // DBからプロジェクト設定を取得
    fetch("/api/user/project")
      .then((res) => res.json())
      .then((data) => {
        if (data?.project) {
          setTargetBrand(data.project.name || (lang === "zh-TW" ? "自社品牌" : lang === "en" ? "My Brand" : "自社ブランド"));
          setTargetDomain(data.project.domain || "https://example.com");
          setCompetitors(
            Array.isArray(data.project.competitors) && data.project.competitors.length > 0
              ? data.project.competitors.join(", ")
              : ""
          );
        }
      })
      .catch(() => {});

    // DBからクレジット残高を取得
    fetch("/api/user/credits")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setCredits({
            plan: data.plan.charAt(0).toUpperCase() + data.plan.slice(1),
            total: data.monthly_credits,
            used: data.used_credits,
            remaining: data.remaining_credits,
            resetAt: data.credits_reset_at ? new Date(data.credits_reset_at).toLocaleDateString(lang === "zh-TW" ? "zh-TW" : lang === "en" ? "en-US" : "ja-JP") : "2026-09-27",
          });
        }
      })
      .catch(() => {});
  }, [supabase, lang]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleOpenStripePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "請求ポータルの起動に失敗しました。");

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      alert("請求ポータル接続エラー: " + err.message);
    } finally {
      setPortalLoading(false);
    }
  };

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/user/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: targetBrand,
          domain: targetDomain,
          competitors: competitors.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "設定の保存に失敗しました。");

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20 font-sans antialiased text-slate-900">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <Settings className="w-3.5 h-3.5" />
          Account & Subscription Settings
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t.set_title}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t.set_desc}
        </p>
      </div>

      {/* 1. Account Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{t.set_account_title}</h2>
              <p className="text-xs text-slate-500">{userEmail || "未設定"}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-colors border border-rose-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t.logout}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">{t.set_email_label}</label>
            <input
              type="text"
              value={userEmail}
              disabled
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              {lang === "zh-TW" ? "帳戶權限" : lang === "en" ? "Role" : "アカウント権限"}
            </label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>{lang === "zh-TW" ? "擁有者 (Owner)" : lang === "en" ? "Owner" : "オーナー (Owner)"}</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono">
                {lang === "zh-TW" ? "管理員" : lang === "en" ? "Admin" : "管理者"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Subscription & Self-Serve Cancellation (Stripe Portal) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">{t.set_sub_title}</h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {t.active}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "zh-TW" 
                ? "可隨時透過 Stripe 平台一鍵變更方案或取消自動續訂" 
                : lang === "en" 
                ? "Manage your subscription, update cards, or cancel anytime" 
                : "いつでもワンクリックでプラン変更または解約が可能です"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t.upgrade}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500 mb-1">{t.set_current_plan}</div>
            <div className="text-base font-bold text-slate-900">{credits.plan}</div>
            <div className="text-xs text-indigo-600 font-semibold mt-0.5">Stripe Recurring</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500 mb-1">
              {lang === "zh-TW" ? "本月剩餘額度" : lang === "en" ? "Remaining Credits" : "今月の残りクレジット"}
            </div>
            <div className="text-base font-bold text-slate-900">{credits.remaining} / {credits.total} pt</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {lang === "zh-TW" ? "下次額度重置: " : lang === "en" ? "Renews on: " : "次回リセット: "}{credits.resetAt}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500 mb-1">
              {lang === "zh-TW" ? "已使用額度" : lang === "en" ? "Used Credits" : "消費済みクレジット"}
            </div>
            <div className="text-base font-bold text-emerald-600">{credits.used} pt</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Live AI API Calls</div>
          </div>
        </div>

        {/* Self-Serve Cancellation & Billing Actions */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-slate-600" />
              {lang === "zh-TW" ? "帳單、信用卡變更與解約管理" : lang === "en" ? "Billing, Invoices & Cancellation" : "請求・カード変更・解約手続き"}
            </div>
            <p className="text-[11px] text-slate-500">
              {lang === "zh-TW" 
                ? "變更信用卡、下載發票收據（PDF）、隨時取消自動續訂" 
                : lang === "en" 
                ? "Update payment method, download PDF invoices, or cancel subscription" 
                : "クレジットカードの変更、領収書（インボイスPDF）の発行、サブスクリプションの解約"}
            </p>
          </div>

          <button
            onClick={handleOpenStripePortal}
            disabled={portalLoading}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
          >
            {portalLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5" />
            )}
            {t.set_stripe_portal_btn}
          </button>
        </div>
      </div>

      {/* 3. Project Configuration (DB実保存) */}
      <form onSubmit={handleSaveProject} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">{t.set_proj_title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === "zh-TW" 
              ? "設定自社品牌名稱與追蹤競品清單（即時儲存至資料庫）" 
              : lang === "en" 
              ? "Configure your brand identity and competitor tracking list (persisted in DB)" 
              : "AI検索で自社として判定するブランド名と、追跡対象の競合リストを設定します（DB保存）"}
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {t.set_proj_brand_label} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={targetBrand}
                onChange={(e) => setTargetBrand(e.target.value)}
                placeholder="例: Traditionalart / Your Brand"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {t.set_proj_domain_label} <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                placeholder="https://example.com"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              {t.set_proj_comp_label}
            </label>
            <input
              type="text"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="例: Competitor A, Competitor B, Competitor C"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              {lang === "zh-TW" 
                ? "當 AI 搜尋回答中提及這些競品名稱時，系統將自動計算競品市佔與引用差距。" 
                : lang === "en" 
                ? "When these competitor names appear in AI search responses, competitor citation share is calculated automatically." 
                : "AI検索の回答文中にこれらの競合名が登場した際、競合シェアとして自動集計されます。"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div>
            {saved && (
              <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {t.saved}
              </div>
            )}
            {saveError && (
              <div className="text-xs text-rose-600 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{saveError}</span>
                {saveError.includes("ログイン") && (
                  <Link
                    href="/login"
                    className="ml-2 px-2.5 py-1 bg-rose-600 text-white font-bold text-[11px] rounded-lg hover:bg-rose-700 transition-colors"
                  >
                    ログインへ
                  </Link>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t.set_btn_save}
          </button>
        </div>
      </form>
    </div>
  );
}
