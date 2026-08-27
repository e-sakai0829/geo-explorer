"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import CookieBanner from "@/components/CookieBanner";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { Language } from "@/lib/i18n";
import { ChevronDown } from "lucide-react";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/legal";

  const { lang, setLang, t } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: "ja", name: "日本語 (JP)", flag: "🇯🇵" },
    { code: "zh-TW", name: "繁體中文 (TW/HK)", flag: "🇹🇼" },
    { code: "en", name: "English (US)", flag: "🇺🇸" },
  ];

  const selectedLang = languages.find((l) => l.code === lang) || languages[0];

  if (isFullPage) {
    return (
      <div className="min-h-screen w-full bg-white">
        {children}
        <CookieBanner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 antialiased font-sans">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top global header for App */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">
              {lang === "zh-TW" ? "專案:" : lang === "en" ? "Project:" : "プロジェクト:"}
            </span>
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              Ailo（AI英会話）- https://ailo.jp
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <span>{selectedLang.flag}</span>
                <span>{selectedLang.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 animate-in fade-in">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                    >
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200/60 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Gemini 3.7 Flash {lang === "zh-TW" ? "運行中" : lang === "en" ? "Online" : "稼働中"}
            </div>

            <span className="text-slate-300">|</span>

            <span className="text-slate-500">
              {lang === "zh-TW" ? "剩餘額度: " : lang === "en" ? "Credits: " : "残り枠: "}
              <strong className="text-slate-800">24 / 30 クエリ</strong>
            </span>
          </div>
        </header>

        {/* Main App Content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
      <CookieBanner />
    </div>
  );
}

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <LayoutInner>{children}</LayoutInner>
    </LanguageProvider>
  );
}
