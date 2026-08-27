"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, Check, X } from "lucide-react";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-800 space-y-3 font-sans text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-100">
          <Cookie className="w-4 h-4 text-indigo-400" />
          <span>Cookie および プライバシーポリシーについて</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          当サイトでは、サービスの向上、トラフィック分析（GA4）、および最適な体験を提供するためにCookieを使用しています。詳細は
          <Link href="/privacy" className="text-indigo-400 underline ml-1 hover:text-indigo-300">
            プライバシーポリシー (GDPR対応)
          </Link>
          をご確認ください。
        </p>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAccept}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            同意する
          </button>
          <button
            onClick={handleDecline}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all cursor-pointer"
          >
            拒否する
          </button>
        </div>
      </div>
    </div>
  );
}
