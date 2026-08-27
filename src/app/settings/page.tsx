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

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("sakai@traditionalart.biz");
  const [targetBrand, setTargetBrand] = useState("Ailo");
  const [targetDomain, setTargetDomain] = useState("https://ailo.jp");
  const [competitors, setCompetitors] = useState("Speak, プログリット, DMM英会話, ビズメイツ");
  const [saved, setSaved] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    });
  }, [supabase]);

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

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
          アカウント設定 ＆ サブスクリプション管理
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          アカウント情報、契約中のプラン、クレジットカード変更、領収書発行、解約手続き
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
              <h2 className="text-sm font-bold text-slate-900">ログインアカウント</h2>
              <p className="text-xs text-slate-500">{userEmail}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-colors border border-rose-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            ログアウト
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">メールアドレス</label>
            <input
              type="text"
              value={userEmail}
              disabled
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">アカウント権限</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>オーナー (Owner)</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono">管理者</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Subscription & Self-Serve Cancellation (Stripe Portal) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">契約中のサブスクリプション</h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                契約中 (Active)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              いつでもワンクリックでプラン変更または解約が可能です
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              プランを変更
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500 mb-1">現在のプラン</div>
            <div className="text-base font-bold text-slate-900">Starter プラン</div>
            <div className="text-xs text-indigo-600 font-semibold mt-0.5">¥9,800 / 月</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500 mb-1">今月の残りクレジット</div>
            <div className="text-base font-bold text-slate-900">24 / 30 クエリ</div>
            <div className="text-[11px] text-slate-400 mt-0.5">次回リセット: 2026-09-27</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500 mb-1">記事生成残り枠</div>
            <div className="text-base font-bold text-emerald-600">4 / 5 本</div>
            <div className="text-[11px] text-slate-400 mt-0.5">35-65文字直答生成</div>
          </div>
        </div>

        {/* Self-Serve Cancellation & Billing Actions */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-slate-600" />
              請求・カード変更・解約手続き
            </div>
            <p className="text-[11px] text-slate-500">
              クレジットカードの変更、領収書（インボイスPDF）の発行、サブスクリプションの自動更新停止（解約）
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
            Stripe 請求・解約ポータル
          </button>
        </div>

        {/* Cancellation Notice Banner */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>解約に関するポリシー:</strong> 解約ボタンを押した場合でも、既に支払われた当月の請求期間末日（次回更新日）までは引き続きすべての機能をご利用いただけます。違約金等は一切発生いたしません。
          </div>
        </div>
      </div>

      {/* 3. Project Configuration */}
      <form onSubmit={handleSaveProject} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">追跡プロジェクト設定</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            AI検索で自社として判定するブランド名と、追跡対象の競合リストを設定します
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                自社ブランド名 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={targetBrand}
                onChange={(e) => setTargetBrand(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                自社WebサイトURL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              追跡する競合ブランドリスト（カンマ区切り）
            </label>
            <input
              type="text"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              AI検索の回答文中にこれらの競合名が登場した際、競合シェアとして自動集計されます。
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
            {saved && (
              <>
                <Check className="w-4 h-4" />
                プロジェクト設定を保存しました
              </>
            )}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            設定を保存する
          </button>
        </div>
      </form>
    </div>
  );
}
