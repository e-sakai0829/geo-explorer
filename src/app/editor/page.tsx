"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Sparkles, 
  Layers, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Loader2, 
  Globe, 
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

function EditorInner() {
  const searchParams = useSearchParams();
  const { lang: uiLang, t } = useLanguage();

  const [prompt, setPrompt] = useState("");
  const [brandName, setBrandName] = useState("自社ブランド");
  const [fanoutQueries, setFanoutQueries] = useState<string[]>([]);
  const [targetLanguage, setTargetLanguage] = useState<"ja" | "zh-TW" | "en">(uiLang);
  const [article, setArticle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTargetLanguage(uiLang);
  }, [uiLang]);

  // DBからプロジェクト設定を取得
  useEffect(() => {
    fetch("/api/user/project")
      .then((res) => res.json())
      .then((data) => {
        if (data?.project?.name) {
          setBrandName(data.project.name);
        }
      })
      .catch(() => {});
  }, []);

  // URLパラメータからの引き継ぎ
  useEffect(() => {
    const p = searchParams.get("prompt");
    const fanouts = searchParams.get("fanouts");

    if (p) setPrompt(p);
    if (fanouts) {
      try {
        setFanoutQueries(JSON.parse(fanouts));
      } catch (e) {
        setFanoutQueries([]);
      }
    }
  }, [searchParams]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          brandName,
          fanoutQueries,
          targetLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "記事生成に失敗しました。");

      setArticle(data.article);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(article);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans antialiased text-slate-900">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          AEO Authority Direct-Answer Generator
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t.editor_title}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t.editor_desc}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.editor_target_prompt} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例: 法人向け おすすめ 費用比較"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.editor_brand_name}</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.editor_lang_label}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetLanguage("ja")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    targetLanguage === "ja"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  🇯🇵 日本語
                </button>
                <button
                  type="button"
                  onClick={() => setTargetLanguage("zh-TW")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    targetLanguage === "zh-TW"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  🇹🇼 繁體中文
                </button>
                <button
                  type="button"
                  onClick={() => setTargetLanguage("en")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    targetLanguage === "en"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>

            {/* Fan-out queries */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.editor_fanout_label}
              </label>
              {fanoutQueries.length > 0 ? (
                <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  {fanoutQueries.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {uiLang === "zh-TW" 
                    ? "可由 Prompt Explorer 自動帶入，或由 AI 智慧補充" 
                    : uiLang === "en" 
                    ? "Carried over from Prompt Explorer or auto-filled by AI" 
                    : "Prompt Explorer から自動引き継ぎ、またはAIが自動補完します"}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {t.editor_btn_generate}
            </button>

            {/* Quality Guideline Notice (信頼性を高める注記カード) */}
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300/80 text-amber-950 space-y-1.5 text-xs shadow-2xs">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>検索評価（SEO/GEO）を高めるための重要ガイドライン</span>
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed pl-5">
                ※AIで自動生成された文章をそのまま未修正で大量公開すると、Googleから「量産コンテンツ」として低評価を受けるリスクがあります。本機能で生成された構造化マークダウンを<strong>【骨組み・下書き】</strong>として参考にし、自社ならではの一次情報、具体的な事例、独自の強みを加筆・カスタマイズして公開いただくことで、AI検索・SEOの両方で最高の評価を獲得できます。
              </p>
            </div>
          </form>
        </div>

        {/* Right Output (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs h-full flex flex-col min-h-[550px]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">{t.editor_preview_title}</span>
              </div>

              {article && (
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t.editor_copied : t.editor_copy_btn}
                </button>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {article ? (
                <div className="prose prose-slate prose-sm max-w-none text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {article}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-xs max-w-sm">
                    {t.editor_empty_guide}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">読み込み中...</div>}>
      <EditorInner />
    </Suspense>
  );
}
