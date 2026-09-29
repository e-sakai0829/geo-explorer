"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Download, ExternalLink, Loader2 } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { csvCell, displayMetric } from '@/lib/seo-chart';
import type { KeywordExplorerResult } from '@/lib/seo-keyword-explorer';

const intentLabels: Record<string, string> = {
  informational: '情報収集', navigational: '指名・移動', commercial: '比較検討', transactional: '購入・申込',
};
function ownHost(domain: string | undefined): string | null {
  if (!domain) return null;
  try { return new URL(domain.includes('://') ? domain : `https://${domain}`).hostname.toLowerCase(); }
  catch { return null; }
}
function matchesHost(host: string, target: string | null): boolean {
  if (!target) return false;
  const normalized = host.toLowerCase();
  return normalized === target || normalized.endsWith(`.${target}`) || target.endsWith(`.${normalized}`);
}

export default function KeywordExplorerPage() {
  const { currentProject } = useProject();
  const projectHost = ownHost(currentProject?.domain);
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState<KeywordExplorerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => { sequence.current++; controller.current?.abort(); }, []);

  async function runSearch(event: React.FormEvent) {
    event.preventDefault();
    const target = keyword.normalize('NFKC').trim();
    if (target.length < 2 || target.length > 80) { setError('2〜80文字のキーワードを入力してください。'); return; }
    controller.current?.abort();
    const id = ++sequence.current;
    const request = new AbortController();
    controller.current = request;
    setLoading(true); setError(null); setResult(null);
    try {
      const response = await fetch('/api/seo/keyword-explorer', {
        method: 'POST', cache: 'no-store', signal: request.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: target }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '取得できませんでした。');
      if (id === sequence.current) setResult(data as KeywordExplorerResult);
    } catch (cause) {
      if (id === sequence.current && !request.signal.aborted)
        setError(cause instanceof Error ? cause.message : '取得できませんでした。');
    } finally { if (id === sequence.current) setLoading(false); }
  }

  function exportCsv() {
    if (!result) return;
    const rows = [
      ['KW', '月間検索数（推計）', 'KD', 'CPC（USD）', '検索意図'],
      ...[result.overview, ...result.related].map(item => [item.keyword, item.volume, item.difficulty, item.cpc, item.intent]),
    ];
    const content = '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `kw-explorer-${result.keyword.replace(/[\\/:*?"<>|]/g, '_')}.csv`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <main className="max-w-[1400px] mx-auto space-y-6 pb-20 text-slate-800">
    <div className="text-xs text-slate-500"><Link href="/dashboard" className="text-indigo-600 hover:underline">ダッシュボード</Link> › SEO › KWエクスプローラー</div>
    <div><h1 className="text-2xl font-black text-slate-900">KWエクスプローラー</h1>
      <p className="text-sm text-slate-600 mt-1">1つのキーワードから、日本語検索の規模・難易度・関連KW・上位サイトを調べます。</p></div>
    <form onSubmit={runSearch} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <label htmlFor="keyword" className="text-sm font-bold">調べるキーワード</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input id="keyword" value={keyword} maxLength={80} onChange={e => {
          sequence.current++;
          controller.current?.abort();
          setKeyword(e.target.value);
          setResult(null);
          setError(null);
          setLoading(false);
        }}
          placeholder="例：梱包資材" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <button type="submit" disabled={loading || keyword.trim().length < 2} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}{loading ? '取得中…' : '調査する'}
        </button>
      </div>
      <p className="text-xs text-slate-500">対象：Google 日本・日本語。未キャッシュの調査はDataForSEOの有料APIを最大3回利用し、SEO分析共通の毎時取得枠を1回消費します。取得結果は原則7日間キャッシュします。</p>
    </form>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {loading && <div role="status" className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">検索データを取得中です。最大20秒程度かかる場合があります。</div>}
    {result && <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold">{result.keyword}</h2><p className="text-xs text-slate-500">DataForSEO推計値 · 取得 {new Date(result.fetchedAt).toLocaleString('ja-JP')} · {result.location}/{result.language}</p></div>
        <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-xs font-bold"><Download size={15} />KW一覧をCSV出力</button>
      </div>
      {result.warnings.length > 0 && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{result.warnings.join(' ')}取得済みの値のみ表示しています。</p>}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="キーワード概要">
        {[['月間検索数', displayMetric(result.overview.volume)], ['難易度（KD）', displayMetric(result.overview.difficulty)], ['CPC（USD）', result.overview.cpc === null ? '—' : `$${result.overview.cpc.toFixed(2)}`], ['検索意図', result.overview.intent ? (intentLabels[result.overview.intent] ?? result.overview.intent) : '—']].map(([label, value]) =>
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-2 break-words text-xl font-bold">{value}</div></div>) }
      </section>
      <p className="text-xs text-slate-500">検索ボリューム・KDは推計値です。KDは検索上位10件に入る難しさの指標で、広告の競合度とは異なります。未取得は「—」と表示します。</p>
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200"><h2 className="font-bold">関連キーワード</h2><p className="text-xs text-slate-500">関連検索から最大8件。新しい調査は「調査する」を押したときだけ実行されます。</p></div>
        {result.related.length ? <div className="overflow-x-auto"><table className="min-w-[640px] w-full text-sm"><thead className="bg-slate-50 text-xs text-slate-600"><tr><th className="p-3 text-left">KW</th><th className="p-3 text-right">月間検索数</th><th className="p-3 text-right">KD</th><th className="p-3 text-right">CPC</th><th className="p-3 text-left">意図</th></tr></thead><tbody>{result.related.map(item => <tr key={item.keyword} className="border-t border-slate-100"><td className="p-3 font-medium">{item.keyword}</td><td className="p-3 text-right">{displayMetric(item.volume)}</td><td className="p-3 text-right">{displayMetric(item.difficulty)}</td><td className="p-3 text-right">{item.cpc === null ? '—' : `$${item.cpc.toFixed(2)}`}</td><td className="p-3">{item.intent ? (intentLabels[item.intent] ?? item.intent) : '—'}</td></tr>)}</tbody></table></div>
          : <p className="p-5 text-sm text-slate-500">関連KWは取得できませんでした。</p>}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200"><h2 className="font-bold">Google検索のオーガニック上位10件</h2><p className="text-xs text-slate-500">広告・AI概要は含めません。対象プロジェクトのドメインと一致するサイトを強調します。DR・被リンクはこの取得では未計測です。</p></div>
        {result.organicResults.length ? <ol className="divide-y divide-slate-100">{result.organicResults.map(item => <li key={`${item.rank}-${item.url}`} className={`p-4 flex gap-3 ${matchesHost(item.domain, projectHost) ? 'bg-emerald-50' : ''}`}><span className="w-7 shrink-0 font-bold text-indigo-700">{item.rank}</span><div className="min-w-0"><a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-slate-900 hover:text-indigo-700 inline-flex items-center gap-1">{item.title}<ExternalLink size={13} /></a><p className="truncate text-xs text-slate-500">{item.domain} · {item.url}</p>{matchesHost(item.domain, projectHost) && <span className="text-xs font-bold text-emerald-700">選択中プロジェクト</span>}</div></li>)}</ol>
          : <p className="p-5 text-sm text-slate-500">上位サイトは取得できませんでした。</p>}
      </section>
    </>}
  </main>;
}
