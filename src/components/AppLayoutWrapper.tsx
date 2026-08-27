"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  if (isLandingPage) {
    return <div className="min-h-screen w-full bg-white">{children}</div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 antialiased">
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
