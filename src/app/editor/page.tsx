"use client";

import { useState, useEffect, useLayoutEffect, Suspense } from "react";
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
  ExternalLink,
  Printer,
  FileDown
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useProject } from "@/context/ProjectContext";

import { qualityLabel } from "@/lib/measurement-display";
import { ProjectAsyncGuard } from "@/lib/project-async-guard";
import { loadEditorDraft, saveEditorDraft, isDraftUnsaved } from "@/lib/draft-storage";
import { useRef } from "react";

function EditorInner() {
  const searchParams = useSearchParams();
  const { lang: uiLang, t } = useLanguage();
  const { currentProject, projectId, loaded, ownerId } = useProject();

  const scope = JSON.stringify([ownerId, projectId]);
  const [initialDraft] = useState(() => loadEditorDraft(scope) ?? loadEditorDraft(projectId));
  const [prompt, setPrompt] = useState(initialDraft?.prompt ?? ((searchParams.get("project") || searchParams.get("projectId")) === projectId ? searchParams.get("prompt") || "" : ""));
  const [brandName, setBrandName] = useState(initialDraft?.brandName ?? currentProject?.name ?? "");
  const [fanoutQueries] = useState<string[]>(() => {
    if (initialDraft) return initialDraft.fanoutQueries || [];
    if ((searchParams.get("project") || searchParams.get("projectId")) !== projectId) return [];
    try { const queries = JSON.parse(searchParams.get("fanouts") || "[]"); return Array.isArray(queries) ? queries.filter(q => typeof q === "string") : []; } catch { return []; }
  });
  const [targetLanguage, setTargetLanguage] = useState<"ja" | "zh-TW" | "en">(initialDraft?.targetLanguage || uiLang);
  const [article, setArticle] = useState<string>(initialDraft?.article || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [articleLogs, setArticleLogs] = useState<any[]>([]);

  // Keyed by verified organization/project; legacy project-only drafts remain recoverable.
  const asyncGuard = useRef(new ProjectAsyncGuard(projectId));
  const editRevision = useRef(0);
  const [storageFailed, setStorageFailed] = useState(() => isDraftUnsaved(scope));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 過去の生成記事一覧を取得（プロジェクト別・非同期ガード付き）
  const fetchArticleLogs = () => {
    if (!projectId || !loaded) {
      setArticleLogs([]);
      return;
    }

    const session = asyncGuard.current.start("article_logs", projectId);
    if (!session) return;

    fetch(`/api/user/articles?projectId=${projectId}`, { signal: session.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch logs");
        return res.json();
      })
      .then((data) => {
        if (!session.isCurrent()) return;
        if (data?.articles && Array.isArray(data.articles)) {
          setArticleLogs(data.articles);
        } else {
          setArticleLogs([]);
        }
      })
      .catch((err) => {
        if (!session.isCurrent() || ProjectAsyncGuard.isAbortError(err)) return;
        setArticleLogs([]);
      });
  };

  useLayoutEffect(() => {
    asyncGuard.current.setProjectId(projectId);
    return () => { asyncGuard.current.cancelAll(); timers.current.forEach(clearTimeout); };
  }, [projectId]);
  useEffect(() => { fetchArticleLogs(); }, [projectId]);
  useEffect(() => {
    setStorageFailed(!saveEditorDraft(scope, { prompt, article, targetLanguage, brandName, fanoutQueries }));
  }, [scope, prompt, article, targetLanguage, brandName, fanoutQueries]);

  const downloadDraft = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ projectId, prompt, article, targetLanguage, brandName, fanoutQueries }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "GEO-draft.json";
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  // 手動編集時の自動保存
  const handlePromptChange = (val: string) => { ++editRevision.current; setPrompt(val); };
  const handleArticleChange = (val: string) => { ++editRevision.current; setArticle(val); };
  const handleRestoreArticle = (art: any) => {
    if (!art || !articleLogs.includes(art)) return;
    ++editRevision.current;
    setPrompt(art.prompt || art.title || ""); setArticle(art.contentMarkdown || "");
    setTargetLanguage(art.language === "en" || art.language === "zh-TW" ? art.language : "ja");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 特定の過去記事をMarkdownとしてダウンロード
  const handleDownloadSpecificMarkdown = (art: any) => {
    const blob = new Blob([art.contentMarkdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (art.title || art.prompt).replace(/[/\\?%*:|"<>]/g, "_") || "AEO_Article";
    link.href = url;
    link.download = `AEO_Article_${safeTitle}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Markdown (.md) ファイルのダウンロード
  const handleDownloadMarkdown = () => {
    if (!article) return;
    const blob = new Blob([article], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safePrompt = prompt.replace(/[/\\?%*:|"<>]/g, "_") || "AEO_Article";
    link.href = url;
    link.download = `AEO_Article_${safePrompt}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PDF / 印刷レポートの呼び出し
  const handlePrintPDF = () => {
    window.print();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || !projectId || !loaded) return;

    // 非同期要求セッションの発行（開始時projectIdの固定＋要求世代）
    const session = asyncGuard.current.start("generate_article", projectId);
    if (!session) return;

    // 通信開始時点の手動編集スナップショットを記録
    const initialRevision = editRevision.current;

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          brandName,
          fanoutQueries,
          targetLanguage,
          projectId: session.projectId,
        }),
        signal: session.signal,
      });

      const data = await res.json();

      // 応答適用直前にプロジェクト所属および要求世代を検証
      if (!session.isCurrent()) {
        return;
      }

      if (!res.ok) throw new Error(data.error || "記事生成に失敗しました。");

      if (typeof data.article !== "string") throw new Error("Invalid article response");

      // 通信中の手動編集保護: ユーザーが待機中に本文を編集していた場合、無条件に上書きしない
      if (editRevision.current !== initialRevision) {
        setInfoMessage(
          uiLang === "zh-TW"
            ? "已生成最新文章。因檢測到手動編輯，未覆蓋當前編輯內容。"
            : uiLang === "en"
            ? "Article generated. Manual edits detected; existing content preserved."
            : "記事が生成されました。待機中の手動編集が検出されたため、入力中の本文は上書きせず保持しました。"
        );
      } else {
        setArticle(data.article);
        saveEditorDraft(scope, {
          prompt,
          article: data.article,
          targetLanguage,
          brandName,
          fanoutQueries,
        });
      }

      fetchArticleLogs();
    } catch (err: any) {
      // キャンセル時や旧世代の遅延catchは現在の画面状態を壊さない
      if (!session.isCurrent() || ProjectAsyncGuard.isAbortError(err)) {
        return;
      }
      setError(err.message);
    } finally {
      if (session.isCurrent()) {
        setLoading(false);
      }
    }
  };

  const handleCopy = async () => {
    const session = asyncGuard.current.start("copy", projectId);
    if (!session) return;
    try {
      await navigator.clipboard.writeText(article);
      if (!session.isCurrent()) return;
      setCopied(true);
      timers.current.push(setTimeout(() => { if (session.isCurrent()) setCopied(false); }, 2000));
    } catch { if (session.isCurrent()) setError("コピーできませんでした / Copy failed"); }
  };

  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans antialiased text-slate-900">
      {storageFailed && <p role="alert">{uiLang === "en" ? "Draft is not saved to this browser. Download it before closing this tab." : uiLang === "zh-TW" ? "草稿未儲存至瀏覽器。關閉分頁前請下載。" : "下書きをブラウザに保存できません。このタブを閉じる前にダウンロードしてください。"}<button type="button" onClick={downloadDraft}>下書き保存 / Download (.json)</button><button type="button" onClick={() => setStorageFailed(!saveEditorDraft(scope, { prompt, article, targetLanguage, brandName, fanoutQueries }))}>再試行 / Retry</button></p>}
      <p className="text-xs text-slate-500">{uiLang === "en" ? "Switching projects hides pending results; server processing and credit usage may continue." : uiLang === "zh-TW" ? "切換專案會停止顯示等待中的結果；伺服器處理與額度使用可能繼續。" : "切替後は待機中の結果を表示しません。サーバー処理と利用枠の消費は続く場合があります。"}</p>
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
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="例: 法人向け おすすめ 費用比較"
                required
                disabled={!projectId || !loaded}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.editor_brand_name}</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => { ++editRevision.current; setBrandName(e.target.value); }}
                required
                disabled={!projectId || !loaded}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.editor_lang_label}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { ++editRevision.current; setTargetLanguage("ja"); }}
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
                  onClick={() => { ++editRevision.current; setTargetLanguage("zh-TW"); }}
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
                  onClick={() => { ++editRevision.current; setTargetLanguage("en"); }}
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

            {infoMessage && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl">
                {infoMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !projectId || !loaded}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {!loaded ? "プロジェクト読み込み中..." : !projectId ? "プロジェクト未選択" : t.editor_btn_generate}
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
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>{t.editor_preview_title}</span>
                </div>

                {article && (
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setViewMode("preview")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        viewMode === "preview" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      プレビュー
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("edit")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        viewMode === "edit" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      手動編集
                    </button>
                  </div>
                )}
              </div>

              {article && (
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? t.editor_copied : t.editor_copy_btn}</span>
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>.md 保存</span>
                  </button>

                  <button
                    onClick={handlePrintPDF}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>PDF/印刷</span>
                  </button>
                </div>
              )}
            </div>

            {/* Printable Header for Article (印刷・PDF出力時のみ紙面トップに表示) */}
            {article && (
              <div className="hidden print:block border-b-2 border-slate-900 pb-4 p-6 mb-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 tracking-widest uppercase">GEO Explorer Article Draft</span>
                    <h1 className="text-2xl font-black text-slate-900 mt-1">AEO直答権威記事 原稿レポート</h1>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono">
                    発行日: {new Date().toLocaleDateString("ja-JP")}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs text-slate-700">
                  <div><strong>ターゲットプロンプト:</strong> {prompt}</div>
                  <div><strong>対象ブランド:</strong> {brandName}</div>
                  <div>{qualityLabel(uiLang)}</div>
                </div>
              </div>
            )}

            {/* Quality Status Bar */}
            {article && (
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 print:hidden">
                <span className="inline-flex items-center gap-1 font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded text-[10px]">
                  {qualityLabel(uiLang)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {storageFailed ? "未保存 / Unsaved" : "保存済み / Saved"}
                </span>
              </div>
            )}

            <div className="flex-1 p-6 overflow-y-auto">
              {article || viewMode === "edit" ? (
                viewMode === "edit" ? (
                  <textarea
                    value={article}
                    onChange={(e) => handleArticleChange(e.target.value)}
                    className="w-full h-full min-h-[400px] p-3 text-xs text-slate-800 font-mono leading-relaxed bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    placeholder="マークダウン原稿を手動編集..."
                  />
                ) : (
                  <div className="prose prose-slate prose-sm max-w-none text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {article}
                  </div>
                )
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

      {/* 過去に生成したAEO記事の保存ログ・履歴一覧テーブル */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 print:hidden mt-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>過去に作成したAEO記事の保存ログ・履歴</span>
            <span className="text-xs text-slate-400 font-normal">({articleLogs.length}件の保存データ)</span>
          </div>
          <span className="text-[11px] text-slate-400">過去の記事をいつでも復元・.md保存・PDF出力できます</span>
        </div>

        {articleLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">作成日時</th>
                  <th className="py-3 px-3">記事タイトル / ターゲットプロンプト</th>
                  <th className="py-3 px-3">執筆言語</th>
                  <th className="py-3 px-3 text-center">{uiLang === "en" ? "Quality" : uiLang === "zh-TW" ? "品質評估" : "品質評価"}</th>
                  <th className="py-3 px-3 text-right">操作（ダウンロード・印刷）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {articleLogs.map((art) => (
                  <tr key={art.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(art.date).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div className="max-w-md truncate">{art.title}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate">KW: {art.prompt}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-bold text-[11px]">
                        {art.language === "zh-TW" ? "🇹🇼 繁體中文" : art.language === "en" ? "🇺🇸 English" : "🇯🇵 日本語"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {qualityLabel(uiLang)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleRestoreArticle(art)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-[11px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>👁️ 復元表示</span>
                      </button>

                      <button
                        onClick={() => handleDownloadSpecificMarkdown(art)}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg transition-colors text-[11px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileDown className="w-3 h-3" />
                        <span>.md 保存</span>
                      </button>

                      <button
                        onClick={() => {
                          handleRestoreArticle(art);
                          const session = asyncGuard.current.start("print", projectId);
                          timers.current.push(setTimeout(() => { if (session?.isCurrent()) window.print(); }, 300));
                        }}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-[11px] inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3 h-3" />
                        <span>PDF/印刷</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            まだ過去に作成した記事ログはありません。上のフォームから記事を生成してください。
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  const { projectId, ownerId, loaded } = useProject();
  if (!loaded || !projectId || !ownerId) return <p role="status">プロジェクトを選択してください / Select a project</p>;
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">読み込み中...</div>}>
      <EditorInner key={JSON.stringify([ownerId, projectId])} />
    </Suspense>
  );
}
