import Link from "next/link";
import { 
  Sparkles, 
  Search, 
  Layers, 
  TrendingUp, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  FileText, 
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Zap,
  BarChart3,
  Bot
} from "lucide-react";
import { ARTICLES } from "@/lib/articles";

export default function LandingPage() {
  return (
    <div className="-m-8 bg-slate-950 text-slate-100 min-h-screen selection:bg-indigo-500 selection:text-white font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              GEO Explorer
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono border border-indigo-500/30">
                PRO
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">機能と特徴</a>
            <a href="#comparison" className="hover:text-indigo-400 transition-colors">他社比較</a>
            <a href="#pricing" className="hover:text-indigo-400 transition-colors">料金プラン</a>
            <Link href="/insights" className="hover:text-indigo-400 transition-colors">公式コラム</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/prompts"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              無料診断を試す
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-28 px-6 max-w-5xl mx-auto text-center space-y-7 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900/90 text-indigo-300 rounded-full text-xs font-semibold border border-slate-700/80 shadow-inner">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          Google AI Overviews ＆ Gemini 完全対応の次世代GEOプラットフォーム
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15]">
          AI検索で、自社が<br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">
            「推薦・引用される」
          </span>
          新常識。
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Google AI Overviews、Gemini、ChatGPT検索におけるブランド言及状況を1秒で可視化。
          AI内部展開クエリ（Fan-out）を網羅した「35〜65文字直答記事」を自動生成する国内初のGEO特化SaaS。
        </p>

        {/* Free Trial Form Bar */}
        <div className="max-w-xl mx-auto pt-3">
          <form action="/prompts" className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              name="prompt"
              placeholder="例: 法人向けAI英会話 おすすめ比較"
              defaultValue="法人向けAI英会話 おすすめ比較"
              className="flex-1 bg-transparent px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
            >
              自社の露出度を診断
            </button>
          </form>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 mt-3">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> クレジットカード不要</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> 1秒でリアルタイム解析</span>
          </div>
        </div>
      </section>

      {/* Why GEO? Section (課題提起 / メリハリのあるダークスレート背景) */}
      <section className="py-24 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Market Shift</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              従来のSEOだけでは、なぜアクセスが消滅するのか？
            </h2>
            <p className="text-xs text-slate-400">
              検索体験は「10本のリンク一覧」から「AIの直答要約」へ完全に移行しました。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-950/80 p-8 rounded-2xl border border-slate-800 shadow-sm space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">ゼロクリック検索の常態化</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ユーザーは検索結果のリンクをクリックせず、画面最上部のAI要約（AIO）を読んで即座に離脱・解決するようになりました。
              </p>
            </div>

            <div className="bg-slate-950/80 p-8 rounded-2xl border border-slate-800 shadow-sm space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">見えない機会損失リスク</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                見込み客がAIに「おすすめツール」を相談した際、自社が推薦候補から漏れると、比較検討の俎上にすら上がらず消滅します。
              </p>
            </div>

            <div className="bg-slate-950/80 p-8 rounded-2xl border border-slate-800 shadow-sm space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">AEO直答コンテンツの不足</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                従来の冗長なブログ記事ではAIに引用されません。AIが抽出しやすい「35〜65文字直答＋比較表」の構造化が必須です。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Features (ホワイト＆クリーン背景) */}
      <section id="features" className="py-24 bg-white text-slate-900">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Features</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              GEO Explorer が提供する 3大コアソリューション
            </h2>
          </div>

          <div className="space-y-16">
            {/* Feature 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                  01. Prompt Explorer
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  プロンプト別の言及・引用ギャップを1秒解析
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Google AI Overviews や Gemini の回答文をリアルタイムにスキャン。自社ブランドが言及されているか、どの競合が推薦されているか、引用元URLを完全可視化します。
                </p>
                <ul className="space-y-2 text-xs text-slate-700 font-medium pt-2">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 自社 vs 競合の言及率マトリクス</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> LLM奪取難易度（穴場スコア）の自動判定</li>
                </ul>
              </div>
              <div className="bg-slate-950 rounded-2xl p-6 text-white shadow-xl space-y-3 font-mono text-xs border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span>Prompt: 法人向けAI英会話 おすすめ</span>
                  <span className="text-emerald-400 font-bold">Live Scan</span>
                </div>
                <div className="text-slate-300">
                  [自社 Ailo] 言及: ◯ (引用率: 25.0%)<br />
                  [競合 Speak] 言及: ◯ (引用率: 45.0%)<br />
                  [競合 プログリット] 言及: ◯ (引用率: 30.0%)
                </div>
                <div className="bg-indigo-600/20 p-3 rounded-lg border border-indigo-500/30 text-indigo-200">
                  💡 ギャップ検知: 「費用相場」に関するサブクエリで競合のみが引用されています
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 font-mono text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Query Fan-out（AI内部展開クエリ）
                </div>
                <div className="space-y-2 pt-2">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800">1. 法人 AI英会話 研修 費用相場</div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800">2. AI英会話アプリ 法人契約 メリット</div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800">3. おすすめ 法人向けAI英会話 比較表</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-bold">
                  02. Query Fan-out Extraction
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  AIが内部展開したサブクエリを全自動抽出
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  AI検索エンジンは、1つの質問の裏で複数のサブクエリを並列検索して回答を合成します。その「ファンアウトされた裏クエリ」を丸ごと特定します。
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                  03. AEO Content Generator
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  35〜65文字直答 ＆ 比較表のAEO記事を自動生成
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  検出されたギャップとファンアウトクエリをボタン1つで見出し（H2）に自動注入。AIに最も引用されやすい直答形式の記事を1秒で出力します。
                </p>
              </div>
              <div className="bg-white border-2 border-indigo-600/30 rounded-2xl p-6 shadow-lg space-y-3 text-xs">
                <div className="font-bold text-indigo-600 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  AEO直答ライティング規則を自動適用
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
                  <strong className="block text-slate-900 font-bold mb-1">Q. 法人向けAI英会話の費用相場はいくら？</strong>
                  <span className="text-indigo-700 font-bold">「月額1人あたり1,500円〜3,500円が相場であり、従来のオンライン英会話の約1/3の費用で導入可能です。」</span>
                  <span className="text-[10px] text-slate-400 block mt-1">※ 48文字直答（35〜65文字ルール完全適合）</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table (ディープスレート背景) */}
      <section id="comparison" className="py-24 bg-slate-900/90 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Comparison</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              他社ツールとの決定的な違い
            </h2>
            <p className="text-xs text-slate-400">
              大手エンタープライズツールの1/10の価格で、直答記事生成まで完結。
            </p>
          </div>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold">
                <tr>
                  <th className="py-4 px-6">機能・比較項目</th>
                  <th className="py-4 px-6 bg-indigo-950/40 text-indigo-300 font-black border-x border-indigo-800/60">
                    ★ GEO Explorer（当社）
                  </th>
                  <th className="py-4 px-6">大手エンタープライズGEO</th>
                  <th className="py-4 px-6">従来のSEOツール (Ahrefs等)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                <tr>
                  <td className="py-4 px-6 font-bold text-white">月額料金</td>
                  <td className="py-4 px-6 bg-indigo-950/20 font-black text-indigo-400 border-x border-indigo-900/50 text-sm">
                    ¥9,800〜
                  </td>
                  <td className="py-4 px-6 text-slate-400">¥100,000〜（+初期10万）</td>
                  <td className="py-4 px-6 text-slate-400">¥20,000〜 ($129/mo)</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">AI検索（AIO/Gemini）言及可視化</td>
                  <td className="py-4 px-6 bg-indigo-950/20 font-bold text-emerald-400 border-x border-indigo-900/50">◯ 完全対応</td>
                  <td className="py-4 px-6 text-emerald-400 font-bold">◯ 対応</td>
                  <td className="py-4 px-6 text-slate-500">× 非対応</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">クエリファンアウト抽出</td>
                  <td className="py-4 px-6 bg-indigo-950/20 font-bold text-emerald-400 border-x border-indigo-900/50">◯ 全自動</td>
                  <td className="py-4 px-6 text-slate-400">△ 一部対応</td>
                  <td className="py-4 px-6 text-slate-500">× 非対応</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">35〜65文字直答記事の自動生成</td>
                  <td className="py-4 px-6 bg-indigo-950/20 font-bold text-emerald-400 border-x border-indigo-900/50">◯ 1クリック自動生成</td>
                  <td className="py-4 px-6 text-slate-500">× 通常のブログ生成のみ</td>
                  <td className="py-4 px-6 text-slate-500">× 非対応</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">契約期間の縛り</td>
                  <td className="py-4 px-6 bg-indigo-950/20 font-bold text-white border-x border-indigo-900/50">なし（いつでも解約可）</td>
                  <td className="py-4 px-6 text-rose-400">6ヶ月〜1年契約</td>
                  <td className="py-4 px-6 text-slate-400">月単位</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Section (メリハリのある白ベース) */}
      <section id="pricing" className="py-24 bg-white text-slate-900">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-10">
          <div className="space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Pricing</span>
            <h2 className="text-3xl font-bold text-slate-950 tracking-tight">
              月額 9,800 円から、今すぐ始められます
            </h2>
            <p className="text-xs text-slate-500">
              初期費用0円・クレジットカード決済で即時利用可能
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-50 p-7 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="font-bold text-slate-900">Starter（ライト）</div>
                <div className="text-2xl font-black text-slate-900 my-3">¥9,800 <span className="text-xs font-normal text-slate-500">/月</span></div>
                <p className="text-[11px] text-slate-500 mb-4">中小企業の1人マーケター・個人メディア向け</p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 30 プロンプト追跡 /月</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> AEO記事生成 5本 /月</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 引用ギャップ・ファンアウト抽出</li>
                </ul>
              </div>
              <Link href="/pricing" className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl text-center transition-all">
                Starter を申し込む
              </Link>
            </div>

            <div className="bg-white p-7 rounded-2xl border-2 border-indigo-600 shadow-xl relative -translate-y-1 flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-md">
                人気 No.1
              </div>
              <div>
                <div className="font-bold text-slate-900">Growth（スタンダード）</div>
                <div className="text-2xl font-black text-slate-900 my-3">¥29,800 <span className="text-xs font-normal text-slate-500">/月</span></div>
                <p className="text-[11px] text-slate-500 mb-4">専任マーケ部門・中堅成長企業向け</p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 150 プロンプト追跡 /月</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> AEO記事生成 25本 /月</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 週次自動定点観測 & 効果測定</li>
                </ul>
              </div>
              <Link href="/pricing" className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl text-center shadow-lg shadow-indigo-500/25 transition-all">
                Growth を申し込む
              </Link>
            </div>

            <div className="bg-slate-50 p-7 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="font-bold text-slate-900">Agency（代理店）</div>
                <div className="text-2xl font-black text-slate-900 my-3">¥79,800 <span className="text-xs font-normal text-slate-500">/月</span></div>
                <p className="text-[11px] text-slate-500 mb-4">SEO代理店・Webコンサルティング企業向け</p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 500 プロンプト追跡 /月</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> AEO記事生成 100本 /月</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 自社ロゴ入りホワイトラベル出力</li>
                </ul>
              </div>
              <Link href="/pricing" className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl text-center transition-all">
                Agency を申し込む
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 text-xs border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            GEO Explorer by Traditionalart
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/insights" className="hover:text-white">公式コラム</Link>
            <Link href="/pricing" className="hover:text-white">料金プラン</Link>
            <Link href="/dashboard" className="hover:text-white">ダッシュボード</Link>
          </div>
          <div className="text-slate-500">
            © 2026 Traditionalart Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
