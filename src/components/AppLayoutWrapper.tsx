"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import CookieBanner from "@/components/CookieBanner";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { ProjectProvider, useProject } from "@/context/ProjectContext";
import { Language } from "@/lib/i18n";
import { 
  ChevronDown, 
  Globe, 
  Check, 
  RefreshCw, 
  MessageSquare,
  FolderPlus,
  Lock,
  Sparkles,
  X,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Loader2 
} from "lucide-react";
import ConsultingModal from "@/components/ConsultingModal";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isFullPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/legal";

  const { lang, setLang, t } = useLanguage();
  const { projectId, currentProject, projects, plan, setProjectId, refreshProjects } = useProject();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDomain, setNewProjectDomain] = useState("");
  const [newProjectCompetitors, setNewProjectCompetitors] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/user/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isNew: true,
          name: newProjectName,
          domain: newProjectDomain,
          competitors: newProjectCompetitors,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PROJECT_LIMIT_REACHED") {
          setIsCreateModalOpen(false);
          setIsUpgradeModalOpen(true);
        } else {
          setCreateError(data.error || "プロジェクト作成に失敗しました。");
        }
        return;
      }

      await refreshProjects();
      if (data.project?.id) {
        setProjectId(data.project.id);
      }
      setIsCreateModalOpen(false);
      setNewProjectName("");
      setNewProjectDomain("");
      setNewProjectCompetitors("");
    } catch (err: any) {
      setCreateError(err.message || "エラーが発生しました。");
    } finally {
      setCreateLoading(false);
    }
  };

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "zh-TW", name: "繁體中文", flag: "🇹🇼" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ];

  const selectedLang = languages.find((l) => l.code === lang) || languages[0];

  useEffect(() => {
    if (!isFullPage) {
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

  const displayName = currentProject?.name || "自社ブランド";
  const displayDomain = currentProject?.domain || "https://example.com";

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 antialiased font-sans">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top global header for App (DB動的データ連携 & マルチプロジェクト切替) */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">
              {lang === "zh-TW" ? "專案:" : lang === "en" ? "Project:" : "プロジェクト:"}
            </span>
            <div className="relative">
              <button
                onClick={() => setProjectMenuOpen(!projectMenuOpen)}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs max-w-xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="truncate">{displayName} - {displayDomain}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              {projectMenuOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    {lang === "zh-TW" ? "登錄專案列表" : lang === "en" ? "Registered Projects" : "登録プロジェクト一覧"}
                  </div>
                  
                  {/* 登録プロジェクト一覧 */}
                  {projects.map((p) => {
                    const isSelected = p.id === projectId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProjectId(p.id);
                          setProjectMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected ? "bg-indigo-50/70 text-indigo-900 font-bold" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="truncate">
                          <div>{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate">{p.domain}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}

                  <div className="border-t border-slate-100 my-1"></div>

                  {/* 新規プロジェクト追加（StarterならUpgradeモーダル、Growth以上なら新規作成モーダル） */}
                  <button
                    onClick={() => {
                      setProjectMenuOpen(false);
                      if (plan === "starter") {
                        setIsUpgradeModalOpen(true);
                      } else {
                        setIsCreateModalOpen(true);
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-indigo-600 hover:bg-indigo-50 flex items-center justify-between cursor-pointer font-bold transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>{lang === "zh-TW" ? "+ 新增專案" : lang === "en" ? "+ Add Project" : "+ 新規プロジェクトを追加"}</span>
                    </div>
                    {plan === "starter" ? (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Growth
                      </span>
                    ) : (
                      <span className="text-[10px] text-indigo-500 font-normal">
                        ({projects.length} / {plan === "agency" ? "無制限" : "3"})
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
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
        defaultDomain={currentProject?.domain && currentProject.domain !== "https://example.com" ? currentProject.domain : ""}
        defaultBrandName={currentProject?.name && currentProject.name !== "自社ブランド" ? currentProject.name : ""}
      />

      {/* マルチプロジェクト（Growth以上）アップグレード案内モーダル */}
      {isUpgradeModalOpen && (
        <div
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setIsUpgradeModalOpen(false); }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95"
          >
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 relative">
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold border border-amber-300/30 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Growth / Agency プラン限定機能</span>
              </div>
              <h3 className="text-lg font-black text-white">
                マルチプロジェクト（複数サイト）管理
              </h3>
              <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                複数ブランド・子会社・オウンドメディアを1つのアカウントで個別管理。
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">最大3〜無制限のサイトを個別追跡:</strong>
                    <div className="text-slate-500 mt-0.5">プロジェクトごとに独立した競合他社比較・独自ATSスコア・引用メディア解析を一元管理できます。</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">月間150プロンプト ＋ AEO記事25本枠（Starterの5倍）:</strong>
                    <div className="text-slate-500 mt-0.5">週次自動モニタリングやBefore/After効果測定トラッカーもフル解放されます。</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  閉じる
                </button>
                <button
                  onClick={() => {
                    setIsUpgradeModalOpen(false);
                    router.push("/pricing");
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Growthプランへアップグレード (月19,800円)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新規プロジェクト追加モーダル (Growth / Agency 向け) */}
      {isCreateModalOpen && (
        <div
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setIsCreateModalOpen(false); }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95"
          >
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold border border-indigo-400/30 mb-2">
                <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                <span>新規サイト・ブランドの追加</span>
              </div>
              <h3 className="text-lg font-black text-white">
                新しいプロジェクトを登録
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                独立したGEOダッシュボード・引用分析・プロンプト追跡を開始します。
              </p>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {createError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">プロジェクト名 / ブランド名</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="例: 株式会社A-Sales オウンドメディア"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">対象ドメイン (URL)</label>
                <input
                  type="url"
                  required
                  value={newProjectDomain}
                  onChange={(e) => setNewProjectDomain(e.target.value)}
                  placeholder="例: https://example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">競合ブランド名（カンマ区切りで最大5社）</label>
                <input
                  type="text"
                  value={newProjectCompetitors}
                  onChange={(e) => setNewProjectCompetitors(e.target.value)}
                  placeholder="例: 競合A, 競合B, 競合C"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  <span>{createLoading ? "プロジェクト登録中..." : "プロジェクトを作成"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CookieBanner />
    </div>
  );
}

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ProjectProvider>
        <LayoutInner>{children}</LayoutInner>
      </ProjectProvider>
    </LanguageProvider>
  );
}
