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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Privacy & Data Protection
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
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">1. 個人情報の収集と利用目的</h2>
                <p>Traditionalart Inc.（以下「当社」）は、提供するサービス「GEO Explorer」（以下「本サービス」）において、以下の目的でユーザー情報を収集・利用します。</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>アカウント情報</strong>: メールアドレス、認証識別子（アカウント作成、ログイン認証、システム通知のため）</li>
                  <li><strong>プロジェクト設定</strong>: 追跡対象ブランド名、自社ドメイン、競合リスト（AI検索分析の実行のため）</li>
                  <li><strong>決済情報</strong>: クレジットカード決済はすべてPCI-DSS認定のStripe社によって直接安全に処理され、当社サーバー内にクレジットカード番号は一切保持されません。</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">2. Cookie（クッキー）の使用</h2>
                <p>本サービスでは、安全なログインセッションの維持および言語設定（日本語/繁體中文/English）の保持のためにCookieおよびローカルストレージを使用します。広告追跡用Cookieは使用しておりません。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">3. データの安全管理と第三者提供</h2>
                <p>当社は、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供いたしません。また、認証・データベースにはエンタープライズ水準の暗号化を適用しています。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">4. ユーザーの権利とデータ削除請求</h2>
                <p>ユーザーはいつでも自身のアカウント情報の確認、修正、またはアカウント削除（データの完全削除）を請求することができます。請求はサポート窓口（support@traditionalart.biz）にて受け付けます。</p>
              </section>
            </>
          )}

          {lang === "zh-TW" && (
            <>
              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">1. 個人資料之蒐集與利用目的</h2>
                <p>Traditionalart Inc.（以下簡稱「本公司」）於營運「GEO Explorer」（以下簡稱「本服務」）時，基於以下目的蒐集並使用使用者資料：</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>帳戶資料</strong>: 電子郵件地址、系統識別碼（用於註冊、登入身分驗證與重要系統通知）</li>
                  <li><strong>專案設定資料</strong>: 品牌名稱、網站網址、競品清單（用於執行 AI 搜尋曝光與引用分析）</li>
                  <li><strong>付款資料</strong>: 所有信用卡付款均由通過 PCI-DSS 最高安全認證之 Stripe 處理，本公司伺服器不會儲存您的信用卡卡號。</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">2. Cookie 之使用</h2>
                <p>本平台使用 Cookie 與本機儲存空間以維持安全的登入工作階段，並記錄您的語言偏好（日本語 / 繁體中文 / English）。本服務不使用廣告追蹤性 Cookie。</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">3. 資料安全與使用者權利</h2>
                <p>使用者享有查閱、更正、要求刪除其個人資料之權利。如有任何要求，可隨時聯繫我們的客服窗口：support@traditionalart.biz。</p>
              </section>
            </>
          )}

          {lang === "en" && (
            <>
              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">1. Information We Collect and Purpose</h2>
                <p>Traditionalart Inc. ("we", "our", "Company") collects and processes the following information to provide the GEO Explorer service:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Account Information</strong>: Email address and authentication credentials for user login, account management, and service notices.</li>
                  <li><strong>Project Configuration</strong>: Brand names, domains, and competitor lists to perform AI search analysis.</li>
                  <li><strong>Payment Information</strong>: All billing is processed directly and securely by Stripe (PCI-DSS Level 1 compliant). We do not store your credit card numbers.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">2. Use of Cookies</h2>
                <p>We use essential session cookies and local storage exclusively to maintain user authentication and store language preferences. We do not use third-party advertising tracking cookies.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">3. Data Security and User Rights</h2>
                <p>You have the right to access, update, or request deletion of your account and associated data at any time by contacting support@traditionalart.biz.</p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
