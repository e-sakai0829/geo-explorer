"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const { lang } = useLanguage();

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
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans text-xs">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="font-bold text-slate-900">
            {lang === "zh-TW" ? "Cookie 與隱私權說明" : lang === "en" ? "Cookie & Privacy Notice" : "Cookieおよび利用規約について"}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {lang === "zh-TW" 
              ? "本網站使用必要之 Cookie 以維持登入狀態與儲存語言偏好。繼續瀏覽即代表您同意我們的 "
              : lang === "en" 
              ? "We use essential cookies to maintain user sessions and store language settings. By continuing to use our service, you agree to our "
              : "当サイトではログインセッションの維持および言語設定の保持のために必要最小限のCookieを使用しています。詳細は "}
            <Link href="/privacy" className="text-indigo-600 underline font-semibold">
              {lang === "zh-TW" ? "隱私權政策" : lang === "en" ? "Privacy Policy" : "プライバシーポリシー"}
            </Link>
            {lang === "ja" ? " をご確認ください。" : "."}
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleAccept}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              {lang === "zh-TW" ? "同意" : lang === "en" ? "Accept" : "同意する"}
            </button>
            <button
              onClick={handleDecline}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {lang === "zh-TW" ? "關閉" : lang === "en" ? "Close" : "閉じる"}
            </button>
          </div>
        </div>
        <button
          onClick={handleDecline}
          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
