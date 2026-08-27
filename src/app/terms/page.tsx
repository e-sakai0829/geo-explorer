"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, FileText, Globe } from "lucide-react";

export default function TermsPage() {
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
              Legal Agreement
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
              className={`px-3 py-1.5 rounded-lg transition-all ${
                lang === "ja" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🇯🇵 日本語
            </button>
            <button
              onClick={() => setLang("zh-TW")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                lang === "zh-TW" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🇹🇼 繁體中文
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
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
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第1条（総則および適用）</h2>
                <p>本利用規約（以下「本規約」）は、Traditionalart Inc.（以下「当社」）が提供するGEO・AI検索最適化プラットフォーム「GEO Explorer」（以下「本サービス」）の利用条件を定めるものです。ユーザーは本サービスを利用することにより、本規約に同意したものとみなされます。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第2条（サービス内容と利用権）</h2>
                <p>本サービスは、Google AI Overviews、Gemini、ChatGPT等のAI検索エンジンにおける言及・引用状況の分析、クエリファンアウト抽出、およびAEO（回答エンジン最適化）記事の自動生成機能を提供するSaaSです。ユーザーは契約プランに応じた月間クレジット枠の範囲内で本サービスを利用できます。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第3条（サブスクリプションと支払い）</h2>
                <p>本サービスの有料プランは月額サブスクリプション方式で提供されます。利用料金はStripe決済を通じてクレジットカードにより前払いで支払うものとします。更新日までに解約手続きが行われない限り、サブスクリプションは翌月度も同一条件で自動更新されます。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第4条（解約および返金）</h2>
                <p>ユーザーは管理画面内のStripe請求ポータルより、いつでも次回更新の自動停止（解約）を行えます。解約後も、既に支払われた請求期間の末日までは全機能をご利用いただけます。日割り計算による返金は原則として行いません。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第5条（知的財産権およびAI生成物）</h2>
                <p>本サービスを通じて生成されたAEO記事および分析レポートの著作権はユーザーに帰属します。ただし、本サービスのプラットフォームプログラム、UIデザイン、分析アルゴリズム等の知的財産権はすべて当社に帰属します。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第6条（免責事項）</h2>
                <p>当社は、本サービスを利用したことによる検索順位の上昇やAI検索での100%の引用露出を保証するものではありません。各AI検索エンジンのアルゴリズム変更やAPI提供元の仕様変更に起因する一時的な分析結果の変動について、当社は一切の責任を負いません。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第7条（準拠法および管轄裁判所）</h2>
                <p>本規約の解釈および適用は日本法に準拠し、本サービスに関して紛争が生じた場合は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
              </section>
            </>
          )}

          {lang === "zh-TW" && (
            <>
              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第一條（總則與適用範圍）</h2>
                <p>本服務條款（以下簡稱「本條款」）規定 Traditionalart Inc.（以下簡稱「本公司」）所提供之 GEO・AI 搜尋最佳化平台「GEO Explorer」（以下簡稱「本服務」）的使用條件。使用者註冊或使用本服務，即視為完全同意本條款之所有內容。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第二條（服務內容與授權）</h2>
                <p>本服務為 SaaS 平台，提供 Google AI Overviews、Gemini、ChatGPT 等生成式 AI 搜尋引擎中的品牌提及與引用分析、內部擴展查詢（Query Fan-out）提取，以及 AEO 直答文章自動生成功能。使用者可在所購買方案之月度額度內使用相關功能。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第三條（訂閱費用與付款）</h2>
                <p>本服務付費方案採月度訂閱制（Monthly Subscription）。費用透過 Stripe 安全線上支付系統以信用卡定期扣款。除非使用者於下個續訂日之前取消訂閱，否則系統將自動續約。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第四條（取消訂閱與退款政策）</h2>
                <p>使用者可隨時於控制台中的 Stripe 客戶入口網站自主取消自動續訂。取消後，使用者仍可享有服務權益直至當前計費週期結束為止。除法律另有規定外，已支付之費用不予按比例退還。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">第五條（智慧財產權與產出歸屬）</h2>
                <p>透過本服務生成的 AEO 文章及分析報告之智慧財產權歸使用者所有。本服務之系統架構、演算法、UI設計等軟體專利及智慧財產權均屬於本公司所有。</p>
              </section>
            </>
          )}

          {lang === "en" && (
            <>
              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">1. Acceptance of Terms</h2>
                <p>These Terms of Service ("Terms") govern your access to and use of GEO Explorer ("Service"), provided by Traditionalart Inc. ("Company", "we", "us"). By accessing or using the Service, you agree to be bound by these Terms.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">2. Description of Service</h2>
                <p>GEO Explorer is an AI Search Optimization (GEO) SaaS platform that provides brand citation monitoring, query fan-out extraction, and Answer Engine Optimization (AEO) content generation across Google AI Overviews, Gemini, and conversational search engines.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">3. Subscription and Billing</h2>
                <p>The Service is offered on a monthly subscription basis processed securely via Stripe. Fees are billed in advance on a recurring monthly cycle. Subscriptions renew automatically unless cancelled before the renewal date.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">4. Cancellation and Refunds</h2>
                <p>You may cancel your subscription at any time via the Stripe Customer Portal within your Settings. Following cancellation, you will continue to have access to the Service through the end of your current billing period. All payments are non-refundable except where required by applicable law.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">5. Intellectual Property</h2>
                <p>You retain all intellectual property rights to the content generated and exported using the Service. Traditionalart Inc. retains all rights, title, and interest in and to the Service, including all software, algorithms, and interface designs.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">6. Governing Law</h2>
                <p>These Terms shall be governed by and construed in accordance with the laws of Japan, without regard to its conflict of law provisions.</p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
