"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

export default function LegalPage() {
  const [lang, setLang] = useState<"ja" | "zh-TW" | "en">("ja");

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

        {/* Header with Language Tabs */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              Legal & Business Disclosures
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {lang === "ja" && "特定商取引法に基づく表記"}
              {lang === "zh-TW" && "特定商業交易法標示 (Legal Notice)"}
              {lang === "en" && "Legal Notice & Business Disclosure"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Traditionalart Inc.</p>
          </div>

          {/* Language Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setLang("ja")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                lang === "ja" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🇯🇵 日本語
            </button>
            <button
              onClick={() => setLang("zh-TW")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                lang === "zh-TW" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🇹🇼 繁體中文
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                lang === "en" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🇺🇸 English
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <tbody className="divide-y divide-slate-100">
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">
                  {lang === "zh-TW" ? "營運主體 (公司名稱)" : lang === "en" ? "Company Name" : "販売事業者名"}
                </th>
                <td className="sm:w-2/3 py-3 text-slate-700">Traditionalart Inc.</td>
              </tr>
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">
                  {lang === "zh-TW" ? "營運負責人" : lang === "en" ? "Representative" : "運営統括責任者"}
                </th>
                <td className="sm:w-2/3 py-3 text-slate-700">酒井 栄二郎 (Eijiro Sakai)</td>
              </tr>
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">
                  {lang === "zh-TW" ? "營業所在地" : lang === "en" ? "Address" : "所在地"}
                </th>
                <td className="sm:w-2/3 py-3 text-slate-700">
                  東京都港区南青山（※請求書・領収書またはお取引時に遅滞なく開示いたします / Details disclosed upon transaction request）
                </td>
              </tr>
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">
                  {lang === "zh-TW" ? "客服聯絡窗口" : lang === "en" ? "Contact" : "問い合わせ窓口"}
                </th>
                <td className="sm:w-2/3 py-3 text-slate-700">
                  Email: support@traditionalart.biz<br />
                  Website: https://geo.traditionalart.biz
                </td>
              </tr>
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">
                  {lang === "zh-TW" ? "付款方式" : lang === "en" ? "Payment Methods" : "お支払い方法"}
                </th>
                <td className="sm:w-2/3 py-3 text-slate-700">
                  {lang === "zh-TW" 
                    ? "信用卡線上安全刷卡（透過 Stripe 金流 / Visa, Mastercard, JCB, American Express）" 
                    : lang === "en" 
                    ? "Credit Card (Processed securely via Stripe / Visa, Mastercard, AMEX, JCB)"
                    : "クレジットカード決済（Stripe安全暗号化決済 / Visa, Mastercard, JCB, American Express）"}
                </td>
              </tr>
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">
                  {lang === "zh-TW" ? "服務提供時間" : lang === "en" ? "Service Delivery" : "役務の提供時期"}
                </th>
                <td className="sm:w-2/3 py-3 text-slate-700">
                  {lang === "zh-TW"
                    ? "付款完成後，系統立即自動發放相應之 AI 額度並開通功能。"
                    : lang === "en"
                    ? "Immediately activated and credited upon successful payment."
                    : "クレジットカード決済完了後、即時にシステム上のクレジット枠が付与され、ご利用可能となります。"}
                </td>
              </tr>
              <tr className="flex flex-col sm:table-row py-3 sm:py-0">
                <th className="sm:w-1/3 py-3 font-bold text-slate-900 sm:pr-4">
                  {lang === "zh-TW" ? "取消訂閱與退款政策" : lang === "en" ? "Cancellation & Refunds" : "解約・返金・キャンセル条件"}
                </th>
                <td className="sm:w-2/3 py-3 text-slate-700">
                  {lang === "zh-TW"
                    ? "使用者可於後台設定（/settings）隨時一鍵取消後續週期自動續訂。本服務屬數位雲端服務，付款後原則上不提供退費。"
                    : lang === "en"
                    ? "You can cancel anytime via /settings. Due to digital delivery nature, fees are non-refundable once billed."
                    : "管理画面（/settings）内のStripe請求管理ポータルよりいつでもワンクリックで次回更新を停止（解約）できます。デジタルサービスの性質上、決済完了後の返金は原則として受け付けておりません。"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
