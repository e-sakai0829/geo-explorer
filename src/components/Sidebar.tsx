"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useLanguage } from "@/context/LanguageContext";
import { 
  LayoutDashboard, 
  Search, 
  Sparkles, 
  Link2, 
  CreditCard, 
  Settings, 
  TrendingUp,
  BookOpen,
  LogOut,
  User
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { lang } = useLanguage();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const navigation = [
    { 
      name: lang === "zh-TW" ? "儀表板" : lang === "en" ? "Dashboard" : "ダッシュボード", 
      href: "/dashboard", 
      icon: LayoutDashboard 
    },
    { 
      name: lang === "zh-TW" ? "Prompt Explorer (GEO)" : lang === "en" ? "Prompt Explorer" : "Prompt Explorer (GEO)", 
      href: "/prompts", 
      icon: Search 
    },
    { 
      name: lang === "zh-TW" ? "AEO 權威直答編輯器" : lang === "en" ? "AEO Content Editor" : "AEO直答記事エディタ", 
      href: "/editor", 
      icon: Sparkles 
    },
    { 
      name: lang === "zh-TW" ? "AI 引用來源媒體分析" : lang === "en" ? "Citation Sources" : "AI引用メディア分析", 
      href: "/citations", 
      icon: Link2 
    },
    { 
      name: lang === "zh-TW" ? "成效追蹤 (Before/After)" : lang === "en" ? "Performance Tracker" : "効果測定 (Before/After)", 
      href: "/performance", 
      icon: TrendingUp 
    },
    { 
      name: lang === "zh-TW" ? "官方專欄 ＆ 知識庫" : lang === "en" ? "Insights & Knowledge" : "公式コラム・ナレッジ", 
      href: "/insights", 
      icon: BookOpen 
    },
    { 
      name: lang === "zh-TW" ? "方案 ＆ 額度管理" : lang === "en" ? "Pricing & Credits" : "料金・クレジット", 
      href: "/pricing", 
      icon: CreditCard 
    },
  ];

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

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-200/80 z-50 shadow-xs font-sans">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-900 font-bold text-base tracking-tight flex items-center gap-1.5">
              GEO Explorer
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-mono border border-indigo-200">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Traditionalart BtoB</div>
          </div>
        </Link>
      </div>

      {/* Project Selector Badge */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mb-1">
          {lang === "zh-TW" ? "當前選定專案" : lang === "en" ? "Selected Project" : "選択中のプロジェクト"}
        </div>
        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-md border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-800 truncate">Ailo（AI英会話）</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold text-slate-400 px-3 pb-2 uppercase tracking-wider">
          {lang === "zh-TW" ? "主要功能選單" : lang === "en" ? "Main Navigation" : "メインメニュー"}
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Credit & User Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs mb-3">
          <div className="flex justify-between items-center text-[11px] mb-1.5">
            <span className="text-slate-500 font-medium">
              {lang === "zh-TW" ? "月度額度" : lang === "en" ? "Monthly Credits" : "月間クレジット"}
            </span>
            <span className="text-slate-900 font-bold">24 / 30 pt</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: "80%" }}></div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Starter</span>
            <Link href="/pricing" className="text-indigo-600 font-bold hover:underline">
              {lang === "zh-TW" ? "升級方案" : lang === "en" ? "Upgrade" : "アップグレード"}
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <Link href="/settings" className="flex items-center gap-2 truncate max-w-[140px] hover:text-slate-900 transition-colors">
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="truncate text-slate-700 font-medium text-[11px]">
              {userEmail || "酒井 栄二郎"}
            </span>
          </Link>
          
          <div className="flex items-center gap-1">
            <Link 
              href="/settings" 
              title="設定" 
              className="text-slate-400 hover:text-indigo-600 p-1 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleSignOut}
              title="ログアウト"
              className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
