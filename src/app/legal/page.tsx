"use client";

import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

export default function LegalPage() {
  return (
    <div className="-m-8 min-h-screen bg-slate-50 text-slate-900 py-12 px-6 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          トップページに戻る
        </Link>

        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Specified Commercial Transactions Act
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            特定商取引法に基づく表記
          </h1>
          <p className="text-xs text-slate-500 mt-1">Traditionalart Inc.</p>
        </div>

        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <tbody className="divide-y divide-slate-100">
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">販売事業者名</th>
                <td className="sm:w-2/3 py-3 text-slate-700">Traditionalart Inc.</td>
              </tr>
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">運営責任者</th>
                <td className="sm:w-2/3 py-3 text-slate-700">酒井 栄二郎 (Eijiro Sakai)</td>
              </tr>
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">問い合わせ窓口</th>
                <td className="sm:w-2/3 py-3 text-slate-700">
                  メール: support@traditionalart.biz<br />
                  Web: https://geo.traditionalart.biz
                </td>
              </tr>
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">お支払い方法</th>
                <td className="sm:w-2/3 py-3 text-slate-700">クレジットカード決済（Stripe安全決済）</td>
              </tr>
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">商品代金以外の必要料金</th>
                <td className="sm:w-2/3 py-3 text-slate-700">インターネット接続料金、通信料金等はお客様のご負担となります。</td>
              </tr>
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">役務の提供時期</th>
                <td className="sm:w-2/3 py-3 text-slate-700">クレジットカード決済完了後、即座にご利用いただけます。</td>
              </tr>
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">解約・返金について</th>
                <td className="sm:w-2/3 py-3 text-slate-700">
                  管理画面のStripe請求ポータルよりいつでもワンクリックで次回更新を停止（解約）できます。解約後も当月末まで全機能をご利用いただけます。サービスの性質上、返金は原則として受け付けておりません。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
