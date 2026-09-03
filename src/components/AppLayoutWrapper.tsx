"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import CookieBanner from "@/components/CookieBanner";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { Language } from "@/lib/i18n";
import { ChevronDown, Globe, Check, RefreshCw, MessageSquare } from "lucide-react";
import ConsultingModal from "@/components/ConsultingModal";

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
  const [projectName, setProjectName] = useState("自社ブランド");
  const [projectDomain, setProjectDomain] = useState("https://example.com");
  const [isConsultingOpen, setIsConsultingOpen] = useState(false);
  const [credits, setCredits] = useState({ total: 10, used: 0, remaining: 10 });

  const fetchCredits = () => {
    fetch("/api/user/credits")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setCredits({
            total: data.monthly_credits,
            used: data.used_credits,
            remaining: data.remaining_credits,
          });
        }
      })
      .catch(() => {});
  };

  const handleResetCredits = async () => {
    try {
      const res = await fetch("/api/user/credits", { method: "POST" });
      if (res.ok) {
        fetchCredits();
      }
    } catch (e) {}
  };

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "zh-TW", name: "繁體中文", flag: "🇹🇼" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ];

  const selectedLang = languages.find((l) => l.code === lang) || languages[0];

  useEffect(() => {
    if (!isFullPage) {
      // プロジェクト設定をDBから取得
      fetch("/api/user/project")
        .then((res) => res.json())
        .then((data) => {
          if (data?.project) {
            setProjectName(data.project.name || "自社ブランド");
            setProjectDomain(data.project.domain || "https://example.com");
          }
        })
        .catch(() => {});

      // クレジット残高をDBから取得
      fetchCredits();
    }
  }, [isFullPage, pathname]);

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
        {/* Top global header for App (DB動的データ連携) */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">
              {lang === "zh-TW" ? "專案:" : lang === "en" ? "Project:" : "プロジェクト:"}
            </span>
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 truncate max-w-xs">
              {projectName} - {projectDomain}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Prominent Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-300/80 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs hover:border-slate-400 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-sm">{selectedLang.flag}</span>
                <span>{selectedLang.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Select Language / 選擇語言
                  </div>
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs hover:bg-indigo-50 flex items-center justify-between cursor-pointer transition-colors ${
                        l.code === lang ? "text-indigo-600 font-bold bg-indigo-50/50" : "text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{l.flag}</span>
                        <span>{l.name}</span>
                      </div>
                      {l.code === lang && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Gemini 3.7 Flash {lang === "zh-TW" ? "運行中" : lang === "en" ? "Online" : "稼働中"}
            </div>

            <span className="text-slate-300">|</span>

            {/* マーケティングコンサルティング相談 CTA ボタン */}
            <button
              onClick={() => setIsConsultingOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer shadow-2xs hover:border-indigo-300"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>コンサル相談</span>
            </button>

            <span className="text-slate-300">|</span>

            <span className="text-slate-500">
              {lang === "zh-TW" ? "剩餘額度: " : lang === "en" ? "Credits: " : "残り枠: "}
              <strong className="text-slate-800">{credits.remaining} / {credits.total} クエリ</strong>
            </span>
          </div>
        </header>

        {/* Main App Content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
      <ConsultingModal
        isOpen={isConsultingOpen}
        onClose={() => setIsConsultingOpen(false)}
        defaultDomain={projectDomain !== "https://example.com" ? projectDomain : ""}
        defaultBrandName={projectName !== "自社ブランド" ? projectName : ""}
      />
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
