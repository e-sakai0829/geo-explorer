"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Search, 
  Sparkles, 
  Link2, 
  CreditCard, 
  Settings, 
  TrendingUp,
  BookOpen
} from "lucide-react";

const navigation = [
  { name: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
  { name: "Prompt Explorer (GEO)", href: "/prompts", icon: Search },
  { name: "AEO直答記事エディタ", href: "/editor", icon: Sparkles },
  { name: "AI引用メディア分析", href: "/citations", icon: Link2 },
  { name: "効果測定 (Before/After)", href: "/performance", icon: TrendingUp },
  { name: "公式コラム・ナレッジ", href: "/insights", icon: BookOpen },
  { name: "料金・クレジット", href: "/pricing", icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800/80 z-50">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white font-bold text-base tracking-tight flex items-center gap-1.5">
              GEO Explorer
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono border border-indigo-500/30">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Traditionalart BtoB</div>
          </div>
        </Link>
      </div>

      {/* Project Selector Badge */}
      <div className="px-4 py-3 bg-slate-900/40 border-b border-slate-800/60">
        <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mb-1">
          選択中のプロジェクト
        </div>
        <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-md border border-slate-800">
          <span className="text-xs font-medium text-white truncate">Ailo（AI英会話）</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50"></span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold text-slate-400 px-3 pb-2 uppercase tracking-wider">
          メインメニュー
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Credit & User Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 mb-3">
          <div className="flex justify-between items-center text-[11px] mb-1.5">
            <span className="text-slate-400">月間クレジット</span>
            <span className="text-white font-bold">24 / 30 pt</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: "80%" }}></div>
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Starter プラン</span>
            <Link href="/pricing" className="text-indigo-400 hover:underline">
              アップグレード
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white border border-slate-700">
              JS
            </div>
            <span className="truncate max-w-[110px] text-slate-300">酒井 栄二郎</span>
          </div>
          <Link href="/pricing" className="hover:text-white">
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
