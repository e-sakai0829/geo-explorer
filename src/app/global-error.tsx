"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Root Layout Error:", error);
  }, [error]);

  return (
    <html lang="ja">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">システムエラーが発生しました</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              アプリケーションの最上位レイヤーで予期せぬ例外が発生しました。再試行ボタンを押して復帰するか、ページ全体を再読み込みしてください。
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
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>アプリケーションを再試行</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
