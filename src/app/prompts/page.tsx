"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Layers, 
  HelpCircle, 
  AlertTriangle,
  Flame,
  ArrowRight
} from "lucide-react";

export default function PromptExplorerPage() {
  const [promptInput, setPromptInput] = useState("法人向けAI英会話研修でおすすめのサービスは？");
  const [targetBrand, setTargetBrand] = useState("Ailo");
  const [competitorBrands, setCompetitorBrands] = useState("Speak, プログリット, DMM英会話, ビズメイツ");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptInput,
          targetBrand,
          competitorBrands: competitorBrands.split(",").map(s => s.trim()),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "分析に失敗しました。");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <Search className="w-3.5 h-3.5" />
          GEO / Prompt Explorer
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          プロンプト調査 ＆ クエリファンアウト分析
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          AIが内部で展開したサブクエリ（Query Fan-out）、引用ソースURL、および競合言及ギャップをリアルタイムに解析します
        </p>
      </div>

      {/* Input Search Form */}
      <form onSubmit={handleAnalyze} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            調査するプロンプト / 質問キーワード <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="例: BtoBマーケティングでおすすめのAIツール比較"
              className="w-full pl-4 pr-32 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "AI解析中..." : "リアルタイム調査"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              自社ブランド名
            </label>
            <input
              type="text"
              value={targetBrand}
              onChange={(e) => setTargetBrand(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              追跡する競合ブランド名（カンマ区切り）
            </label>
            <input
              type="text"
              value={competitorBrands}
              onChange={(e) => setCompetitorBrands(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Analysis Result Container */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Status Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 mb-2">自社言及ステータス</div>
              <div className="flex items-center gap-2 mb-2">
                {result.targetMentioned ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" /> 自社言及あり（露出中）
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold">
                    <XCircle className="w-4 h-4" /> 自社言及なし（要対策）
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {result.targetMentioned 
                  ? "AI回答文中で自社ブランドが認識されています。" 
                  : "競合のみが推薦されているため、対策記事の作成を推奨します。"}
              </p>
            </div>

            {/* Competitors Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 mb-2">言及された競合ブランド</div>
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                {result.mentionedCompetitors.length > 0 ? (
                  result.mentionedCompetitors.map((c: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-xs font-semibold border border-slate-200">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">競合言及なし</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                AIが回答で推薦・比較対象として挙げた他社サービス
              </p>
            </div>

            {/* Difficulty Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 mb-2">LLM奪取難易度</div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-slate-900">Lv.{result.difficultyScore}</span>
                <span className="text-xs text-slate-400">/ 100</span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  穴場クエリ
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                引用元ドメインの権威性から算定した奪取難易度
              </p>
            </div>
          </div>

          {/* CTA Banner: ギャップ自動注入 AEO記事生成 */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                ワンクリック AEOパイプライン
              </div>
              <h3 className="text-lg font-bold">
                この調査結果から、AIに選ばれる「AEO直答記事」を自動生成
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                抽出されたファンアウトクエリと競合ギャップを100%反映した記事構成案を1秒で作成します
              </p>
            </div>

            <Link
              href={`/editor?prompt=${encodeURIComponent(result.prompt)}&fanout=${encodeURIComponent(JSON.stringify(result.fanoutQueries))}&competitors=${encodeURIComponent(result.mentionedCompetitors.join(","))}`}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-blue-600 font-bold rounded-xl text-xs shadow-md transition-all shrink-0"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              このギャップを埋める記事を作成
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Query Fan-out & Citations Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fan-out Queries */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-blue-600" />
                AI内部展開クエリ（Query Fan-out）
                <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono font-bold">
                  {result.fanoutQueries.length} 件
                </span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                AIが1つの質問に対して裏側で並列検索したサブクエリ一覧です（記事の見出しに必須）。
              </p>

              <div className="space-y-2">
                {result.fanoutQueries.map((q: string, i: number) => (
                  <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 font-medium">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cited URLs & Domains */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <ExternalLink className="w-4 h-4 text-indigo-600" />
                AI引用ソース一覧（Citations）
                <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono font-bold">
                  {result.citations.length} 件
                </span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                AIが回答文を合成する際に参照・引用したWebページの一覧です。
              </p>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {result.citations.map((c: any, i: number) => (
                  <a
                    key={i}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 text-xs transition-colors group"
                  >
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 truncate group-hover:text-blue-600">
                        {c.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {c.domain}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Raw AI Response */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              AI生成生回答（Google AI Overviews / Gemini 3.7）
            </h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
              {result.rawText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
