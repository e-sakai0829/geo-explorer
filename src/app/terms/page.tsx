"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Globe } from "lucide-react";

export default function TermsOfServicePage() {
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold mb-2">
              <FileText className="w-3.5 h-3.5" />
              Terms of Service
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {lang === "ja" && "サービス利用規約"}
              {lang === "zh-TW" && "服務條款 (Terms of Service)"}
              {lang === "en" && "Terms of Service"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">最終改定日: 2026年8月27日 | Traditionalart Inc.</p>
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

        {/* Content Body */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xs text-xs sm:text-sm text-slate-700 leading-relaxed space-y-8">
          {lang === "ja" && (
            <>
              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第1条（適用）</h2>
                <p>本利用規約（以下「本規約」）は、Traditionalart Inc.（以下「当社」）が提供するSaaSプラットフォーム「GEO Explorer」（以下「本サービス」）の利用条件を定めるものです。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第2条（利用登録とアカウント管理）</h2>
                <p>登録希望者は、本規約に同意の上、当社の定める方法によって利用登録を行うものとします。ユーザーは自己の責任においてアカウント情報を適切に管理するものとし、第三者への譲渡・貸与は禁止します。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第3条（料金およびサブスクリプション）</h2>
                <p>ユーザーは、本サービスの有料プランを利用する場合、当社が定める利用料金をStripe決済を通じて支払うものとします。サブスクリプションは管理画面（/settings）よりいつでも次回更新を停止（解約）できます。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第4条（免責事項）</h2>
                <p>本サービスが提供するAI検索分析結果やAEO生成記事は情報提供および支援を目的としたものであり、特定の検索順位や引用順位を保証するものではありません。当社は、本サービスの利用により生じた直接的・間接的な損害について、当社の故意または重過失による場合を除き責任を負いません。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第5条（準拠法・裁判管轄）</h2>
                <p>本規約の解釈にあたっては日本法を準拠法とし、本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
              </section>
            </>
          )}

          {lang === "zh-TW" && (
            <>
              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第一條（適用範圍）</h2>
                <p>本服務條款（以下簡稱「本條款」）旨在規範使用者與 Traditionalart Inc.（以下簡稱「本公司」）之間關於使用「GEO Explorer」SaaS 平台（以下簡稱「本服務」）之一切權利義務關係。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第二條（帳戶管理與訂閱）</h2>
                <p>使用者應妥善保管其登入憑證。付費訂閱費用由 Stripe 平台處理，使用者可隨時於設定頁面（/settings）取消後續週期之自動續訂。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第三條（免責聲明）</h2>
                <p>本服務所提供之 AI 搜尋曝光分析與 AEO 生成內容僅供行銷輔助與參考，不保證特定搜尋引擎或 AI 平台之固定引用排名。除本公司有故意或重大過失外，本公司不對因使用本服務衍生之任何間接損失承擔賠償責任。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第四條（準據法與管轄法院）</h2>
                <p>本條款之解釋與適用均以日本法為準據法。因本服務所生之任何爭議，雙方合意以東京地方法院為第一審專屬管轄法院。</p>
              </section>
            </>
          )}

          {lang === "en" && (
            <>
              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Section 1 (Applicability)</h2>
                <p>These Terms of Service ("Terms") govern your access to and use of the GEO Explorer platform provided by Traditionalart Inc. ("Company").</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Section 2 (Account & Billing)</h2>
                <p>Users are responsible for safeguarding their login credentials. Subscription fees are billed via Stripe. Users can manage or cancel their recurring subscriptions at any time through the settings portal (/settings).</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Section 3 (Disclaimer of Warranties)</h2>
                <p>GEO Explorer provides AI visibility analysis and AEO content for marketing reference. We do not guarantee specific citation rankings or search results in third-party AI platforms. To the fullest extent permitted by law, Company is not liable for indirect or consequential damages.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Section 4 (Governing Law & Jurisdiction)</h2>
                <p>These Terms shall be governed by and construed in accordance with the laws of Japan. The Tokyo District Court shall have exclusive jurisdiction for the first instance over any disputes arising out of or in connection with these Terms.</p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
