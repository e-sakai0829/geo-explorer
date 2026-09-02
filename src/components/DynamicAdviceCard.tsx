"use client";

import React from "react";
import { Sparkles, ArrowRight, Mail, FileText, Globe, Newspaper, GraduationCap, Users } from "lucide-react";
import { DiagnosticAdvice, PrimarySourceType, RecommendedAction } from "@/lib/ats-calculator";

interface DynamicAdviceCardProps {
  advice: DiagnosticAdvice;
  onGenerateAEOArticle?: () => void;
  /** action_type が external_listing / press_release のアクションに対して原稿生成モーダルを開くための任意コールバック */
  onDraftOutreach?: (action: RecommendedAction) => void;
}

const OUTREACH_ACTION_TYPES: RecommendedAction["action_type"][] = ["external_listing", "press_release"];

export function DynamicAdviceCard({ advice, onGenerateAEOArticle, onDraftOutreach }: DynamicAdviceCardProps) {
  if (!advice) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
          診断データがまだありません。プロンプトスキャンを実行してください。
        </div>
      </div>
    );
  }

  const getSourceTypeBadge = (type: PrimarySourceType) => {
    switch (type) {
      case 'specialized_and_comparison':
        return { label: '専門メディア・比較サイト優先参照', icon: Globe, color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'official_docs':
        return { label: '公式サイト・技術ドキュメント優先参照', icon: FileText, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'news_and_pr':
        return { label: 'ニュース・プレスリリース優先参照', icon: Newspaper, color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'public_and_academic':
        return { label: '公的・学術データベース優先参照', icon: GraduationCap, color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'user_community':
        return { label: 'コミュニティ・SNS優先参照', icon: Users, color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: '一次ソース参照', icon: Globe, color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const badge = getSourceTypeBadge(advice.primary_source_type);
  const IconComponent = badge.icon;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">動的アクション診断（AI勝敗解析）</h3>
        </div>

        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
          <IconComponent className="w-3.5 h-3.5" />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Diagnosis Summary */}
      <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl text-xs text-indigo-950 leading-relaxed font-medium">
        {advice.diagnosis_summary}
      </div>

      {/* Action Steps */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-700">推奨アクションプラン（今すぐ実行すべき改善策）:</div>
        <div className="space-y-2.5">
          {(advice.recommended_actions ?? []).map((act, index) => (
            <div
              key={`${act.action_type}-${index}`}
              className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 transition-all flex items-start gap-3"
            >
              <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 mt-0.5 ${
                act.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' : act.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {act.priority}
              </span>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-xs font-bold text-slate-900">{act.title}</div>
                <div className="text-[11px] text-slate-600 leading-relaxed">{act.description}</div>
                {onDraftOutreach && OUTREACH_ACTION_TYPES.includes(act.action_type) && (
                  <button
                    onClick={() => onDraftOutreach(act)}
                    className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    <Mail className="w-3 h-3" />
                    <span>依頼メール/PR原稿を生成</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      {onGenerateAEOArticle && (
        <div className="pt-2">
          <button
            onClick={onGenerateAEOArticle}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>この診断結果から AEO直答記事を即時自動生成</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
