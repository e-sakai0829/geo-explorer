/**
 * ATS (AI-Trust Score) 計算エンジン ＆ 動的アクション診断モジュール
 * PRD v3.0 および ATSスコア_動的診断プロンプト詳細設計.md に完全対応
 */

export type PrimarySourceType = 
  | 'official_docs'
  | 'news_and_pr'
  | 'specialized_and_comparison'
  | 'public_and_academic'
  | 'user_community'
  | 'unknown';

export type ActionPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RecommendedAction {
  priority: ActionPriority;
  action_type: 'external_listing' | 'content_rewrite' | 'sponsored_ad' | 'press_release' | 'whitepaper' | 'community_engagement';
  title: string;
  description: string;
}

export interface DiagnosticAdvice {
  primary_source_type: PrimarySourceType;
  top_influential_media: string[];
  gap_pattern: 'source_exposure_lack' | 'structure_extraction_failure' | 'fanout_gap' | 'leading' | 'insufficient_data';
  diagnosis_summary: string;
  recommended_actions: RecommendedAction[];
}

export interface CitationSource {
  title: string;
  url: string;
  domain: string;
  /** このソースが掲載・言及しているブランド名（LLM解析結果、判明している場合のみ設定） */
  mentionedBrands?: string[];
}

export interface BrandMention {
  brandName: string;
  rank: number; // 1 = top recommendation, 2-3 = top 3, 4+ = listed, 0 = not mentioned
  mentionedInText: boolean;
}

export interface ATSInput {
  targetBrand: string;
  targetDomain: string;
  competitors: string[]; // ['CompA', 'CompB']
  /** 競合の公式ドメインマップ（登録されている場合、対称採点として公式ドメイン引用を同等に判定） */
  competitorDomains?: Record<string, string>;
  aiResponseText: string;
  brandMentions: BrandMention[]; // 自社＋競合の言及ランク
  citations: CitationSource[];
  fanoutQueries: string[];
  coveredFanoutsPerBrand: Record<string, number>; // {"A-Sales": 3, "CompA": 4}
}

export interface ATSResult {
  targetBrand: string;
  targetATS: number | null;
  targetBreakdown: {
    directMentionScore: number | null; // 0-40
    citationDomainScore: number | null; // 0-40
    fanoutCoverageScore: number | null; // 0-20
  };
  competitorATSMap: Record<string, number | null>;
  diagnosticAdvice: DiagnosticAdvice;
}

/**
 * ブランド名比較用の正規化（前後空白除去・大文字小文字統一）。
 * LLM出力のブランド名表記ゆれ（"A-Sales" vs "a-sales " 等）によるミスマッチを防ぐ。
 */
function normalizeBrandName(name: string | undefined | null): string {
  return (name ?? '').trim().toLowerCase();
}

/**
 * 直接言及スコア (0〜40) を計算
 * rank=0 でも比較対象として文中に言及されていれば5pt（設計書 §1.2 「比較・言及のみ」）
 */
export function calculateDirectMentionScore(rank: number, mentionedInText: boolean = false): number {
  if (!Number.isInteger(rank) || rank < 0) return mentionedInText ? 5 : 0;
  if (rank === 1) return 40;
  if (rank >= 2 && rank <= 3) return 28;
  if (rank >= 4) return 15;
  if (mentionedInText) return 5;
  return 0;
}

/**
 * ドメイン文字列からホスト名部分を正規化して抽出する
 */
export function normalizeHost(value: string | undefined | null): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const u = new URL(value.includes('://') ? value.trim() : 'https://' + value.trim());
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return '';
    const host = u.hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
    if (!host.includes('.') || !/^[a-z0-9.-]+$/.test(host) || host.split('.').some(p => !p || p.startsWith('-') || p.endsWith('-'))) return '';
    return host;
  } catch { return ''; }
}
export function matchesOfficialHost(source: string | undefined | null, official: string | undefined | null): boolean {
  const a = normalizeHost(source), b = normalizeHost(official);
  return !!a && !!b && (a === b || a.endsWith('.' + b));
}
export function citationHost(c: CitationSource): string {
  // A supplied URL is authoritative; a forged domain field cannot override it.
  return normalizeHost(c.url || c.domain);
}
export function calculateCitationDomainScore(brandName: string, officialDomain: string | undefined | null, citations: CitationSource[], _legacy?: boolean): number | null {
  const official = normalizeHost(officialDomain);
  if (!official) return null;
  const sources = (Array.isArray(citations) ? citations : []).filter(c => c && citationHost(c));
  if (sources.some(c => matchesOfficialHost(citationHost(c), official))) return 40;
  const brand = normalizeBrandName(brandName);
  // Source-level brand attribution must be supplied as evidence, not guessed from a URL substring.
  const relevant = sources.filter(c => brand && Array.isArray(c.mentionedBrands) && c.mentionedBrands.some(b => normalizeBrandName(b) === brand));
  if (!relevant.length) return 0;
  const media = ['it-trend.jp', 'boxil.jp', 'prtimes.jp', 'note.com', 'nikkei.com', 'itmedia.co.jp', 'qiita.com', 'zenn.dev'];
  return relevant.some(c => media.some(host => matchesOfficialHost(citationHost(c), host))) ? 30 : 15;
}
export function calculateFanoutCoverageScore(covered: number, total: number): number | null {
  if (!Number.isInteger(total) || total <= 0 || !Number.isInteger(covered) || covered < 0 || covered > total) return null;
  return Math.round(covered / total * 20);
}

