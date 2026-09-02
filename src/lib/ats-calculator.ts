/**
 * ATS (AI-Trust Score) 計算エンジン ＆ 動的アクション診断モジュール
 * PRD v3.0 および ATSスコア_動的診断プロンプト詳細設計.md に完全対応
 */

export type PrimarySourceType = 
  | 'official_docs'
  | 'news_and_pr'
  | 'specialized_and_comparison'
  | 'public_and_academic'
  | 'user_community';

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
  gap_pattern: 'source_exposure_lack' | 'structure_extraction_failure' | 'fanout_gap' | 'leading';
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
  aiResponseText: string;
  brandMentions: BrandMention[]; // 自社＋競合の言及ランク
  citations: CitationSource[];
  fanoutQueries: string[];
  coveredFanoutsPerBrand: Record<string, number>; // {"A-Sales": 3, "CompA": 4}
}

export interface ATSResult {
  targetBrand: string;
  targetATS: number;
  targetBreakdown: {
    directMentionScore: number; // 0-40
    citationDomainScore: number; // 0-40
    fanoutCoverageScore: number; // 0-20
  };
  competitorATSMap: Record<string, number>;
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
  if (rank === 1) return 40;
  if (rank >= 2 && rank <= 3) return 28;
  if (rank >= 4) return 15;
  if (mentionedInText) return 5;
  return 0;
}

/**
 * 一次ソース影響度スコア (0〜40) を計算
 * 引用ソースは自社・競合で共有される1本のリストのため、必ず対象ブランドが
 * 実際にそのソースに掲載/言及されているかを確認してからスコアリングする
 * （確認できない場合、ブランド不問で一律加点してしまう不具合を防ぐ）。
 */
export function calculateCitationDomainScore(
  brandName: string,
  targetDomain: string,
  citations: CitationSource[],
  isTarget: boolean
): number {
  if (!citations || citations.length === 0) return 0;

  // ①自社の公式ドメインが引用元URLに直接含まれているか（自社のみ判定可能）
  if (isTarget && targetDomain) {
    const cleanTargetDomain = targetDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
    const hasDirectCitation = cleanTargetDomain.length > 0 &&
      citations.some(c => (c.domain || '').toLowerCase().includes(cleanTargetDomain));
    if (hasDirectCitation) return 40;
  }

  // ②対象ブランドが第三者ソースに掲載/言及されているかを確認
  const normalizedBrand = normalizeBrandName(brandName);
  const relevantCitations = citations.filter(c => {
    if (c.mentionedBrands && c.mentionedBrands.length > 0) {
      return c.mentionedBrands.some(b => normalizeBrandName(b) === normalizedBrand);
    }
    // mentionedBrands が未提供の場合のみ、タイトル/URLへの簡易テキストマッチにフォールバック
    if (!normalizedBrand) return false;
    return (c.title || '').toLowerCase().includes(normalizedBrand) ||
      (c.url || '').toLowerCase().includes(normalizedBrand);
  });

  if (relevantCitations.length === 0) return 0; // サードパーティ未掲載

  // 高権威メディア/比較サイト/ニュースドメインキーワード
  const highAuthorityDomains = ['it-trend', 'boxil', 'prtimes', 'note.com', 'nikkei', 'itmedia', 'qiita', 'zenn'];
  const isHighAuthCited = relevantCitations.some(c =>
    highAuthorityDomains.some(d => (c.domain || '').toLowerCase().includes(d))
  );

  return isHighAuthCited ? 30 : 15;
}

/**
 * ファンアウトカバー率スコア (0〜20) を計算
 */
export function calculateFanoutCoverageScore(
  coveredCount: number,
  totalFanouts: number
): number {
  if (totalFanouts === 0) return 10;
  const ratio = Math.min(1, Math.max(0, coveredCount / totalFanouts));
  return Math.round(ratio * 20);
}

/**
 * 引用URL群から一次ソース種別を自動判別
 */
export function classifyPrimarySourceType(citations: CitationSource[]): PrimarySourceType {
  if (!citations || citations.length === 0) return 'official_docs';

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
  const fanoutQueries = input.fanoutQueries ?? [];
  const citations = input.citations ?? [];
  const brandMentions = input.brandMentions ?? [];
  const coveredFanoutsPerBrand = input.coveredFanoutsPerBrand ?? {};
  const totalFanouts = fanoutQueries.length;

  // competitors に自社ブランドが誤って重複登録されているケースを除外（自己比較によるゼロ和ギャップ判定を防ぐ）
  const competitors = (input.competitors ?? []).filter(
    c => normalizeBrandName(c) !== normalizeBrandName(input.targetBrand) && normalizeBrandName(c).length > 0
  );

  // 表記ゆれ（大文字小文字・前後空白）を吸収したファンアウトカバー数の参照用マップ
  const normalizedFanoutMap = new Map(
    Object.entries(coveredFanoutsPerBrand).map(([k, v]) => [normalizeBrandName(k), v])
  );
  const getFanoutCount = (brand: string) => normalizedFanoutMap.get(normalizeBrandName(brand)) || 0;

  // 自社ブランドの各スコア計算
  const targetMention = brandMentions.find(b => normalizeBrandName(b.brandName) === normalizeBrandName(input.targetBrand));
  const targetRank = targetMention ? targetMention.rank : 0;
  const targetDirectScore = calculateDirectMentionScore(targetRank, targetMention?.mentionedInText);
  const targetCitationScore = calculateCitationDomainScore(input.targetBrand, input.targetDomain, citations, true);
  const targetFanoutCount = getFanoutCount(input.targetBrand);
  const targetFanoutScore = calculateFanoutCoverageScore(targetFanoutCount, totalFanouts);

  const targetATS = targetDirectScore + targetCitationScore + targetFanoutScore;

  // 競合ブランドのATS計算
  const competitorATSMap: Record<string, number> = {};
  competitors.forEach(comp => {
    const compMention = brandMentions.find(b => normalizeBrandName(b.brandName) === normalizeBrandName(comp));
    const compRank = compMention ? compMention.rank : 0;
    const compDirect = calculateDirectMentionScore(compRank, compMention?.mentionedInText);
    const compCitation = calculateCitationDomainScore(comp, '', citations, false);
    const compFanoutCount = getFanoutCount(comp);
    const compFanoutScore = calculateFanoutCoverageScore(compFanoutCount, totalFanouts);
    competitorATSMap[comp] = compDirect + compCitation + compFanoutScore;
  });

  // 競合最高ATS
  const maxCompATS = Math.max(0, ...Object.values(competitorATSMap));
  const atsGap = targetATS - maxCompATS;

  // ギャップパターンの判定
  let gapPattern: DiagnosticAdvice['gap_pattern'] = 'leading';
  if (atsGap < 0) {
    if (targetCitationScore < 25) {
      gapPattern = 'source_exposure_lack';
    } else if (targetDirectScore < 20) {
      gapPattern = 'structure_extraction_failure';
    } else {
      gapPattern = 'fanout_gap';
    }
  }

  // 一次ソースの判定
  const primarySourceType = classifyPrimarySourceType(citations);
  const topMedia = citations.slice(0, 3).map(c => c.domain);

  // 動的アドバイスの構築
  const advice = buildDynamicAdvice(input.targetBrand, primarySourceType, gapPattern, topMedia, atsGap, targetATS);

  return {
    targetBrand: input.targetBrand,
    targetATS,
    targetBreakdown: {
      directMentionScore: targetDirectScore,
      citationDomainScore: targetCitationScore,
      fanoutCoverageScore: targetFanoutScore
    },
    competitorATSMap,
    diagnosticAdvice: advice
  };
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
