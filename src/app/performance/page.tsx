"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ExternalLink, 
  Search,
  Bot,
  Layers,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useProject } from "@/context/ProjectContext";

import { sanitizeTrackedItems, observationLabel, observationState, trackedCitationSummary } from "@/lib/measurement-display";
import { ProjectAsyncGuard } from "@/lib/project-async-guard";

// Failed writes remain recoverable during same-tab project navigation.
const transientItems = new Map<string, any[]>();

function PerformanceInner() {
  const { lang, t } = useLanguage();
  const { currentProject, projectId, loaded, ownerId } = useProject();

  const [brandName, setBrandName] = useState("自社ブランド");
  const [domain, setDomain] = useState("https://example.com");
  const [hasArticles, setHasArticles] = useState(false);

  const [trackedItems, setTrackedItems] = useState<any[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [rescanningId, setRescanningId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<any | null>(null);

  const [storageFailed, setStorageFailed] = useState(false);
  const itemsRef = useRef(trackedItems);
  const rescanBusy = useRef(false);
  const storageKey = "geo_performance_tracked_" + JSON.stringify([ownerId, projectId]);
  // 非同期セッション管理ガード
  const asyncGuard = useRef(new ProjectAsyncGuard(projectId));

  useEffect(() => {
    if (currentProject) {
      setBrandName(currentProject.name || (lang === "zh-TW" ? "自社品牌" : lang === "en" ? "My Brand" : "自社ブランド"));
      setDomain(currentProject.domain || "https://example.com");
    }
  }, [currentProject, lang]);

  useLayoutEffect(() => () => asyncGuard.current.cancelAll(), []);

  // プロジェクトごとの追跡アイテム復元・プロジェクト切替時クリーンアップ
  useEffect(() => {
    // 切替時は旧プロジェクトの進行中通信を全キャンセルし、別プロジェクトのレポート表示を閉じる
    asyncGuard.current.setProjectId(projectId);
    setActiveReport(null);
    setRescanningId(null);

    if (!projectId || !loaded) {
      setTrackedItems([]);
      setHasArticles(false);
      return;
    }


    itemsRef.current = [];
    let saved: string | null = null;
    try {
      setStorageFailed(transientItems.has(storageKey));
      saved = transientItems.has(storageKey) ? JSON.stringify(transientItems.get(storageKey)) : typeof window !== "undefined" ? (localStorage.getItem(storageKey) ?? localStorage.getItem(`geo_performance_tracked_${projectId}`)) : null;
    } catch {
      setStorageFailed(true);
    }

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const sanitized = sanitizeTrackedItems(parsed);
        itemsRef.current = sanitized;
        setTrackedItems(sanitized);
        setHasArticles(sanitized.length > 0);
      } catch {
        setTrackedItems([]);
        setHasArticles(false);
      }
    } else {
      setTrackedItems([]);
      setHasArticles(false);
    }

    return () => {
      asyncGuard.current.cancelAll();
    };
  }, [projectId, loaded]);

  const saveTrackedItems = (items: any[]) => {
    if (!projectId) return;
    transientItems.set(storageKey, items);
    itemsRef.current = items;
    setTrackedItems(items);
    setHasArticles(items.length > 0);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(items));
        transientItems.delete(storageKey);
        setStorageFailed(false);
      }
    } catch {
      setStorageFailed(true);
    }
  };

  // 公開URLの新規登録
  const handleRegisterUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt || !newUrl || !projectId || !loaded) return;

    const newItem = {
      id: crypto.randomUUID(),
      prompt: newPrompt,
      url: newUrl,
      date: new Date().toISOString(),
      status: "pending",
      hasBaseline: false,
      beforeStatus: lang === "zh-TW" ? "基準未測定 (無公開前數據)" : lang === "en" ? "Baseline Unmeasured" : "ベースライン未測定 (施策前データなし)",
      afterStatus: lang === "zh-TW" ? "索引與AI學習中 (需再次掃描)" : lang === "en" ? "Indexing & AI Learning (Rescan Required)" : "インデックス・AI学習待ち (要再スキャン)",
      lastScannedAt: null,
      aiResponse: null,
      brandMentioned: false,
      brandCited: false,
    };

    const updated = [newItem, ...itemsRef.current];
    saveTrackedItems(updated);
    setNewPrompt("");
    setNewUrl("");
  };

  // 1クレジットを使って効果測定（再スキャン）を実行（所属固定・世代ガード付き）
  const handleRescan = async (item: any) => {
    if (!projectId || !loaded || rescanBusy.current) return;

    const channel = "rescan";
    const session = asyncGuard.current.start(channel, projectId);
    if (!session) return;

    rescanBusy.current = true;
    setActiveReport(null);
    setRescanningId(item.id);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: item.prompt,
          brandName,
          competitors: currentProject?.competitors || [],
          targetLocale: lang,
          projectId: session.projectId,
        }),
        signal: session.signal,
      });

      const data = await res.json();

      // 応答適用直前にプロジェクト所属および要求世代を検証
      if (!session.isCurrent()) {
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || (lang === "zh-TW" ? "再次掃描驗證失敗" : lang === "en" ? "Rescan failed" : "再検証スキャンに失敗しました。"));
      }

      const updated = itemsRef.current.map((t) => {
        if (t.id === item.id) {
          return {
            ...t,
            status: data.outcome === "unmeasured" ? "pending" : "verified",
            promptId: data.promptId, surface: data.surface, scoreVersion: data.scoreVersion, modelName: data.modelName, locale: data.locale, outcome: data.outcome,
            lastScannedAt: data.measuredAt || new Date().toISOString(),
            brandMentioned: data.brandMentioned,
            brandCited: data.brandCited,
            aiResponse: data.aiResponse,
            citationSources: data.citationSources || [],
          };
        }
        return t;
      });

      saveTrackedItems(updated);
      const currentVerified = updated.find((t) => t.id === item.id);
      if (session.isCurrent()) {
        setActiveReport(currentVerified);
      }
    } catch (err: any) {
      if (!session.isCurrent() || ProjectAsyncGuard.isAbortError(err)) {
        return;
      }
      alert(err.message);
    } finally {
      if (session.isCurrent()) {
        rescanBusy.current = false;
        setRescanningId(null);
      }
    }
  };

  const citationSummary = trackedCitationSummary(trackedItems, "gemini-3.6-flash", lang === "en" ? "en-US" : lang === "ja" ? "ja-JP" : "zh-TW");
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans antialiased text-slate-900">
      {storageFailed && <p role="alert">{lang === "en" ? "Changes are not saved. Keep this page open and retry saving." : lang === "zh-TW" ? "變更尚未儲存。請保留此頁面並重試儲存。" : "変更を保存できません。この画面を閉じずに保存を再試行してください。"}<button onClick={() => saveTrackedItems(itemsRef.current)}>再試行 / Retry</button></p>}
      <p className="text-xs text-slate-500">{lang === "en" ? "Switching projects hides pending results; processing and credit usage may continue." : lang === "zh-TW" ? "切換專案後不顯示等待中的結果；處理與額度使用可能繼續。" : "切替後は待機中の結果を表示しません。処理と利用枠の消費は続く場合があります。"}</p>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <TrendingUp className="w-3.5 h-3.5" />
          Closed-loop Performance Tracker
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t.perf_title}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {lang === "zh-TW"
            ? "追蹤並驗證發布之 AEO 直答專文在 Google AI Overviews 中的引用與推薦時序成效"
            : lang === "en"
            ? "Track and verify the timeline impact of your published AEO articles in Google AI Overviews."
            : "生成・公開した AEO 直答記事が、Google AI Overviews に引用・推薦されるまでの時系列推移を追跡・効果検証します"}
        </p>
      </div>

      {/* 1. 公開済み AEO記事 URL 登録フォーム */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
            <ExternalLink className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {lang === "zh-TW" ? "🔗 註冊已發布之 AEO 專文 (自社網址)" : lang === "en" ? "🔗 Register Published AEO Article URL" : "🔗 公開済み AEO記事（自社URL）の登録"}
            </h3>
            <p className="text-[11px] text-slate-400">
              {lang === "zh-TW"
                ? "輸入已發布於自社網站或官方媒體之專文 URL 以開啟成效追蹤"
                : lang === "en"
                ? "Register the URL published on your official website to start tracking performance."
                : "自社オウンドメディアやWebサイトに公開した記事のURLを登録して効果測定を開始します"}
            </p>
          </div>
        </div>

        <form onSubmit={handleRegisterUrl} className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          <div className="md:col-span-5 space-y-1">
            <label className="block font-bold text-slate-700">
              {lang === "zh-TW" ? "目標商業提示詞 (KW)" : lang === "en" ? "Target Query (KW)" : "対策ターゲットKW (プロンプト)"} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder={lang === "zh-TW" ? "例如: 企業品牌定位 費用 比較" : lang === "en" ? "e.g. Purpose Branding Agency Comparison" : "例: パーパスブランディング 費用 比較"}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-5 space-y-1">
            <label className="block font-bold text-slate-700">
              {lang === "zh-TW" ? "已發布專文之自社 URL" : lang === "en" ? "Published Article URL" : "公開した記事の自社URL"} <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://www.smo-inc.com/purpose-branding-guide"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              <span>{lang === "zh-TW" ? "註冊 URL" : lang === "en" ? "Register URL" : "URLを登録"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* 2. Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">
            {lang === "zh-TW" ? "追蹤中發布專文" : lang === "en" ? "Tracked Articles" : "公開・トラッキング中記事"}
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {trackedItems.length} <span className="text-xs font-normal text-slate-400">{lang === "zh-TW" ? "篇" : lang === "en" ? "Articles" : "本"}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {trackedItems.length > 0 
              ? (lang === "zh-TW" ? "正在監控自社網域之公開專文" : lang === "en" ? "Monitoring published domain articles" : "自社ドメインの公開記事を監視中")
              : (lang === "zh-TW" ? "註冊 URL 後將自動累計" : lang === "en" ? "Auto-tracked upon URL registration" : "記事URLを登録すると自動集計されます")}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">Gemini API / v2 引用率</div>
          <p className="text-xs">gemini-3.6-flash / {lang} / 同一プロンプトの最新成功のみ</p>
          <div className="text-3xl font-black text-indigo-600">{citationSummary.rate === null ? '未計測' : Math.round(citationSummary.rate * 100) + '%'}</div>
          <p className="text-xs">引用 {citationSummary.cited} / 計測済み {citationSummary.count}件（この端末の保存記録）</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500">
            {lang === "zh-TW" ? "預估獲得引用平均天數" : lang === "en" ? "Est. Days to Citation" : "平均引用獲得までの目安"}
          </div>
          <div className="text-3xl font-black text-slate-400 tracking-tight">
            {lang === "zh-TW" ? "未測定" : lang === "en" ? "Unmeasured" : "未計測"}
          </div>
          <div className="text-[11px] text-slate-400">
            {lang === "zh-TW" ? "需累積足夠追蹤歷程方可呈現" : lang === "en" ? "Requires sufficient tracked history" : "十分な追跡履歴が蓄積されるまで未計測"}
          </div>
        </div>
      </div>

      {/* 3. トラッキング登録済みURL＆効果測定一覧テーブル */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Search className="w-4 h-4 text-indigo-600" />
            <span>{lang === "zh-TW" ? "已對策 URL 追蹤與成效驗證清單" : lang === "en" ? "Tracked URLs & Performance Tracker" : "対策済みURL・効果測定トラッカー一覧"}</span>
            <span className="text-xs text-slate-400 font-normal">({trackedItems.length} {lang === "zh-TW" ? "個 URL" : lang === "en" ? "URLs" : "件の公開URL"})</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {lang === "zh-TW" ? "點擊「1額度再次驗證」直接檢測 AI 搜尋反映成效" : lang === "en" ? "Click '1-Credit Rescan' to test live AI Overview impact" : "「1クレジット再検証」でAI検索への反映効果を直接測定できます"}
          </span>
        </div>

        {trackedItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">{lang === "zh-TW" ? "註冊日期" : lang === "en" ? "Date" : "登録日時"}</th>
                  <th className="py-3 px-3">{lang === "zh-TW" ? "目標 KW / 已發布 URL" : lang === "en" ? "Target KW / Published URL" : "ターゲットKW / 公開自社URL"}</th>
                  <th className="py-3 px-3">{lang === "zh-TW" ? "成效追蹤狀態 (After Status)" : lang === "en" ? "After Status" : "効果測定状況 (After Status)"}</th>
                  <th className="py-3 px-3 text-right">{lang === "zh-TW" ? "驗證操作" : lang === "en" ? "Action" : "検証操作"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {trackedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div className="text-slate-900 font-bold">{item.prompt}</div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-600 hover:underline font-mono inline-flex items-center gap-1 truncate max-w-xs"
                      >
                        <span>{item.url}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 px-3 font-semibold text-xs">
                      {observationState(item) === "cited" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {observationLabel(item, lang)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[11px]">
                          {observationLabel(item, lang)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleRescan(item)}
                        disabled={rescanningId !== null}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-lg transition-colors text-xs inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{rescanningId === item.id ? (lang === "zh-TW" ? "掃描中..." : lang === "en" ? "Scanning..." : "再スキャン中...") : (lang === "zh-TW" ? "1額度再次驗證" : lang === "en" ? "1-Credit Rescan" : "1クレジットで再検証")}</span>
                      </button>

                      <p className="text-xs text-slate-500">{item.surface === "gemini_api" && item.scoreVersion === "v2" ? 'Gemini API / v2 / ' + item.modelName + ' / ' + item.locale : '旧記録（観測面・採点版未確認）'}</p>
                      {item.lastScannedAt && (
                        <button
                          onClick={() => setActiveReport(item)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>📊 Before/After {lang === "zh-TW" ? "報告" : lang === "en" ? "Report" : "レポート"}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <div>{lang === "zh-TW" ? "尚無追蹤中之 AEO 專文 URL" : lang === "en" ? "No tracked AEO article URLs yet." : "まだ効果測定対象のAEO記事URLが登録されていません。"}</div>
            <div className="text-[11px] text-slate-500">
              {lang === "zh-TW" ? "請於上方表單註冊已發布之 URL，並執行「1額度再次驗證」。" : lang === "en" ? "Register your published URL above and click '1-Credit Rescan'." : "上のフォームから公開した自社URLを登録し、「1クレジット再検証」を実行してください。"}
            </div>
          </div>
        )}
      </div>

      {/* 4. Active Before/After Report Modal / Card */}
      {activeReport && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/30 space-y-6">
          <div className="flex items-center justify-between border-b border-indigo-500/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                <TrendingUp className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                  {lang === "zh-TW" ? "AEO 觀測報告（基準未測定）" : lang === "en" ? "AEO Observation Report (Baseline Unmeasured)" : "AEO観測レポート（ベースライン未測定）"}
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                  {lang === "zh-TW" ? "關鍵字" : lang === "en" ? "Keyword" : "キーワード"}: 「{activeReport.prompt}」
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Before */}
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 bg-slate-700/50 px-2.5 py-0.5 rounded-full border border-slate-600 uppercase tracking-wider">
                Before ({lang === "zh-TW" ? "公開前" : lang === "en" ? "Pre-Release" : "公開前"})
              </span>
              <h4 className="text-sm font-bold text-slate-200">
                {lang === "zh-TW" ? "公開前基準未測定" : lang === "en" ? "Baseline unmeasured" : "施策前ベースライン未測定"}
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {lang === "zh-TW" ? "沒有可驗證的事前觀測記錄，無法比較前後變化。" : lang === "en" ? "No verifiable baseline record is available; before/after comparison is unavailable." : "検証可能な事前観測記録がないため、施策前後は比較できません。"}
              </p>
            </div>

            {/* After */}
            <div className="bg-indigo-900/60 p-5 rounded-2xl border border-indigo-400/40 space-y-2">
              <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                After ({lang === "zh-TW" ? "最新觀測" : lang === "en" ? "Latest Scan" : "最新観測"})
              </span>
              <h4 className="text-sm font-bold text-emerald-300">
                {observationLabel(activeReport, lang)}
              </h4>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {lang === "zh-TW" ? "網域層級的觀測不代表此登錄文章 URL 已被引用。" : lang === "en" ? "A domain-level observation does not confirm citation of this registered article URL." : "ドメイン単位の観測であり、登録した記事URL自体の引用を示すものではありません。"}
              </p>
            </div>
          </div>

          {activeReport.aiResponse && (
            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 text-xs space-y-2">
              <div className="text-indigo-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === "zh-TW" ? "最新 Gemini 掃描解答結果" : lang === "en" ? "Latest Gemini Scan Response" : "最新の保存済み回答結果"}
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap font-sans">
                {activeReport.surface === 'gemini_api' && activeReport.scoreVersion === 'v2' ? 'Gemini API / v2 / ' + activeReport.modelName + ' / ' + activeReport.locale : '旧記録（観測面・採点版未確認）'}{'\n'}{activeReport.aiResponse}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Demo Case Preview Guide */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white space-y-3 shadow-md border border-indigo-500/30">
        <div className="font-bold text-xs text-indigo-300 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          {lang === "zh-TW" ? "【參考】AEO 引用獲得架構示意模型（非個別實測保證）" : lang === "en" ? "[Reference] AEO Citation Mechanism Model (Not a Guarantee)" : "【参考】AEO 施策による引用獲得モデル（※一般的な挙動シミュレーションであり、個別ドメインの実測保証ではありません）"}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <div className="font-bold text-slate-400">{lang === "zh-TW" ? "施策前（典型情境）" : lang === "en" ? "Pre-Implementation (Typical)" : "施策前（典型的な課題例）"}</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {lang === "zh-TW"
                ? "• AI 摘要完全未提及自社品牌\n• 比較媒體或競品獲得較多引用機會"
                : lang === "en"
                ? "• No baseline measurement"
                : "• AI回答内で自社ブランドへの言及や引用が見当たらない状態\n• 比較サイトや競合メディアのみが情報源として参照される傾向"}
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <div className="font-bold text-emerald-400">{lang === "zh-TW" ? "專文對策後（目標狀態）" : lang === "en" ? "Post-Optimization (Target State)" : "対策後（目標状態）"}</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {lang === "zh-TW"
                ? "• 透過 35-65 字直答與結構化標籤，提升 AI 引用機會\n• 建立自社一次情報來源以爭取引用卡片"
                : lang === "en"
                ? "• 35-65 character direct answers and schema markup increase citation likelihood\n• Primary domain established as authoritative reference"
                : "• 35〜65文字の直答構造とFAQ構造化により、AIの引用可能性を高める\n• 自社一次ソースとしての認知を確立し、公式参照カードの獲得を目指す"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const { projectId, ownerId, loaded } = useProject();
  if (!loaded || !projectId || !ownerId) return <p role="status">プロジェクトを選択してください / Select a project</p>;
  return <PerformanceInner key={JSON.stringify([ownerId, projectId])} />;
}
