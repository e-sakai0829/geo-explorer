import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES } from "@/lib/articles";
import { ArrowLeft, Clock, Calendar, Share2, Sparkles, ArrowRight, BookOpen } from "lucide-react";

export async function generateStaticParams() {
  return ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      {/* Back to list link */}
      <div>
        <Link
          href="/insights"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          コラム一覧に戻る
        </Link>
      </div>

      {/* Article Header */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 text-xs">
          <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full border border-blue-200/50">
            {article.category}
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> {article.publishedAt}
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {article.readTime}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug tracking-tight">
          {article.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
          {article.excerpt}
        </p>
      </div>

      {/* Article Body Content */}
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-6">
        <div className="whitespace-pre-line font-sans text-slate-800 space-y-4">
          {article.content}
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            次世代GEOツール
          </div>
          <h3 className="text-xl font-bold">
            貴社のWebサイトはAI検索に引用されていますか？
          </h3>
          <p className="text-xs text-blue-100">
            GEO Explorerを使えば、自社のブランド言及状況・クエリファンアウト・直答記事生成がすべてワンストップで完結します。
          </p>
        </div>

        <Link
          href="/prompts"
          className="px-6 py-3.5 bg-white hover:bg-slate-50 text-blue-600 font-bold text-xs rounded-xl shadow-lg transition-all shrink-0 flex items-center gap-2"
        >
          自社のGEO露出度を診断する
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