/**
 * 引用URL群から一次ソース種別を自動判別
 */
export function classifyPrimarySourceType(citations: CitationSource[]): PrimarySourceType {
  if (!citations || citations.length === 0) return 'unknown';

  const domainStr = citations.map(c => (c.domain || '').toLowerCase() + ' ' + (c.url || '').toLowerCase()).join(' ');

  if (domainStr.includes('prtimes') || domainStr.includes('news') || domainStr.includes('nikkei')) {
    return 'news_and_pr';
  }
  if (domainStr.includes('it-trend') || domainStr.includes('boxil') || domainStr.includes('hikaku') || domainStr.includes('review')) {
    return 'specialized_and_comparison';
  }
  if (domainStr.includes('.go.jp') || domainStr.includes('.ac.jp') || domainStr.includes('report') || domainStr.includes('whitepaper')) {
    return 'public_and_academic';
  }
  if (domainStr.includes('note.com') || domainStr.includes('qiita') || domainStr.includes('zenn') || domainStr.includes('x.com')) {
    return 'user_community';
  }

  return 'official_docs';
}

/**
 * ATS 総合判定＆動的アドバイス生成
 * input は LLM (Gemini Search Grounding) のJSON出力に由来するため、
 * 各配列/オブジェクトフィールドが欠落している可能性を考慮し、防御的にデフォルト値を適用する。
 */
export function calculateATS(input: ATSInput): ATSResult {
  const citations = (input.citations || []).filter(c => c && citationHost(c));
  const mentions = (input.brandMentions || []).filter(Boolean);
  const queries = input.fanoutQueries || [];
  const coverage = new Map(Object.entries(input.coveredFanoutsPerBrand || {}).map(([k,v]) => [normalizeBrandName(k),v]));
  const domains = new Map(Object.entries(input.competitorDomains || {}).map(([k,v]) => [normalizeBrandName(k),v]));
  const component = (brand: string, domain: string | undefined) => {
    const mention = mentions.find(m => normalizeBrandName(m.brandName) === normalizeBrandName(brand));
    const directMentionScore = calculateDirectMentionScore(mention?.rank || 0, mention?.mentionedInText);
    const citationDomainScore = calculateCitationDomainScore(brand, domain, citations);
    const count = coverage.get(normalizeBrandName(brand));
    const fanoutCoverageScore = count === undefined ? null : calculateFanoutCoverageScore(count, queries.length);
    return { directMentionScore, citationDomainScore, fanoutCoverageScore };
  };
  const total = (v: ReturnType<typeof component>) => Object.values(v).every(n => n !== null) ? v.directMentionScore + v.citationDomainScore! + v.fanoutCoverageScore! : null;
  const targetBreakdown = component(input.targetBrand, input.targetDomain);
  const targetATS = total(targetBreakdown);
  const competitors = [...new Set((input.competitors || []).filter(c => c && normalizeBrandName(c) !== normalizeBrandName(input.targetBrand)))];
  const competitorATSMap = Object.fromEntries(competitors.map(c => [c, total(component(c, domains.get(normalizeBrandName(c))))]));
  const comparable = Object.values(competitorATSMap).filter((v): v is number => v !== null);
  const gap = targetATS !== null && comparable.length ? targetATS - Math.max(...comparable) : null;
  const primarySourceType = classifyPrimarySourceType(citations);
  const topMedia = citations.slice(0,3).map(citationHost);
  let diagnosticAdvice: DiagnosticAdvice;
  if (gap === null) diagnosticAdvice = { primary_source_type: primarySourceType, top_influential_media: topMedia,
    gap_pattern: 'insufficient_data', diagnosis_summary: '比較に必要な観測値が不足しています。未計測の項目を確認してください。', recommended_actions: [] };
  else {
    const pattern = gap >= 0 ? 'leading' : targetBreakdown.citationDomainScore! < 25 ? 'source_exposure_lack' : targetBreakdown.directMentionScore < 20 ? 'structure_extraction_failure' : 'fanout_gap';
    diagnosticAdvice = buildDynamicAdvice(input.targetBrand, primarySourceType, pattern, topMedia, gap, targetATS!);
  }
  return { targetBrand: input.targetBrand, targetATS, targetBreakdown, competitorATSMap, diagnosticAdvice };
}

/**
 * 一次ソース種別×ギャップパターンから動的アドバイスを構築
 */
