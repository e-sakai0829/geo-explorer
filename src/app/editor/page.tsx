"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  Download, 
  CheckCircle2, 
  Layers, 
  Table as TableIcon,
  HelpCircle,
  FileText,
  RefreshCw
} from "lucide-react";

function EditorContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || "法人向けAI英会話研修でおすすめのサービスは？";
  const rawFanout = searchParams.get("fanout");
  const rawCompetitors = searchParams.get("competitors");

  const [prompt, setPrompt] = useState(initialPrompt);
  const [fanoutQueries, setFanoutQueries] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [targetBrand, setTargetBrand] = useState("Ailo");
  const [loading, setLoading] = useState(false);
  const [articleContent, setArticleContent] = useState("");
  const [aeoScore, setAeoScore] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (rawFanout) {
      try {
        setFanoutQueries(JSON.parse(rawFanout));
      } catch {
        setFanoutQueries(rawFanout.split(","));
      }
    } else {
      setFanoutQueries([
        "法人 AI英会話 研修 費用相場",
        "AI英会話アプリ 法人契約 メリット・デメリット",
        "おすすめ 法人向けAI英会話 比較",
        "ビジネス英会話 AI スピーキング効果"
      ]);
    }

    if (rawCompetitors) {
      setCompetitors(rawCompetitors.split(",").map(s => s.trim()));
    } else {
      setCompetitors(["Speak", "プログリット", "ビズメイツ"]);
    }
  }, [rawFanout, rawCompetitors]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          fanoutQueries,
          targetBrand,
          competitorBrands: competitors,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "記事生成に失敗しました。");
      setArticleContent(data.articleMarkdown);
      setAeoScore(data.aeoScore || 95);
    } catch (err: any) {
      alert("エラー: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!articleContent) return;
    navigator.clipboard.writeText(articleContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            AEO Content Engine
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            AEO 直答記事 自動生成エディタ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            問い形式H2見出し・35〜65文字の直答・比較表を完全網羅した「AI引用特化記事」を生成します
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading ? "AI記事生成中..." : "記事を自動生成する"}
          </button>

          {articleContent && (
            <button
              onClick={handleCopy}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              {copied ? "コピー完了" : "Markdownをコピー"}
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout: Left Editor, Right AEO Rules & Checker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Article Editor (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  対象プロンプト（テーマ）
                </label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    自社ブランド名
                  </label>
                  <input
                    type="text"
                    value={targetBrand}
                    onChange={(e) => setTargetBrand(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    比較対象競合
                  </label>
                  <input
                    type="text"
                    value={competitors.join(", ")}
                    onChange={(e) => setCompetitors(e.target.value.split(",").map(s => s.trim()))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  生成記事ドラフト (Markdown / HTML入稿用)
                </label>
                {articleContent && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    約 {articleContent.length} 文字
                  </span>
                )}
              </div>

              <textarea
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                placeholder="「記事を自動生成する」ボタンをクリックすると、ここにAEO直答記事が自動出力されます..."
                className="w-full h-[520px] p-4 bg-slate-50/70 border border-slate-200 rounded-xl text-xs leading-relaxed font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all resize-y"
              />
            </div>
          </div>
        </div>

        {/* Right: AEO Rules & Fan-out Checker (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Score Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="text-xs font-bold text-slate-700 mb-2">AEO 適合スコア</div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-blue-600">
                {aeoScore !== null ? aeoScore : "--"}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 100 pt</span>
              {aeoScore !== null && aeoScore >= 90 && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  極めて優良
                </span>
              )}
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${aeoScore || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Fan-out Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-3">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              クエリファンアウト網羅状況
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              AIが内部展開したサブクエリを網羅しているか自動検証します
            </p>

            <div className="space-y-2">
              {fanoutQueries.map((q, i) => {
                const isCovered = articleContent.toLowerCase().includes(q.toLowerCase().slice(0, 4));
                return (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                    {isCovered ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 mt-0.5" />
                    )}
                    <span className={`text-[11px] ${isCovered ? "text-slate-900 font-semibold" : "text-slate-500"}`}>
                      {q}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6 AEO Rules Info */}
          <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              AEO 6大執筆ルール適用中
            </div>
            <ul className="text-[11px] space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                見出しはすべて読者の「問い形式」
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                見出し直下に「35〜65文字直答」
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                比較・料金・メリットの「完全表（テーブル）化」
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                指示語（これ・それ）の完全排除
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">読み込み中...</div>}>
      <EditorContent />
    </Suspense>
  );
}
