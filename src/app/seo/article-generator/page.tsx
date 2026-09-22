"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit3,
  Copy,
  Download,
  RotateCcw,
  Check,
  Search,
  Globe,
  Home,
  Loader2,
  HelpCircle,
  Lightbulb,
  ListOrdered,
  BookOpen,
} from "lucide-react";
import { useProject } from "@/context/ProjectContext";

type Step = 0 | 1 | 2 | 3 | 4;

interface PersonaData {
  basic: string;
  story: string;
  values: string;
  needs: string;
  insight: {
    surfaceProblem: string;
    coreInsight: string;
    asIs: string;
    toBe: string;
  };
}

interface TitleItem {
  title: string;
  intentDescription: string;
}

interface CooccurrenceWord {
  word: string;
  count: number;
}

export default function MierucaArticleGeneratorPage() {
  const { currentProject } = useProject();

  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ステップ0: 入力
  const [theme, setTheme] = useState("");
  const [keyword, setKeyword] = useState("");
  const [serviceUrl, setServiceUrl] = useState(currentProject?.domain ? `https://${currentProject.domain}` : "https://example.com");
  const [suggestKeywords, setSuggestKeywords] = useState("");
  const [language, setLanguage] = useState("ja");

  // ステップ1: ペルソナ
  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [isEditingPersona, setIsEditingPersona] = useState(false);

  // ステップ2: タイトル
  const [titles, setTitles] = useState<TitleItem[]>([]);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number>(0);
  const [customTitle, setCustomTitle] = useState("");

  // ステップ3: 見出し構成
  const [outlineText, setOutlineText] = useState("");
  const [knowledgeSources, setKnowledgeSources] = useState<string[]>([]);

  // ステップ4: 本文エディタ
  const [articleHtml, setArticleHtml] = useState("");
  const [cooccurrenceWords, setCooccurrenceWords] = useState<CooccurrenceWord[]>([]);
  const [copied, setCopied] = useState(false);

  // ──────────────────────────────────────────
  // アクションハンドラー
  // ──────────────────────────────────────────

  // ステップ0 ➔ 1: ペルソナ生成
  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seo/article-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-persona",
          keyword,
          theme: theme || keyword,
          serviceUrl,
          suggestKeywords,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ペルソナ生成に失敗しました。");
      setPersona(data.persona);
      setCurrentStep(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ステップ1 ➔ 2: タイトル生成
  const handleProceedToTitles = async () => {
    if (!persona) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seo/article-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-titles",
          keyword,
          persona,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "タイトル生成に失敗しました。");
      setTitles(data.titles || []);
      setSelectedTitleIndex(0);
      setCustomTitle(data.titles?.[0]?.title || "");
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ステップ2 ➔ 3: 見出し構成生成
  const handleProceedToOutline = async () => {
    const activeTitle = customTitle.trim() || titles[selectedTitleIndex]?.title;
    if (!activeTitle) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seo/article-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-outline",
          keyword,
          title: activeTitle,
          persona,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "見出し構成案の生成に失敗しました。");
      setOutlineText(data.outlineText || "");
      setKnowledgeSources(data.knowledgeSources || []);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ステップ3 ➔ 4: 本文生成
  const handleProceedToArticle = async () => {
    const activeTitle = customTitle.trim() || titles[selectedTitleIndex]?.title;
    if (!activeTitle || !outlineText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seo/article-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-article",
          keyword,
          title: activeTitle,
          outline: outlineText,
          knowledgeSources,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "記事本文の生成に失敗しました。");
      setArticleHtml(data.articleHtml || "");
      setCooccurrenceWords(data.cooccurrenceWords || []);
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // HTMLコピー
  const handleCopyHtml = () => {
    navigator.clipboard.writeText(articleHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Word (.doc) ダウンロード
  const handleDownloadWord = () => {
    const activeTitle = customTitle.trim() || titles[selectedTitleIndex]?.title || "SEO記事";
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${activeTitle}</title></head><body><h1>${activeTitle}</h1>`;
    const footer = "</body></html>";
    const sourceHTML = header + articleHtml + footer;
    const blob = new Blob(["\ufeff", sourceHTML], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTitle}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-24 font-sans text-slate-800 antialiased">
      {/* 1. パンくず */}
      <div className="flex items-center gap-1.5 text-xs text-sky-600 font-medium">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/dashboard" className="hover:underline">ホーム</Link>
        <span className="text-slate-400">&gt;</span>
        <span className="text-slate-600">かんたんAI記事生成</span>
        {currentStep > 0 && (
          <>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-900 font-bold">生成ステップ</span>
          </>
        )}
      </div>

      {/* 2. タイトル */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          かんたんAI記事生成
        </h1>
        {currentStep === 0 && (
          <p className="text-xs text-slate-500">キーワードを入力するだけで、かんたんにSEO記事を作成できます</p>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* 3. ステップインジケーター（ステップ1以上で表示） */}
      {currentStep > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto pt-2">
            {[
              { num: 1, label: "ペルソナ" },
              { num: 2, label: "タイトル" },
              { num: 3, label: "見出し" },
              { num: 4, label: "エディタ" },
              { num: 5, label: "出力" },
            ].map((step, idx) => {
              const isPassed = currentStep > step.num;
              const isCurrent = currentStep === step.num;

              return (
                <div key={idx} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-2xs ${
                        isPassed
                          ? "bg-sky-500 text-white"
                          : isCurrent
                          ? "bg-sky-500 text-white ring-4 ring-sky-100"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : step.num}
                    </div>
                    <span className={`text-[11px] mt-1 font-bold ${isCurrent ? "text-sky-600" : "text-slate-500"}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < 4 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 -mt-4 transition-colors ${
                        currentStep > step.num ? "bg-sky-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ナビゲーションボタン（前に戻る / 次のステップへ） */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1) as Step)}
              disabled={loading}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>前に戻る</span>
            </button>

            {currentStep === 1 && (
              <button
                onClick={handleProceedToTitles}
                disabled={loading}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>次のステップへ（タイトル生成）</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={handleProceedToOutline}
                disabled={loading}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>次のステップへ（見出し構成案）</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={handleProceedToArticle}
                disabled={loading}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>次のステップへ（本文一括生成）</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────
          ステップ0: 初期入力画面 (キャプチャ03完全再現)
         ────────────────────────────────────────── */}
      {currentStep === 0 && (
        <div className="space-y-8">
          <form onSubmit={handleStartGeneration} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 左カラム: 入力フォーム */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    記事のテーマ（プロジェクト名）
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="例: バーチャルオフィスおすすめ比較"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                    対策キーワード <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="例: バーチャルオフィス 比較"
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    サービスサイト (最大3つ)
                  </label>
                  <input
                    type="url"
                    value={serviceUrl}
                    onChange={(e) => setServiceUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>サジェストキーワード（任意）</span>
                    <span className="text-sky-600 text-[10px] cursor-pointer hover:underline">候補キーワードを検索する ↗</span>
                  </label>
                  <textarea
                    value={suggestKeywords}
                    onChange={(e) => setSuggestKeywords(e.target.value)}
                    placeholder="格安, おすすめ, 法人登記, 郵便転送..."
                    rows={2}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 右カラム: 詳細設定（ミエルカスタイル） */}
              <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-4 text-xs">
                <div className="font-bold text-slate-700 border-b border-slate-200 pb-2">
                  ⚙ 詳細設定
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-slate-600">記事本文の言語</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="lang"
                        value="ja"
                        checked={language === "ja"}
                        onChange={() => setLanguage("ja")}
                      />
                      <span>日本語</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="lang"
                        value="en"
                        checked={language === "en"}
                        onChange={() => setLanguage("en")}
                      />
                      <span>英語</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="lang"
                        value="zh-TW"
                        checked={language === "zh-TW"}
                        onChange={() => setLanguage("zh-TW")}
                      />
                      <span>繁體中文</span>
                    </label>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-2 text-[11px] text-slate-600">
                  <div className="font-bold text-indigo-900 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    自社メディアの私感を反映する
                  </div>
                  <p>貴社独自のノウハウやコンサルティング知見を記事内に自然に反映し、AI臭さを排除します。</p>
                </div>
              </div>
            </div>

            {/* スタートボタン */}
            <div className="text-center pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 bg-[#eab308] hover:bg-[#ca8a04] text-slate-900 font-extrabold text-sm rounded shadow-sm transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>✏️ 記事生成スタート</span>}
              </button>
            </div>
          </form>

          {/* プロジェクト一覧（キャプチャ03下部） */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">プロジェクト一覧</h3>
            <div className="bg-white border border-slate-300 rounded overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">作成日</th>
                    <th className="py-2.5 px-3">プロジェクト名</th>
                    <th className="py-2.5 px-3">対策キーワード</th>
                    <th className="py-2.5 px-3">作成者</th>
                    <th className="py-2.5 px-3 text-center">ステータス</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-500">2026/09/22</td>
                    <td className="py-2.5 px-3 font-bold text-sky-600 hover:underline cursor-pointer">
                      バーチャルオフィス徹底比較
                    </td>
                    <td className="py-2.5 px-3 font-mono">バーチャルオフィス 比較</td>
                    <td className="py-2.5 px-3">酒井 栄二郎</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-bold rounded text-[10px]">
                        エディタ
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-500">2026/09/18</td>
                    <td className="py-2.5 px-3 font-bold text-sky-600 hover:underline cursor-pointer">
                      月極駐車場 埋まらない 対策
                    </td>
                    <td className="py-2.5 px-3 font-mono">月極駐車場 埋まらない</td>
                    <td className="py-2.5 px-3">酒井 栄二郎</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">
                        タイトル
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────
          ステップ①: ペルソナ表示 (キャプチャ04完全再現)
         ────────────────────────────────────────── */}
      {currentStep === 1 && persona && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">基本のペルソナ</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingPersona(!isEditingPersona)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded border border-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingPersona ? "完了" : "編集する"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs leading-relaxed">
            {/* 基本情報・属性 */}
            <div className="space-y-1">
              <div className="font-bold text-slate-700">基本情報・属性</div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-800">
                {persona.basic}
              </div>
            </div>

            {/* ストーリー */}
            <div className="space-y-1">
              <div className="font-bold text-slate-700">ストーリー</div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-800">
                {persona.story}
              </div>
            </div>

            {/* 価値観・行動 */}
            <div className="space-y-1">
              <div className="font-bold text-slate-700">価値観・行動</div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-800">
                {persona.values}
              </div>
            </div>

            {/* ニーズ・興味関心 */}
            <div className="space-y-1">
              <div className="font-bold text-slate-700">ニーズ・興味関心</div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-800 whitespace-pre-line">
                {persona.needs}
              </div>
            </div>

            {/* インサイト (AS-IS / TO-BE) */}
            <div className="pt-2 space-y-2">
              <div className="font-bold text-slate-900 text-sm">インサイト</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded space-y-1">
                  <div className="font-bold text-amber-900">表面的な課題</div>
                  <p className="text-slate-700">{persona.insight.surfaceProblem}</p>
                </div>
                <div className="p-3 bg-sky-50/60 border border-sky-200 rounded space-y-1">
                  <div className="font-bold text-sky-900">本質的なインサイト</div>
                  <p className="text-slate-700">{persona.insight.coreInsight}</p>
                </div>
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded space-y-1">
                  <div className="font-bold text-rose-900">現在の状態 (AS-IS)</div>
                  <p className="text-slate-700">{persona.insight.asIs}</p>
                </div>
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded space-y-1">
                  <div className="font-bold text-emerald-900">未来の姿 (TO-BE)</div>
                  <p className="text-slate-700">{persona.insight.toBe}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────
          ステップ②: タイトル選択 (キャプチャ05完全再現)
         ────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="text-xs font-bold text-slate-700">
              {titles.length} 件表示中
            </div>
            <span className="text-[11px] text-slate-400">クリックして記事タイトルを選択してください</span>
          </div>

          <div className="space-y-3">
            {titles.map((item, idx) => {
              const isSelected = selectedTitleIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedTitleIndex(idx);
                    setCustomTitle(item.title);
                  }}
                  className={`p-4 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? "bg-sky-50/80 border-sky-400 ring-2 ring-sky-200 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                    {isSelected && (
                      <span className="px-2 py-0.5 bg-sky-500 text-white font-bold text-[10px] rounded shrink-0">
                        選択中
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-slate-600">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item.intentDescription}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 自由編集エリア */}
          <div className="pt-4 border-t border-slate-100 space-y-1">
            <label className="block text-xs font-bold text-slate-700">選択中タイトルの直接編集</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-sky-500 focus:outline-hidden font-bold text-slate-900"
            />
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────
          ステップ③: 見出し構成 (キャプチャ06完全再現)
         ────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左カラム: 見出しエディタ */}
          <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">{customTitle}</h2>
              <div className="text-[11px] text-slate-400 mt-1">対策キーワード: {keyword}</div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>見出しの構成を決める (自由編集可能)</span>
                <span className="text-[11px] text-slate-400 font-mono">&lt;h1&gt; &lt;h2&gt; &lt;h3&gt;</span>
              </label>
              <textarea
                value={outlineText}
                onChange={(e) => setOutlineText(e.target.value)}
                rows={16}
                className="w-full p-4 font-mono text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-sky-500 focus:outline-hidden leading-relaxed text-slate-800"
              />
            </div>
          </div>

          {/* 右カラム: AIナレッジソース */}
          <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <BookOpen className="w-3.5 h-3.5 text-sky-500" />
              <span>AIナレッジソース (網羅推奨トピック)</span>
            </div>

            <div className="space-y-2 text-xs">
              {knowledgeSources.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────
          ステップ④: 記事本文エディタ (キャプチャ07完全再現)
         ────────────────────────────────────────── */}
      {currentStep === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左カラム: 本文エディタ */}
          <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">{customTitle}</h2>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  文字数: <strong className="font-mono text-slate-900">{articleHtml.length.toLocaleString()}</strong> 文字
                </div>
              </div>

              {/* ダウンロードアクション */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyHtml}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded border border-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "コピー完了" : "HTMLコピー"}</span>
                </button>
                <button
                  onClick={handleDownloadWord}
                  className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Word (.doc) 出力</span>
                </button>
              </div>
            </div>

            {/* 本文プレビュー/編集 */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">記事本文 (HTMLエディタ)</label>
              <textarea
                value={articleHtml}
                onChange={(e) => setArticleHtml(e.target.value)}
                rows={22}
                className="w-full p-4 font-mono text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-sky-500 focus:outline-hidden leading-relaxed text-slate-800"
              />
            </div>
          </div>

          {/* 右カラム: 重要トピック / 共起語チェックリスト */}
          <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ListOrdered className="w-3.5 h-3.5 text-sky-500" />
              <span>重要トピック / 共起語チェック</span>
            </div>

            <div className="border border-slate-200 rounded overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">重要トピック</th>
                    <th className="py-2 px-3 text-right">本文内の出現回数</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cooccurrenceWords.map((cw, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-800">{cw.word}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 flex items-center justify-end gap-1">
                        <span>{cw.count} 回</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              本文内に網羅されている重要キーワードの頻度を自動解析しています。上位表示に必要な共起トピックが十分に満たされています。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
