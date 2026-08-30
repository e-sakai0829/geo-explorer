"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  LogIn
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

function PromptsContent() {
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();
  const [prompt, setPrompt] = useState("");
  const [brandName, setBrandName] = useState("自社ブランド");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [targetLocale, setTargetLocale] = useState<"ja" | "zh-TW" | "en">(lang);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
      if (!res.ok) throw new Error(data.error || "解析に失敗しました。");

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
                {t.prompts_brand_mentioned}
              </div>
              <div className="flex items-center gap-2">
                {result.brandMentioned ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-lg font-black text-emerald-900">言及されています！</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span className="text-lg font-black text-rose-900">言及なし（要対策）</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                AI生成回答テキスト内にブランド名 「{result.brandName}」 が露出しています
              </p>
            </div>

            <div className={`p-5 rounded-2xl border ${result.brandCited ? "bg-emerald-50/60 border-emerald-200" : "bg-amber-50/60 border-amber-200"}`}>
              <div className="text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                {t.prompts_brand_cited}
              </div>
              <div className="flex items-center gap-2">
                {result.brandCited ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-lg font-black text-emerald-900">公式ドメイン引用中</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="text-lg font-black text-amber-900">直接引用なし</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                AIが回答の参照元ウェブソースカードとして自社サイトURLを直接提示しています
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
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 line-clamp-1">
                        {src.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono line-clamp-1">
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
