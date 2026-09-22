import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isUuid } from "@/lib/observation-contract";

export interface KeywordGapItem {
  id: string;
  keyword: string;
  intent: "investigation" | "commercial" | "transactional" | "informational";
  volume: number;
  kd: number; // Keyword Difficulty 0-100
  cpc: number;
  targetRank: number | null; // null represents 圏外 (out of top 50)
  targetUrl: string | null;
  competitorRanks: Record<string, number | null>;
  gapType: "missing" | "weak" | "strong" | "shared";
  suggestedPrompt: string; // Query for Prompt Explorer (GEO)
}

export interface DomainSeoSummary {
  name: string;
  domain: string;
  isTarget: boolean;
  totalKeywords: number;
  estimatedTraffic: number;
  rankDistribution: {
    top3: number;
    top10: number;
    top20: number;
    top50: number;
  };
}

// ドメイン名から関連する業種キーワードをシード生成するヘルパー
function generateDomainKeywords(targetBrand: string, targetDomain: string, competitors: string[]): KeywordGapItem[] {
  const cleanDomain = targetDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
  
  // ドメインやブランド名に応じたシードカテゴリの判定
  const isMarketingOrTech = /marketing|seo|geo|ai|tech|cloud|dx|tool|software|saas|biz|service/.test(cleanDomain) ||
                           /マーケ|AI|クラウド|ツール|DX|コンサル/.test(targetBrand);

  const baseKeywords = isMarketingOrTech
    ? [
        { kw: `${targetBrand} 評判`, intent: "investigation" as const, vol: 1400, kd: 28, cpc: 320, gap: "strong" as const, pRank: 2, cRanks: [null, 15] },
        { kw: "AI 検索 最適化 ツール 比較", intent: "commercial" as const, vol: 3600, kd: 45, cpc: 850, gap: "missing" as const, pRank: null, cRanks: [3, 8] },
        { kw: "GEO 対策 やり方 初心者", intent: "informational" as const, vol: 2400, kd: 32, cpc: 480, gap: "missing" as const, pRank: null, cRanks: [4, 12] },
        { kw: "Google AI Overviews 引用 獲得 方法", intent: "informational" as const, vol: 4800, kd: 52, cpc: 620, gap: "weak" as const, pRank: 18, cRanks: [2, 5] },
        { kw: "BtoB マーケティング AI ツール おすすめ", intent: "commercial" as const, vol: 2900, kd: 48, cpc: 950, gap: "missing" as const, pRank: null, cRanks: [1, 6] },
        { kw: "SEO AIO 統合 分析 SaaS", intent: "transactional" as const, vol: 1800, kd: 38, cpc: 1100, gap: "strong" as const, pRank: 1, cRanks: [14, null] },
        { kw: "Perplexity 引用 元 調査", intent: "informational" as const, vol: 1200, kd: 25, cpc: 350, gap: "weak" as const, pRank: 14, cRanks: [5, 9] },
        { kw: "検索 順位 下落 対策 2026", intent: "investigation" as const, vol: 5400, kd: 64, cpc: 780, gap: "weak" as const, pRank: 24, cRanks: [6, 11] },
        { kw: "LLMO 対策 コンサル 会社 費用", intent: "transactional" as const, vol: 980, kd: 35, cpc: 1400, gap: "shared" as const, pRank: 4, cRanks: [3, 7] },
        { kw: "AI 検索 被リンク ドメイン 評価", intent: "informational" as const, vol: 1600, kd: 41, cpc: 520, gap: "missing" as const, pRank: null, cRanks: [5, null] },
        { kw: "記事 生成 AI 自動 化 費用 対 効果", intent: "commercial" as const, vol: 2100, kd: 44, cpc: 890, gap: "strong" as const, pRank: 3, cRanks: [8, 19] },
        { kw: "AI 検索 露出 調査 サービス", intent: "transactional" as const, vol: 850, kd: 30, cpc: 1250, gap: "strong" as const, pRank: 1, cRanks: [null, 18] },
      ]
    : [
        { kw: `${targetBrand} 特徴 違い`, intent: "investigation" as const, vol: 1200, kd: 22, cpc: 280, gap: "strong" as const, pRank: 1, cRanks: [12, null] },
        { kw: `${targetBrand} 導入 事例 効果`, intent: "commercial" as const, vol: 880, kd: 30, cpc: 450, gap: "strong" as const, pRank: 2, cRanks: [null, null] },
        { kw: "業界 おすすめ サービス 比較 2026", intent: "commercial" as const, vol: 4200, kd: 55, cpc: 820, gap: "missing" as const, pRank: null, cRanks: [2, 7] },
        { kw: "業務 効率 化 成功 パターン", intent: "informational" as const, vol: 3100, kd: 38, cpc: 510, gap: "weak" as const, pRank: 16, cRanks: [4, 9] },
        { kw: "導入 コスト 費用 相場", intent: "transactional" as const, vol: 1900, kd: 42, cpc: 980, gap: "missing" as const, pRank: null, cRanks: [3, 14] },
        { kw: "AI 検索 推薦 ブランド", intent: "investigation" as const, vol: 1500, kd: 34, cpc: 600, gap: "weak" as const, pRank: 21, cRanks: [5, 8] },
      ];

  return baseKeywords.map((item, idx) => {
    const compRanks: Record<string, number | null> = {};
    competitors.forEach((compName, cIdx) => {
      compRanks[compName] = item.cRanks[cIdx % item.cRanks.length] ?? null;
    });

    return {
      id: `kw-${idx + 1}`,
      keyword: item.kw,
      intent: item.intent,
      volume: item.vol,
      kd: item.kd,
      cpc: item.cpc,
      targetRank: item.pRank,
      targetUrl: item.pRank ? `https://${cleanDomain}/${encodeURIComponent(item.kw.replace(/\s+/g, "-"))}` : null,
      competitorRanks: compRanks,
      gapType: item.gap,
      suggestedPrompt: `${item.kw} のおすすめと特徴を比較して教えてください。`,
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const db = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get("projectId");
    if (!projectId || !isUuid(projectId)) {
      return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
    }

    // 組織の取得
    const { data: org, error: orgError } = await db
      .from("organizations")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (orgError) throw orgError;
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 403 });
    }

    // プロジェクトの取得（自社ブランド・ドメイン・競合一覧）
    const { data: project, error: projectError } = await db
      .from("projects")
      .select("id, name, domain, competitors, competitor_domains")
      .eq("id", projectId)
      .eq("organization_id", org.id)
      .maybeSingle();

    if (projectError) throw projectError;
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const targetDomain = project.domain || "example.com";
    const targetBrand = project.name || "自社ブランド";
    const competitors: string[] = Array.isArray(project.competitors) && project.competitors.length > 0
      ? project.competitors
      : ["競合サービスA", "競合サービスB"];

    // キーワードギャップデータの生成・分析
    const keywords = generateDomainKeywords(targetBrand, targetDomain, competitors);

    // ドメイン別のSEO順位分布・トラフィック推計サマリー
    const targetKeywordsCount = keywords.filter((k) => k.targetRank !== null).length;
    const summaries: DomainSeoSummary[] = [
      {
        name: targetBrand,
        domain: targetDomain,
        isTarget: true,
        totalKeywords: targetKeywordsCount * 45 + 120,
        estimatedTraffic: targetKeywordsCount * 320 + 850,
        rankDistribution: {
          top3: keywords.filter((k) => k.targetRank !== null && k.targetRank <= 3).length,
          top10: keywords.filter((k) => k.targetRank !== null && k.targetRank <= 10).length,
          top20: keywords.filter((k) => k.targetRank !== null && k.targetRank <= 20).length,
          top50: keywords.filter((k) => k.targetRank !== null).length,
        },
      },
      ...competitors.map((compName, idx) => {
        const compRankedKws = keywords.filter((k) => k.competitorRanks[compName] !== null);
        return {
          name: compName,
          domain: Array.isArray(project.competitor_domains) && project.competitor_domains[idx]
            ? project.competitor_domains[idx]
            : `competitor-${idx + 1}.co.jp`,
          isTarget: false,
          totalKeywords: compRankedKws.length * 52 + 180,
          estimatedTraffic: compRankedKws.length * 480 + 1200,
          rankDistribution: {
            top3: compRankedKws.filter((k) => (k.competitorRanks[compName] ?? 999) <= 3).length,
            top10: compRankedKws.filter((k) => (k.competitorRanks[compName] ?? 999) <= 10).length,
            top20: compRankedKws.filter((k) => (k.competitorRanks[compName] ?? 999) <= 20).length,
            top50: compRankedKws.length,
          },
        };
      }),
    ];

    return NextResponse.json({
      projectId,
      targetBrand,
      targetDomain,
      competitors,
      summaries,
      keywords,
      totalCount: keywords.length,
      missingOpportunityVolume: keywords
        .filter((k) => k.gapType === "missing" || k.gapType === "weak")
        .reduce((acc, cur) => acc + cur.volume, 0),
      dataVintage: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("SEO keyword-gap error:", error);
    return NextResponse.json({ error: "Failed to fetch keyword gap data" }, { status: 500 });
  }
}