function buildDynamicAdvice(
  targetBrand: string,
  sourceType: PrimarySourceType,
  gapPattern: DiagnosticAdvice['gap_pattern'],
  topMedia: string[],
  atsGap: number,
  targetATS: number = 0
): DiagnosticAdvice {
  const mediaNames = topMedia.length > 0 ? topMedia.join(', ') : '主要サードパーティドメイン';
  const actions: RecommendedAction[] = [];

  let summary = '';

  if (gapPattern === 'leading') {
    // 競合には勝っていても、絶対スコアが低い場合は「首位=安心」と誤解させないよう文言を分ける
    if (targetATS >= 60) {
      summary = `貴社（${targetBrand}）は本プロンプトにおいて非常に高いAI信頼スコア(ATS)を獲得し、業界首位を維持しています。現在の一次情報露出の構造を維持・更新してください。`;
      actions.push({
        priority: 'LOW',
        action_type: 'content_rewrite',
        title: '既存コンテンツの定期更新・最新化',
        description: 'AI検索インデックス内での首位獲得を維持するため、定期的な数値や事例のアップデートを行ってください。'
      });
    } else {
      summary = `貴社（${targetBrand}）は登録競合の中では相対的に優位ですが、ATSスコア自体は${targetATS}pt(100pt満点)とまだ低水準です。一次ソースでの掲載拡大や直接言及の獲得余地が大きく残っています。`;
      actions.push({
        priority: 'MEDIUM',
        action_type: 'content_rewrite',
        title: '一次ソース露出・直接言及の底上げ',
        description: '登録競合には勝っていますが絶対スコアは低いため、比較メディア掲載やAEOリライトを継続し、業界全体でのAI信頼スコアを引き上げてください。'
      });
    }
  } else if (sourceType === 'specialized_and_comparison') {
    summary = `AIは「${mediaNames}」等の専門比較メディアを参照して回答を構成しています。貴社は当該メディアでの露出・引用が不足しているため、競合に遅れをとっています（ATS差: ${atsGap}pt）。`;
    actions.push(
      {
        priority: 'HIGH',
        action_type: 'external_listing',
        title: `${mediaNames} への掲載・確認手続き`,
        description: 'AIが最優先で参照している上記比較メディアへの掲載有無を確認し、未掲載の場合は即時掲載リクエストを行ってください。'
      },
      {
        priority: 'MEDIUM',
        action_type: 'content_rewrite',
        title: '掲載概要テキストの35〜65文字直答化',
        description: 'メディア上の自社掲載文言を、AIが要約・抽出しやすいAEOアンサー形式にリライトしてください。'
      },
      {
        priority: 'LOW',
        action_type: 'sponsored_ad',
        title: '比較メディア内での枠買い・タイアップ記事検討',
        description: 'コンテンツ改善後も引用が得られない場合、当該メディアのスポンサー枠・タイアップ露出をご検討ください。'
      }
    );
  } else if (sourceType === 'official_docs') {
    summary = `AIは各社の公式サイト・技術ドキュメントを直接参照しています。貴社サイトのコンテンツ構造がAIの要約アルゴリズムに適合していない可能性があります（ATS差: ${atsGap}pt）。`;
    actions.push(
      {
        priority: 'HIGH',
        action_type: 'content_rewrite',
        title: '見出し（H2/H3）直下への35〜65文字アンサー配置',
        description: '自社サイトの記事において、見出しの直後に疑問に対する明確な結論（35〜65文字）を自動配置してください。'
      },
      {
        priority: 'MEDIUM',
        action_type: 'content_rewrite',
        title: '比較・比較要素のMarkdownテーブル化',
        description: '価格や機能をテキストだけでなくHTML/Markdown表として構造化し、AIのクローリング精度を高めてください。'
      }
    );
  } else if (sourceType === 'news_and_pr') {
    summary = `AIは最新のプレスリリースやニュース記事（${mediaNames}）を一次ソースとして参照しています。直近の話題性・広報露出で競合が優勢です。`;
    actions.push(
      {
        priority: 'HIGH',
        action_type: 'press_release',
        title: '新機能・事例・調査インサイトのプレスリリース配信',
        description: 'PR TIMES等の広報配信サービスを活用し、AIが参照するインデックスへ最新の自社実績を追加してください。'
      }
    );
  } else {
    summary = `AIは業界調査やコミュニティ・白書（${mediaNames}）を参照しています。自社の一次情報発信力を強化する必要があります。`;
    actions.push(
      {
        priority: 'HIGH',
        action_type: 'whitepaper',
        title: '独自意識調査レポート（インサイト白書）の公開',
        description: '業界一次情報となるオリジナルデータを自社サイトで公開し、他メディアやAIから引用される仕掛けを構築してください。'
      }
    );
  }

  return {
    primary_source_type: sourceType,
    top_influential_media: topMedia,
    gap_pattern: gapPattern,
    diagnosis_summary: summary,
    recommended_actions: actions
  };
}
