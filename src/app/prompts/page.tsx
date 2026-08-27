"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Sparkles, 
  ExternalLink, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Zap
} from "lucide-react";
import Link from "next/link";

export default function PromptsPage() {
  const [prompt, setPrompt] = useState("");
  const [brandName, setBrandName] = useState("自社ブランド");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
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
          プロンプト言及・引用ギャップ解析
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Google AI Overviews ＆ Gemini をリアルタイムスキャンし、AI内部展開クエリ（Fan-out）と引用ギャップを特定します（1クエリ消費）
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              調査対象のプロンプト（検索キーワード）
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="例: 自社業界のおすすめ・比較・費用相場など"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden transition-all font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? "AI検索スキャン中..." : "リアルタイム解析実行"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span className="font-semibold text-slate-700">自社ブランド: <strong className="text-indigo-600">{brandName}</strong></span>
            <span>•</span>
            <span className="font-semibold text-slate-700">追跡競合: <strong className="text-slate-800">{competitors.length > 0 ? competitors.join(", ") : "未設定"}</strong></span>
            <Link href="/settings" className="text-indigo-600 hover:underline text-[11px] ml-auto">
              プロジェクト設定で変更
            </Link>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">解析エラー</div>
              <div className="text-[11px] mt-0.5">{error}</div>
              {error.includes("アップグレード") && (
                <Link href="/pricing" className="mt-2 inline-block font-bold underline text-rose-900">
                  料金プラン一覧を開く ➔
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results Display */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[11px] text-slate-500 font-semibold mb-1">自社ブランド言及</div>
              <div className="flex items-center gap-2">
                {result.brandMentioned ? (
                  <span className="text-base font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-5 h-5" /> 言及あり (露出中)
                  </span>
                ) : (
                  <span className="text-base font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-5 h-5" /> 言及なし (機会損失)
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[11px] text-slate-500 font-semibold mb-1">自社URL引用</div>
              <div className="flex items-center gap-2">
                {result.brandCited ? (
                  <span className="text-base font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-5 h-5" /> ソース引用あり
                  </span>
                ) : (
                  <span className="text-base font-bold text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-5 h-5" /> 引用なし (記事作成推奨)
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[11px] text-slate-500 font-semibold mb-1">AI内部展開クエリ数</div>
              <div className="text-base font-bold text-indigo-600 flex items-center gap-1">
                <Layers className="w-5 h-5" /> {result.fanoutQueries?.length || 0} 件抽出
              </div>
            </div>
          </div>

          {/* 2-Column: AI Response & Fan-outs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Response Preview */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                <span>Google AI Overviews 回答スキャン</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono">
                  Gemini 3.7 Live
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap font-sans border border-slate-100">
                {result.aiResponse}
              </div>
            </div>

            {/* Captured Fan-out Sub-queries */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                抽出されたAI内部展開クエリ（Fan-out）
              </div>
              <div className="space-y-2">
                {result.fanoutQueries?.map((q: string, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between">
                    <span>{idx + 1}. {q}</span>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">サブクエリ</span>
                  </div>
                ))}
              </div>

              <Link
                href={`/editor?prompt=${encodeURIComponent(prompt)}&fanouts=${encodeURIComponent(JSON.stringify(result.fanoutQueries || []))}`}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                このクエリ群でAEO直答記事を自動生成する ➔
              </Link>
            </div>
          </div>

          {/* Citation Sources */}
          {result.citationSources && result.citationSources.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="font-bold text-sm text-slate-900">AI検索が参照した引用元ソース（Top {result.citationSources.length}）</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.citationSources.map((src: any, i: number) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 rounded-xl flex items-center justify-between text-xs transition-colors group"
                  >
                    <span className="font-medium text-slate-800 group-hover:text-indigo-600 truncate mr-2">
                      {src.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
