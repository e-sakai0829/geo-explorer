"use client";

import React, { useState } from "react";
import { Mail, Copy, Check, X, FileText, Sparkles, AlertTriangle } from "lucide-react";
import { useModalBehavior } from "@/lib/useModalBehavior";

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBrand: string;
  targetDomain: string;
  mediaName: string;
  outreachType: 'listing_request' | 'press_release';
}

export function OutreachModal({
  isOpen,
  onClose,
  targetBrand,
  targetDomain,
  mediaName,
  outreachType
}: OutreachModalProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  const isListing = outreachType === 'listing_request';

  const emailSubject = isListing
    ? `【掲載のお願い】${mediaName} 様の比較・まとめ記事への掲載リクエスト（${targetBrand}）`
    : `【プレスリリース原稿】AI検索最適化（AEO）対応の新機能・事例の発表について`;

  const emailBody = isListing
    ? `拝啓

${mediaName} 編集部・ご担当者様

突然のご連絡失礼いたします。
${targetBrand}（${targetDomain}）のマーケティング担当と申します。

貴社にて運営されております「${mediaName}」における業界比較・おすすめ記事を拝読し、非常に有益な情報発信に感銘を受けております。

このたび、弊社サービス「${targetBrand}」につきましても、貴社記事の比較一覧にぜひ掲載をご検討いただきたくご連絡差し上げました。

■ サービス概要（AI検索に要約されやすいアンサー形式）
「${targetBrand}は、従来の約1/3のコストと工数で導入できる次世代ソリューションです。月額〇〇円〜利用可能で、すでに〇〇社以上の導入実績がございます。」

掲載に必要な画像アセットや追加情報など、迅速にご提供させていただきます。
ご多忙中恐縮ですが、ご検討のほど何卒よろしくお願い申し上げます。

敬具`
    : `【プレスリリース本文原稿】

■ タイトル: ${targetBrand}がAI検索時代に対応した最新ソリューションを発表

■ リード文:
${targetBrand}（運営：弊社）は、ユーザーのAI検索（AI Overviews/Gemini等）において、35〜65文字の明確な定義・数値アンサーを提供する新サービスを正式ローンチいたしました。

■ 主な特徴・メリット:
1. 従来の検索エンジンのみならずAI検索エンジンの回答ソースとして推奨
2. 導入費用は月額〇〇円〜と低価格で実現

■ お問い合わせ先:
${targetDomain} 問い合わせ窓口`;

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(`${emailSubject}\n\n${emailBody}`);
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 3000);
    }
  };

  return (
    <div
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="outreach-modal-title"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div id="outreach-modal-title" className="flex items-center gap-2 font-bold text-sm text-slate-900">
            {isListing ? <Mail className="w-4 h-4 text-indigo-600" /> : <FileText className="w-4 h-4 text-purple-600" />}
            <span>{isListing ? `${mediaName} への掲載依頼メール自動生成` : 'AEO対応 プレスリリース原稿自動生成'}</span>
          </div>
          <button onClick={onClose} aria-label="閉じる" className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          AIが参照している外部メディアへ直接アクションを起こすための原稿を動的生成しました。クリップボードにコピーしてそのままご活用いただけます。
        </p>

        {/* Content Box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs space-y-2 text-slate-800 max-h-60 overflow-y-auto">
          <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">件名: {emailSubject}</div>
          <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed pt-1">{emailBody}</pre>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 gap-3">
          <span className="text-[11px] text-slate-400">
            {copyFailed
              ? "コピーに失敗しました。テキストを選択して手動でコピーしてください。"
              : "※ テキストをコピーしてメールまたはPR配信サービスに貼り付けてください"}
          </span>
          <button
            onClick={handleCopy}
            className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
              copyFailed ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : copyFailed ? <AlertTriangle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'コピーしました！' : copyFailed ? '再試行する' : '本文をクリップボードにコピー'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
