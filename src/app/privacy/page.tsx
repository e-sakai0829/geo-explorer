"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Globe } from "lucide-react";

export default function PrivacyPolicyPage() {
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              GDPR, CCPA & PDPA Compliant
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {lang === "ja" && "プライバシーポリシー"}
              {lang === "zh-TW" && "隱私權政策 (Privacy Policy)"}
              {lang === "en" && "Privacy Policy"}
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
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">1. 基本方針</h2>
                <p>Traditionalart Inc.（以下「当社」）は、提供するサービス「GEO Explorer」（以下「本サービス」）において、ユーザーの個人情報の保護を最重要事項と位置づけ、個人情報保護法、EU一般データ保護規則（GDPR）、および米国カリフォルニア州消費者プライバシー法（CCPA）を遵守します。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">2. 収集する情報と利用目的</h2>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>アカウント情報</strong>: メールアドレス、氏名、認証トークン（アカウント管理および認証のため）</li>
                  <li><strong>決済情報</strong>: クレジットカード決済はすべてPCI-DSS認定のStripe社によって処理され、当社サーバー内にカード情報は一切保持されません。</li>
                  <li><strong>アクセス解析（Google Analytics 4）</strong>: サイト改善および利用動向分析のため、Cookieを使用して匿名化されたトラフィックデータを収集します。</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">3. GDPR（EU在住者）に対する権利保護</h2>
                <p>EU一般データ保護規則に基づき、ユーザーは自身の個人データへのアクセス権、訂正権、削除権（忘れられる権利）、データポータビリティ権を行使することができます。これらの請求はサポート窓口（support@traditionalart.biz）にて受け付けます。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">4. Cookie（クッキー）の利用と管理</h2>
                <p>本サービスでは、ログインセッションの維持およびGA4による利用動向分析のためにCookieを使用します。ユーザーはブラウザ設定またはサイト上のCookie同意バナーを通じて、いつでもCookieの受け入れを拒否または設定変更できます。</p>
              </section>
            </>
          )}

          {lang === "zh-TW" && (
            <>
              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">1. 隱私權保護基本方針</h2>
                <p>Traditionalart Inc.（以下簡稱「本公司」）深知個人資料之重要性，在營運「GEO Explorer」平台時，嚴格遵守個人資料保護法（台灣個資法 / 香港個人資料私隱條例 PDPA）、歐盟一般資料保護規則（GDPR）及加州消費者隱私法（CCPA）。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">2. 蒐集之資料項目與使用目的</h2>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>帳戶資料</strong>: 電子郵件地址、姓名、系統驗證憑證（用於使用者驗證與系統通知）</li>
                  <li><strong>付款資料</strong>: 所有信用卡付款均由通過 PCI-DSS 最高安全認證之 Stripe 處理，本公司伺服器不會儲存您的信用卡完整資訊。</li>
                  <li><strong>網站流量分析（Google Analytics 4）</strong>: 透過 Cookie 蒐集去識別化之使用數據，用於改善產品體驗。</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">3. GDPR、PDPA 與使用者法定權利</h2>
                <p>使用者享有查閱、更正、刪除（被遺忘權）及攜帶其個人資料之法定權利。如有任何要求，可隨時聯繫我們的資料保護窗口：support@traditionalart.biz。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">4. Cookie 之使用與管理</h2>
                <p>本平台使用 Cookie 以維持登入狀態並透過 GA4 進行匿名流量統計。使用者可透過畫面底部之 Cookie 同意橫幅或瀏覽器設定隨時選擇拒絕或變更 Cookie 偏好。</p>
              </section>
            </>
          )}

          {lang === "en" && (
            <>
              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">1. Privacy Commitment</h2>
                <p>Traditionalart Inc. ("Company", "we", "us") is committed to protecting your privacy. This Privacy Policy describes how we collect, use, and protect your information across GEO Explorer in compliance with GDPR, CCPA, and applicable data privacy laws.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">2. Information Collection and Purpose</h2>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Account Data</strong>: Email address and authentication tokens for user identification and service delivery.</li>
                  <li><strong>Payment Information</strong>: All credit card transactions are processed securely via Stripe (PCI-DSS compliant). We do not store credit card numbers on our servers.</li>
                  <li><strong>Analytics (Google Analytics 4)</strong>: Anonymized usage data collected via cookies to optimize user experience and platform performance.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">3. Your GDPR and CCPA Rights</h2>
                <p>Under GDPR and CCPA, you have the right to access, rectify, port, or request erasure of your personal data ("Right to be Forgotten"). To exercise these rights, please contact support@traditionalart.biz.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">4. Cookie Policy</h2>
                <p>We use cookies to maintain active login sessions and collect anonymized usage analytics via GA4. You can manage or decline cookie usage at any time via the cookie consent banner or your browser settings.</p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
