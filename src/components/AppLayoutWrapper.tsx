"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { ChevronDown } from "lucide-react";

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // LP（/）およびログイン画面（/login）はサイドバーなしの全画面表示
  const isFullPage = pathname === "/" || pathname === "/login";
  
  const [currentLang, setCurrentLang] = useState("ja");
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  if (isFullPage) {
    return <div className="min-h-screen w-full bg-white">{children}</div>;
  }

  const languages = [
    { code: "ja", name: "日本語 (JP)", flag: "🇯🇵" },
    { code: "zh-TW", name: "繁體中文 (TW/HK)", flag: "🇹🇼" },
    { code: "en", name: "English (US)", flag: "🇺🇸" },
  ];

  const selectedLang = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 antialiased font-sans">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top global header for App */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">プロジェクト:</span>
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              Ailo（AI英会話）- https://ailo.jp
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 transition-colors"
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
                        setCurrentLang(l.code);
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
              Gemini 3.7 Flash 稼働中
            </div>
            
            <span className="text-slate-300">|</span>
            
            <span className="text-slate-500">残り枠: <strong className="text-slate-800">24 / 30 クエリ</strong></span>
          </div>
        </header>

        {/* Main App Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
