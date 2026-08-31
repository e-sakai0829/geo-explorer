"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { 
  Search, 
  Sparkles, 
  ExternalLink, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Globe, 
  Zap,
  LogIn,
  Gift,
  Printer,
  FileDown
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

function PromptsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { lang, t } = useLanguage();

  const handlePrintReport = () => {
    window.print();
  };

  const [prompt, setPrompt] = useState("");
  const [brandName, setBrandName] = useState("自社ブランド");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [targetLocale, setTargetLocale] = useState<"ja" | "zh-TW" | "en">(lang);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // 過去スキャン履歴の取得
  const fetchHistoryLogs = () => {
    fetch("/api/user/logs")
      .then((res) => res.json())
      .then((data) => {
        if (data?.logs) setHistoryLogs(data.logs);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchHistoryLogs();
  }, []);

  // 履歴からの結果復元
  const handleRestoreLog = (log: any) => {
    setPrompt(log.prompt);
    setResult({
      prompt: log.prompt,
      brandName: brandName,
      brandMentioned: log.brandMentioned,
      brandCited: log.brandCited,
      aiResponse: log.rawResponse,
      fanoutQueries: log.fanoutQueries || [],
      citationSources: log.citationSources || [],
      competitorMentions: {},
      creditsRemaining: 10,
    });
    // スクロール移動
    window.scrollTo({ top: 400, behavior: "smooth" });
  };
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // 認証状態の監視
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
  }, [supabase]);

  // URLパラメータから検索クエリ(prompt or q)を自動セット
  useEffect(() => {
    const urlPrompt = searchParams.get("prompt") || searchParams.get("q");
    if (urlPrompt) {
      setPrompt(urlPrompt);
    }
  }, [searchParams]);

  useEffect(() => {
    setTargetLocale(lang);
  }, [lang]);

  // DBからプロジェクト設定を取得
  useEffect(() => {
    fetch("/api/user/project")
      .then((res) => res.json())
      .then((data) => {
        if (data?.project) {
          if (data.project.name) setBrandName(data.project.name);
          if (Array.isArray(data.project.competitors)) {
            setCompetitors(data.project.competitors);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt) return;

    // 未ログインの場合はログイン画面へ誘導
    if (!user) {
      router.push(`/login?redirect=prompts&prompt=${encodeURIComponent(prompt)}`);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          brandName,
          competitors,
          targetLocale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=prompts&prompt=${encodeURIComponent(prompt)}`);
          return;
        }
        throw new Error(data.error || "解析に失敗しました。");
      }

      setResult(data);
      fetchHistoryLogs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans antialiased text-slate-900">
      {/* Header with Permanent PDF Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Search className="w-3.5 h-3.5" />
            GEO Prompt Explorer
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.prompts_title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t.prompts_desc}
          </p>
        </div>

        {/* 画面右上：常時アクセスできる PDF / 印刷出力ボタン */}
        <button
          onClick={handlePrintReport}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer print:hidden"
        >
          <FileDown className="w-4 h-4 text-indigo-400" />
          <span>📄 PDF / 印刷レポートを出力</span>
        </button>
      </div>

      {!user && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-indigo-950 font-medium">
            <span className="p-1 bg-indigo-600 text-white rounded-md shrink-0">
              <Gift className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong>無料アカウント登録（カード不要）</strong>で、毎月10回のAI検索リアルタイムスキャンが無料でご利用いただけます。
            </span>
          </div>
          <Link
            href={`/login?redirect=prompts${prompt ? `&prompt=${encodeURIComponent(prompt)}` : ""}`}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shrink-0 text-xs shadow-2xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            無料登録 / ログイン
          </Link>
        </div>
      )}

      {/* Search Input Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 print:hidden">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="block text-xs font-bold text-slate-700">
              {t.prompts_input_label}
            </label>
            
            <div className="flex items-center gap-2 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-semibold">検索対象地域:</span>
              <select
                value={targetLocale}
                onChange={(e) => setTargetLocale(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-hidden"
              >
                <option value="ja">🇯🇵 日本 (Google JP)</option>
                <option value="zh-TW">🇹🇼 台灣/香港 (Google TW)</option>
                <option value="en">🇺🇸 Global / US (Google US)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例: パーパスブランディング 支援 コンサル 会社 比較"
              required
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden transition-all"
            />

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {t.prompts_btn_scan}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <div className="flex items-center gap-4">
              <span>自社ブランド: <strong className="text-slate-700">{brandName}</strong></span>
              <span>•</span>
              <span>追跡競合: <strong className="text-slate-700">{competitors.length > 0 ? competitors.join(", ") : "未設定"}</strong></span>
            </div>
            <Link href="/settings" className="text-indigo-600 hover:underline">
              プロジェクト設定で変更
            </Link>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>解析エラー</span>
            </div>
            <p className="pl-6 text-rose-700 leading-relaxed">{error}</p>
          </div>
        )}
      </div>

      {/* Loading Skeleton State */}
      {loading && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-900">Google AI Overviews (Gemini) スキャン中...</h3>
            <p className="text-xs text-slate-400">最新ウェブインデックスからの言及・引用ソースおよび内部展開クエリ(fan-out)を解析しています</p>
          </div>
        </div>
      )}

      {/* Analysis Result Display */}
      {result && (
        <div className="space-y-6">
          {/* Printable Header (印刷・PDF出力時のみ紙面トップに表示) */}
          <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-bold text-indigo-600 tracking-widest uppercase">GEO Explorer Official Report</span>
                <h1 className="text-2xl font-black text-slate-900 mt-1">Google AI Overviews / Gemini 露出診断 ＆ 改善処方箋レポート</h1>
              </div>
              <div className="text-right text-xs text-slate-500 font-mono">
                発行日: {new Date().toLocaleDateString("ja-JP")}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs text-slate-700">
              <div><strong>調査プロンプト:</strong> {result.prompt}</div>
              <div><strong>対象ブランド:</strong> {result.brandName}</div>
            </div>
          </div>

          {/* ① & ② GEO Expert Diagnosis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-indigo-500/30 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                  ① AI認知・ポジショニング評価
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-xs font-bold text-emerald-300">
                狙いたいKWの認知・方向性は間違っていません
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {result.brandMentioned
                  ? `AIのナレッジ空間で「${result.brandName}」が主要な関連キーワードとして正しく認知・露出されています。`
                  : `ブランド「${result.brandName}」はAI回答内で十分認知されていません。「${result.prompt}」に関連する自社の強みをAIに学ばせるコンテンツ強化が必要です。`}
              </p>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-indigo-500/30 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                  ② 参照リンク（自社URL）獲得戦略
                </span>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="text-xs font-bold text-amber-300">
                自社サイトからは参照されていません (要対策)
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {result.brandCited
                  ? `【良好】公式ドメインが直接参照元（Web Card）として獲得できています。`
                  : `参照元Webカードは他社メディアが占有しています。自社サイト内に「AIが直答として抽出できる構造化コンテンツ」を掲載し引用枠を奪還してください。`}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-0.5 rounded-full">
                  ③ 競合シェアシフト
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                {Object.keys(result.competitorMentions || {}).length > 0 ? (
                  Object.entries(result.competitorMentions).map(([comp, mentioned]) => (
                    <div key={comp} className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700 truncate pr-2">{comp}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${mentioned ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                        {mentioned ? "言及あり" : "言及なし"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 pt-1">追跡中の競合なし</div>
                )}
              </div>
            </div>
          </div>

          {/* 4 Action Pillars Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/30 space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-indigo-500/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                  <Sparkles className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                    GEO / LLMO 対策処方箋
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                    📋 LLMO/AIO対策の4大コンサルティング・アクションプラン
                  </h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1.5">
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <span>1. AI「おすすめソリューション・パートナー枠」対策</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed pl-7">
                  推薦セクションで自社の社名が選ばれるよう、解決できる課題・強み・導入効果を具体化した構造化コンテンツを配置します。
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1.5">
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span>2. 自社サイト(URL)からの直接参照（Web Card）奪還</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed pl-7">
                  他社メディアが独占している参照枠を取り戻すため、見出しのQ&A化と直後の結論（即答文章）をドメイン内に配置します。
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1.5">
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                  <span>3. JSON-LD構造化データによるセマンティック強化</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed pl-7">
                  自社サイトに「JSON-LD (Organization, FAQPage)」を導入し、AIクローラーが専門性を正しく解析できる構造を徹底します。
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1.5">
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                  <span>4. 外部サイテーション露出の最大化</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed pl-7">
                  業界比較DB、PR TIMES等への出稿により、AIが重要視する外部メディアからの言及（サイテーション）を獲得します。
                </p>
              </div>
            </div>
          </div>

          {/* AI Response Text Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Google AI Overviews / Gemini リアルタイムスキャン回答
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-200">
                Search Grounded Response
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
              {result.aiResponse}
            </div>

            {/* Fanout Sub-queries */}
            {result.fanoutQueries && result.fanoutQueries.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  {t.prompts_fanout_title} (Fan-out Subqueries)
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.fanoutQueries.map((q: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-medium flex items-center gap-1"
                    >
                      <span>🔍</span> {q}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Citation Sources Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <ExternalLink className="w-4 h-4 text-indigo-600" />
                {t.prompts_sources_title} ({result.citationSources?.length || 0}件)
              </div>
              <span className="text-xs text-slate-400 font-normal">AIが参照元として引用した信頼Webソース</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.citationSources && result.citationSources.length > 0 ? (
                result.citationSources.map((src: any, idx: number) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all flex items-start justify-between group"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                        {src.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate font-mono">
                        {src.url}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5 ml-2" />
                  </a>
                ))
              ) : (
                <div className="col-span-2 text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  引用Webソースが見つかりませんでした。
                </div>
              )}
            </div>
          </div>

          {/* Action CTA: Generate AEO Article */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 sm:p-7 rounded-2xl text-white space-y-4 shadow-md border border-indigo-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-base flex items-center gap-2 text-white">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  AEO直答記事を自動生成して言及・引用を獲得
                </div>
                <p className="text-xs text-indigo-200">
                  AIが回答で優先引用する構造化コンテンツテンプレートをAIエディタで即時作成できます
                </p>
              </div>

              <Link
                href={`/editor?prompt=${encodeURIComponent(result.prompt)}`}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>直答記事を作成する</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="pt-3 border-t border-indigo-500/20 text-[11px] text-indigo-200/90 leading-relaxed">
              💡 <strong>プロコンサルタントからのアドバイス：</strong> AIで生成されたマークダウン記事を【ベース（下書き）】として参考にし、自社ならではの事例や独自の一次情報を加筆してカスタマイズすることで、Googleの量産コンテンツ評価を回避し、AI検索・SEOの両方で最高の評価を獲得できます。
            </div>
          </div>
        </div>
      )}

      {/* ミエルカ風：過去の調査・スキャン履歴一覧テーブル (④の実装) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Search className="w-4 h-4 text-indigo-600" />
            <span>過去の調査・スキャン履歴ログ</span>
            <span className="text-xs text-slate-400 font-normal">({historyLogs.length}件の記録)</span>
          </div>
          <span className="text-[11px] text-slate-400">過去のスキャン結果をいつでも再確認・PDF出力できます</span>
        </div>

        {historyLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">取得日時</th>
                  <th className="py-3 px-3">調査キーワード（プロンプト）</th>
                  <th className="py-3 px-3">AI認知状況</th>
                  <th className="py-3 px-3">自社URL参照</th>
                  <th className="py-3 px-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {historyLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.date).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {log.prompt}
                    </td>
                    <td className="py-3 px-3">
                      {log.brandMentioned ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 認知あり
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                          <AlertCircle className="w-3 h-3 text-rose-600" /> AI未認知
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {log.brandCited ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 参照獲得
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                          <AlertCircle className="w-3 h-3 text-amber-600" /> 要対策
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleRestoreLog(log)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>👁️ 結果を表示</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            まだ過去の調査履歴はありません。キーワードを入力してスキャンを実行してください。
          </div>
        )}
      </div>
    </div>
  );
}

export default function PromptsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">読み込み中...</div>}>
      <PromptsContent />
    </Suspense>
  );
}
