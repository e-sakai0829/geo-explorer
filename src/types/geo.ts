/**
 * GEO Explorer データモデル
 * トヨクモ様LLMOモニタリング実務Excel（全体概況/プロンプト別結果/プロンプト設定/
 * 自社製品・比較製品/参照ドメインデータ/定量数値_週次）の構造を反映。
 */

export type LLMEngine = "gemini" | "chatgpt" | "ai_mode" | "perplexity";

export type PromptImportance = "high" | "medium" | "low";

/**
 * AI Overview非表示（AIO表出なし）と「表出したが自社が非推奨（×）」は
 * 対策の優先度が全く異なるため、実務シート同様に3値で区別する。
 * ここを boolean にすると「検索していない/AIOが出ていない」状態と
 * 「検索したが負けた」状態が区別できず、ダッシュボードの誤表示バグを再発させる。
 */
export type AioStatus = "not_shown" | "shown_not_recommended" | "shown_recommended";

/** プロンプト設定シート */
export interface PromptItem {
  id: string;
  projectId: string;
  category: string;
  keyword: string;
  promptText: string;
  searchIntent?: string;
  importance: PromptImportance;
  checkFrequency: "daily" | "weekly" | "manual";
  registeredAt: string;
  lastScannedAt: string | null;
}

/** プロンプト別結果シート（週次スキャン1件分） */
export interface PromptScanResult {
  id: string;
  promptId: string;
  engine: LLMEngine;
  scannedAt: string;
  /** 自社の推奨順位。非表出/未言及は null（0ではない＝「順位なし」と「1位未満」を混同しない） */
  rank: number | null;
  recommended: boolean;
  aioStatus: AioStatus;
  primaryReferenceDomains: string[];
  rawResponseText?: string;
  /** 勝敗判定: 自社が競合の誰よりも上位表出したか */
  winLoss?: "win" | "loss" | "draw" | "not_applicable";
}

/** 全体概況シート（週次/月次の推奨率推移） */
export interface MonthlyLLMReport {
  periodLabel: string; // 例: "2026-08-31" (週次) or "2026-08" (月次)
  periodStart: string;
  geminiRecommendRate: number | null; // 0-1、未計測は null
  chatgptRecommendRate: number | null;
  competitorAvgRecommendRate: number | null;
  promptTotalCount: number;
  avgRank: number | null;
  domainCoverageRate: number | null; // 参照ドメインカバー率
  vsPromptWinRate: number | null; // VSプロンプト勝率
}

/** 自社製品・比較製品シート */
export interface CompetitorProduct {
  id: string;
  projectId: string;
  segment: "self" | "competitor";
  productName: string;
  domain: string;
  strengthKeywords: string[];
  competitorRank: number | null;
}

/** 参照ドメインデータシート */
export interface DomainCitationItem {
  id: string;
  projectId: string;
  domain: string;
  mediaName: string;
  citationCount: number;
  ourListed: boolean;
  domainRating: number | null; // DR
  actionNote: string;
  category?: string;
  lastSeenAt: string;
}

export interface DashboardStats {
  hasScanData: boolean;
  surface?: string; modelName?: string; locale?: string; scoreVersion?: string;
  comparisonSelfAtsScore?: number | null; comparisonSampleCount?: number;
  failureRate?: number | null; recordedAttemptCount?: number; unmeasuredCount?: number;
  recentAttemptWarnings?: Array<{ promptId: string; outcome: string; measuredAt: string; lastSuccessMeasuredAt: string | null }>;
  periodStart?: string; periodEnd?: string;
  atsScore: number | null;
  competitorTopAtsScore: number | null;
  citationRate: number | null; // 0-1
  vsPromptWinRate: number | null; // 0-1
  avgRank: number | null;
  domainCoverageRate: number | null; // 0-1
  trend: MonthlyLLMReport[];
  comparisons?: Record<string, { selfScore: number; competitorScore: number; sampleCount: number }>;
  competitorScores?: Record<string, number>;
  atsBreakdown?: {
    directMentionScore: number | null;
    citationDomainScore: number | null;
    fanoutCoverageScore: number | null;
  } | null;
  diagnosticAdvice?: {
    cause: string;
    action: string;
    priorityAction: string;
    estimatedImpact: string;
    recommendedKeywords?: string[];
  } | null;
  primarySourceType?: string | null;
  fanoutQueries?: string[];
  fanoutDiff?: {
    added: string[];
    kept: string[];
    dropped: string[];
    previousCount: number;
    currentCount: number;
  } | null;
}
