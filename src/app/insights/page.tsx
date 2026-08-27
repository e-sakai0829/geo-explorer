import Link from "next/link";
import { ARTICLES } from "@/lib/articles";
import { BookOpen, Sparkles, Clock, ArrowRight, ArrowUpRight } from "lucide-react";

export default function InsightsPage() {
  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200/60 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            GEO & AIO Insights
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            GEO・AI検索最適化 公式コラム ＆ ナレッジ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Google AI Overviews、Gemini、ChatGPT検索時代における最新のコンテンツ戦略・アルゴリズム研究
          </p>
        </div>

        <Link
          href="/prompts"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          自社サイトのAI露出度を無料診断
        </Link>
      </div>

      {/* Featured Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ARTICLES.map((article) => (
          <Link
            key={article.slug}
            href={`/insights/${article.slug}`}
            className="group bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all relative"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200/50 text-[11px]">
                  {article.category}
                </span>
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3" /> {article.readTime}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 mb-2">
                {article.title}
              </h2>

              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                {article.excerpt}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
              <span>記事を読む</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Lead Generation CTA Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold border border-blue-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            無料体験版
          </div>
          <h3 className="text-xl font-bold">
            自社がAI検索（AIO/Gemini）に選ばれているか、1秒で判定
          </h3>
          <p className="text-xs text-slate-300">
            クレジットカード不要。重要キーワードを入力するだけで自社のAI引用率と競合ギャップを無料可視化できます。
          </p>
        </div>

        <Link
          href="/prompts"
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all shrink-0 flex items-center gap-2"
        >
          今すぐ無料で試してみる
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
