import type { FormattedKeyword, SiteExplorerResult } from './dataforseo';

export interface GapDomain {
  domain: string;
  name: string;
  color: string;
}

export interface GapSummary extends GapDomain {
  url: string;
  totalTraffic: number | null;
  totalKeywords: number | null;
  rankDistribution: {
    pos1_3: number | null;
    pos4_10: number | null;
    pos11_20: number | null;
    pos21_plus: number | null;
  };
  fetchedAt: string;
}

export interface GapKeyword {
  id: string;
  keyword: string;
  volume: number | null;
  cpc: number | null; // DataForSEO reports CPC in USD.
  domainStats: Record<string, { rank: number | null; traffic: number | null; rankChange: null }>;
}

function bestKeyword(items: FormattedKeyword[]): Map<string, FormattedKeyword> {
  const result = new Map<string, FormattedKeyword>();
  for (const item of items) {
    const previous = result.get(item.keyword);
    if (!previous || item.position < previous.position ||
      (item.position === previous.position && (item.traffic ?? -1) > (previous.traffic ?? -1))) {
      result.set(item.keyword, item);
    }
  }
  return result;
}

export function buildKeywordGap(domains: GapDomain[], reports: SiteExplorerResult[]) {
  if (domains.length !== reports.length || !domains.length) throw new Error('INVALID_GAP_INPUT');
  const perDomain = reports.map(report => bestKeyword(report.keywords));
  const keywords = new Map<string, GapKeyword>();
  perDomain.forEach((items, index) => {
    for (const [keyword, item] of items) {
      const existing = keywords.get(keyword) ?? {
        id: keyword, keyword, volume: null, cpc: null,
        domainStats: {} as GapKeyword['domainStats'],
      };
      existing.volume ??= item.volume;
      existing.cpc ??= item.cpc ?? null;
      existing.domainStats[domains[index].domain] = {
        rank: item.position, traffic: item.traffic, rankChange: null,
      };
      keywords.set(keyword, existing);
    }
  });
  const rows = [...keywords.values()].map(item => {
    for (const domain of domains) item.domainStats[domain.domain] ??= { rank: null, traffic: null, rankChange: null };
    return item;
  }).sort((a, b) => (b.volume ?? -1) - (a.volume ?? -1) || a.keyword.localeCompare(b.keyword, 'ja'));

  const summaries: GapSummary[] = reports.map((report, index) => {
    const s = report.summary;
    const known = [s.pos1_3Count, s.pos4_10Count, s.pos11_20Count];
    const pos21Plus = s.organicKeywords !== null && known.every(v => v !== null)
      ? Math.max(0, s.organicKeywords - known.reduce<number>((total, v) => total + (v ?? 0), 0))
      : null;
    return {
      ...domains[index], url: `https://${domains[index].domain}`,
      totalTraffic: s.organicTraffic, totalKeywords: s.organicKeywords,
      rankDistribution: {
        pos1_3: s.pos1_3Count, pos4_10: s.pos4_10Count,
        pos11_20: s.pos11_20Count, pos21_plus: pos21Plus,
      },
      fetchedAt: report.fetchedAt,
    };
  });
  return { domains, summaries, keywords: rows, totalCount: rows.length };
}
