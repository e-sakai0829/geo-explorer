"use client";

import { useState, useEffect } from "react";
import { X, Send, Sparkles, Building2, User, Mail, Globe, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";

interface ConsultingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDomain?: string;
  defaultBrandName?: string;
}

export default function ConsultingModal({
  isOpen,
  onClose,
  defaultDomain = "",
  defaultBrandName = "",
}: ConsultingModalProps) {
  const [companyName, setCompanyName] = useState(defaultBrandName);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState(defaultDomain);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (defaultBrandName && !companyName) setCompanyName(defaultBrandName);
    if (defaultDomain && !websiteUrl) setWebsiteUrl(defaultDomain);
  }, [defaultBrandName, defaultDomain]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. サーバー側にリードを確実に永続保存（mailto失敗時のリード消失防止）
    try {
      await fetch("/api/consulting-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactName,
          email,
          websiteUrl,
          message,
        }),
      });
    } catch (err) {
      console.warn("Server lead recording error (continuing with mailto):", err);
    }

    // 2. メーラー起動用のリンク作成
    const subject = encodeURIComponent(`【GEO Explorer】マーケティングコンサルティング相談: ${companyName || "企業様"}`);
    const bodyText = [
      `■ 貴社名: ${companyName}`,
      `■ ご担当者名: ${contactName}`,
      `■ メールアドレス: ${email}`,
      `■ WebサイトURL: ${websiteUrl}`,
      ``,
      `■ ご相談内容・現状の課題:`,
      message,
      ``,
      `──────────────────────────────`,
      `※ 本メールは GEO Explorer コンサルティング相談フォームから送信されました。`,
    ].join("\n");

    const mailtoUrl = `mailto:info@traditionalart.biz?subject=${subject}&body=${encodeURIComponent(bodyText)}`;

    // メーラー起動
    try {
      window.location.href = mailtoUrl;
    } catch (e) {}

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-850 to-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-bold tracking-widest uppercase mb-2 border border-indigo-400/20">
            <Sparkles className="w-3 h-3 text-indigo-300" />
            BtoB Marketing & GEO Advisory
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            マーケティングコンサルティング相談
          </h2>
          <p className="text-xs text-indigo-200/90 mt-1 leading-relaxed">
            AI検索（GEO/AIO）時代における自社の露出向上、順位改善、一次情報コンテンツ設計、およびマーケティング戦略全般の個別伴走支援を承ります。
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isSubmitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                お問合せメールを作成しました
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                お使いのメールソフトが起動しました。内容をご確認のうえ送信をお願いいたします。<br />
                もしメールソフトが起動しない場合は、直接 <strong>info@traditionalart.biz</strong> 宛にご連絡ください。
              </p>
              <div className="pt-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  閉じる
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  貴社名 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: 株式会社トラディショナルアート"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    ご担当者名 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例: 山田 太郎"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    メールアドレス <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="example@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  自社WebサイトURL
                </label>
                <input
                  type="url"
                  placeholder="https://your-company.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  ご相談内容・現状の課題 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="例: 自社サービスがAI検索（Gemini / ChatGPT / Google AIO）で推奨されるためのコンテンツ改善や、BtoBリード獲得の全体戦略について相談したい。"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden resize-none"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{isSubmitting ? "送信処理中..." : "相談メールを作成して送信する（送信先: info@traditionalart.biz）"}</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  ※ ご入力いただいた内容は厳重に管理され、ご相談対応以外の目的には使用いたしません。
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
