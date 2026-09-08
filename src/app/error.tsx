"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">画面の読み込み中にエラーが発生しました</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            一時的な通信エラーまたはデータの整合性の問題が発生した可能性があります。再読み込みをお試しいただくか、ダッシュボードへお戻りください。
          </p>
        </div>

        {error.message && (
          <div className="p-3 bg-slate-50 rounded-xl text-left border border-slate-200">
            <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Error details:</div>
            <div className="text-xs text-rose-600 font-mono truncate mt-0.5">{error.message}</div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>再試行する</span>
          </button>
          <Link
            href="/dashboard"
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>ホームへ戻る</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
