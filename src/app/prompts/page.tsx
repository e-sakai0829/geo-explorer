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
  Gift
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

function PromptsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { lang, t } = useLanguage();

  const [prompt, setPrompt] = useState("");
  const [brandName, setBrandName] = useState("自社ブランド");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [targetLocale, setTargetLocale] = useState<"ja" | "zh-TW" | "en">(lang);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans antialiased text-slate-900">
      {/* Header */}
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

        {!user && (
          <div className="mt-4 p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
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
            {error.includes("ログイン") && (
              <div className="pl-6 pt-1">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg text-xs hover:bg-rose-700 transition-colors shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  ログイン画面へ移動する
                </Link>
              </div>
            )}
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
          {/* Status Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl border ${result.brandMentioned ? "bg-emerald-50/60 border-emerald-200" : "bg-rose-50/60 border-rose-200"}`}>
              <div className="text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                ターゲットKWのAI認知状況
              </div>
              <div className="flex items-center gap-2">
                {result.brandMentioned ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-base font-black text-emerald-950">狙いたいKWは間違っていません</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span className="text-base font-black text-rose-900">AI未認知 (KW強化が必要)</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                AI検索の回答文内に「{result.brandName}」が主要な関連キーワードとして正しく認識・露出されています
              </p>
            </div>

            <div className={`p-5 rounded-2xl border ${result.brandCited ? "bg-emerald-50/60 border-emerald-200" : "bg-amber-50/60 border-amber-200"}`}>
              <div className="text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                自社URLの直接参照状況
              </div>
              <div className="flex items-center gap-2">
                {result.brandCited ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-base font-black text-emerald-950">自社サイトから直接参照されています</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="text-base font-black text-amber-900">自社サイトからは参照されていません (要対策)</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                AIが回答の信頼参照元（Web Card）として自社サイトURLを提示できておらず、他社メディアに流入を奪われています
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white">
              <div className="text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                競合シェアシフト
              </div>
              <div className="space-y-1">
                {Object.keys(result.competitorMentions || {}).length > 0 ? (
                  Object.entries(result.competitorMentions).map(([comp, mentioned]) => (
                    <div key={comp} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">{comp}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mentioned ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
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

          {/* ① & ② GEO Expert Diagnosis Cards (AI認知評価 ＆ 自社URL参照戦略 - Gemini回答のすぐ上に配置) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-indigo-500/30 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                  ① AI認知・ポジショニング評価
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-emerald-300">
                狙いたいキーワード（KW）の認知・方向性は間違っていません
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {result.brandMentioned
                  ? `AIのナレッジ空間で「${result.brandName}」が主要な関連キーワードとして正しく認知・露出されており、検索ニーズとのポジショニングは良好です。`
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
              <h4 className="text-sm font-bold text-amber-300">
                自社サイト（URL）からは参照されていません（要対策）
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {result.brandCited
                  ? `【良好】公式ドメインが直接参照元（Web Card）として獲得できています。現在のAEO構造を維持・拡張してください。`
                  : `AI回答内でブランドが言及されているものの、参照元Webカードは他社メディア（ニュース・比較サイト等）が占有しています。自社サイト内に「AIが直答として抽出できる構造化コンテンツ」を掲載し、引用枠を奪還してください。`}
              </p>
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

          {/* 4 Action Pillars Card (LLMO/AIO対策の4大コンサルティング・アクションプラン) */}
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
                  <span>1. AI「おすすめソリューション・パートナー枠」での自社名露出対策</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed pl-7">
                  AI回答内の「おすすめ支援会社一覧」等の推薦セクションで自社の社名が直接選ばれるよう、解決できる課題・強み・導入効果を具体化した構造化コンテンツを自社サイトに配置します。
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1.5">
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span>2. 自社サイト(URL)からの直接参照（Web Card）奪還</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed pl-7">
                  他社メディアが独占している参照リンク枠を取り戻すため、見出しのQ&A化と直後の35〜65文字結論（即答文章）を自社ドメイン内に配置します。
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1.5">
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                  <span>3. 一次情報構造＆基本SEO（JSON-LD構造化データ）の徹底</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed pl-7">
                  自社サイトに「JSON-LD (Organization, FAQPage)」を導入し、AIクローラーが自社の専門性を正しく解析できるセマンティックHTML（H2/H3）を徹底します。
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1.5">
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                  <span>4. 比較サイト・外部メディアへのサイテーション露出拡大</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed pl-7">
                  AIは第三者メディアの言及も重視します。無料掲載できる業界比較DB、PR TIMES、NewsPicks等への出稿努力を行い、外部での自社言及（サイテーション）を獲得します。
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

          {/* Web Citation Sources */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
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
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <div className="font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                AEO直答記事を自動生成して言及・引用を獲得
              </div>
              <p className="text-xs text-indigo-200">
                AIが回答で優先引用する構造化コンテンツテンプレートをAIエディタで即時作成できます
              </p>
            </div>

            <Link
              href={`/editor?prompt=${encodeURIComponent(result.prompt)}`}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>直答記事を作成する</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
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
