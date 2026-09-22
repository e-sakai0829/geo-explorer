"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  User,
  BarChart3,
  FileText,
  Globe,
  ChevronRight
} from "lucide-react";
import ConsultingModal from "@/components/ConsultingModal";

interface SubItem {
  name: string;
  href: string;
  tabKey?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  subItems?: SubItem[];
}

interface NavSection {
  title: string | null;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const { lang, t } = useLanguage();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("マイプロジェクト");
  const [projectDomain, setProjectDomain] = useState<string>("");
  const [planName, setPlanName] = useState<string>("Starter");
  const [isConsultingOpen, setIsConsultingOpen] = useState(false);
  const [credits, setCredits] = useState<{ total: number; used: number; remaining: number }>({
    total: 10,
    used: 0,
    remaining: 10,
  });

  const currentTab = searchParams.get("tab");

  const navSections: NavSection[] = [
    {
      title: null,
      items: [
        { 
          name: lang === "zh-TW" ? "儀表板" : lang === "en" ? "Dashboard" : "ダッシュボード", 
          href: "/dashboard", 
          icon: LayoutDashboard 
        },
      ]
    },
    {
      title: "SEO",
      items: [
        { 
          name: lang === "zh-TW" ? "網站分析" : lang === "en" ? "Site Explorer" : "サイトエクスプローラー", 
          href: "/seo/site-explorer", 
          icon: Globe,
          subItems: [
            {
              name: lang === "zh-TW" ? "自然關鍵字" : lang === "en" ? "Organic Keywords" : "オーガニックKW",
              href: "/seo/site-explorer?tab=keywords",
              tabKey: "keywords"
            },
            {
              name: lang === "zh-TW" ? "熱門頁面" : lang === "en" ? "Top Pages" : "上位ページ",
              href: "/seo/site-explorer?tab=pages",
              tabKey: "pages"
            }
          ]
        },
        { 
          name: lang === "zh-TW" ? "SEO 競爭關鍵字分析" : lang === "en" ? "Keyword Gap" : "KWギャップ", 
          href: "/seo", 
          icon: BarChart3 
        },
        { 
          name: lang === "zh-TW" ? "SEO 關鍵字文章生成" : lang === "en" ? "SEO Article Studio" : "記事制作", 
          href: "/seo/article-generator", 
          icon: FileText 
        },
      ]
    },
    {
      title: "GEO",
      items: [
        { 
          name: "Prompt Explorer", 
          href: "/prompts", 
          icon: Search 
        },
        { 
          name: lang === "zh-TW" ? "AEO 權威直答編輯器" : lang === "en" ? "AEO Content Editor" : "AEO記事制作", 
          href: "/editor", 
          icon: Sparkles 
        },
        { 
          name: lang === "zh-TW" ? "AI 引用來源媒體分析" : lang === "en" ? "Citation Sources" : "引用メディア分析", 
          href: "/citations", 
          icon: Link2 
        },
        { 
          name: lang === "zh-TW" ? "成效追蹤 (Before/After)" : lang === "en" ? "Performance Tracker" : "効果測定 (Before/After)", 
          href: "/performance", 
          icon: TrendingUp 
        },
      ]
    },
    {
      title: lang === "zh-TW" ? "管理 ＆ 資訊" : lang === "en" ? "Management" : "その他",
      items: [
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
      ]
    }
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    });

    // DB実クレジットの取得
    fetch("/api/user/credits")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setPlanName(data.plan.charAt(0).toUpperCase() + data.plan.slice(1));
          setCredits({
            total: data.monthlyCredits,
            used: data.usedCredits,
            remaining: data.remainingCredits,
          });
        }
      })
      .catch(() => {});

    // アクティブプロジェクトの取得
    fetch("/api/user/project")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.project) {
          if (data.project.name) setProjectName(data.project.name);
          if (data.project.domain) setProjectDomain(data.project.domain);
        }
      })
      .catch(() => {});
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const percentage = Math.min(100, Math.round((credits.remaining / (credits.total || 1)) * 100));

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

      {/* Project Selector Badge (DB実データ連携) */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mb-1">
          {lang === "zh-TW" ? "當前選定專案" : lang === "en" ? "Selected Project" : "選択中のプロジェクト"}
        </div>
        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-md border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-800 truncate">{projectName}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section, sIdx) => {
          return (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <div className="px-3 py-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isParentActive = pathname === item.href;

                  return (
                    <div key={item.href} className="space-y-0.5">
                      <Link
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isParentActive && (!item.subItems || !currentTab)
                            ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${
                            isParentActive && (!item.subItems || !currentTab)
                              ? "text-indigo-600" 
                              : "text-slate-400 group-hover:text-slate-600"
                          }`} />
                          <span>{item.name}</span>
                        </div>
                      </Link>

                      {/* Sub-items if available (e.g. サイトエクスプローラー配下の オーガニックKW / 上位ページ) */}
                      {item.subItems && (
                        <div className="ml-5 pl-3 border-l border-slate-200 space-y-0.5 my-0.5">
                          {item.subItems.map((sub) => {
                            const isSubActive = pathname === item.href && currentTab === sub.tabKey;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                                  isSubActive
                                    ? "bg-indigo-50 text-indigo-700 font-bold"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                }`}
                              >
                                <span className={`w-1 h-1 rounded-full ${isSubActive ? "bg-indigo-600" : "bg-slate-300"}`} />
                                <span>{sub.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* マーケティングコンサルティング相談 CTA */}
        <div className="pt-2 px-1">
          <div className="p-3 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl text-white shadow-md border border-indigo-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>個別伴走コンサル</span>
            </div>
            <p className="text-[11px] font-bold text-white leading-snug">
              マーケティング戦略・GEO改善のご相談
            </p>
            <p className="text-[10px] text-slate-300 leading-normal">
              自社のAI検索露出向上・一次情報設計をプロが支援
            </p>
            <button
              onClick={() => setIsConsultingOpen(true)}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <span>無料相談はこちら</span>
            </button>
          </div>
        </div>
      </nav>

      <ConsultingModal
        isOpen={isConsultingOpen}
        onClose={() => setIsConsultingOpen(false)}
        defaultDomain={projectDomain}
        defaultBrandName={projectName !== "マイプロジェクト" ? projectName : ""}
      />

      {/* Credit & User Footer (DB実データ連携) */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs mb-3">
          <div className="flex justify-between items-center text-[11px] mb-1.5">
            <span className="text-slate-500 font-medium">
              {lang === "zh-TW" ? "剩餘額度" : lang === "en" ? "Credits" : "残りクレジット"}
            </span>
            <span className="text-slate-900 font-bold">
              {credits.remaining} / {credits.total} pt
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>{planName} プラン</span>
            <Link href="/pricing" className="text-indigo-600 font-bold hover:underline">
              {lang === "zh-TW" ? "升級方案" : lang === "en" ? "Upgrade" : "アップグレード"}
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          {userEmail ? (
            <Link href="/settings" className="flex items-center gap-2 truncate max-w-[140px] hover:text-slate-900 transition-colors">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="truncate text-slate-800 font-bold text-[11px]">
                {userEmail}
              </span>
            </Link>
          ) : (
            <Link href="/login" className="flex items-center gap-2 truncate max-w-[140px] hover:text-indigo-600 transition-colors">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="truncate text-slate-500 font-medium text-[11px] underline">
                未ログイン (ログイン)
              </span>
            </Link>
          )}
          
          <div className="flex items-center gap-1">
            <Link 
              href="/settings" 
              title="設定" 
              className="text-slate-400 hover:text-indigo-600 p-1 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
            {userEmail && (
              <button
                onClick={handleSignOut}
                title="ログアウト"
                className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
