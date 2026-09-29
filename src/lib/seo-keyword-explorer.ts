export type KeywordMetric = number | null;

export interface RelatedKeyword {
  keyword: string;
  volume: KeywordMetric;
  difficulty: KeywordMetric;
  cpc: KeywordMetric;
  intent: string | null;
}

export interface OrganicResult {
  rank: number;
  domain: string;
  url: string;
  title: string;
}

export interface KeywordExplorerResult {
  schemaVersion: 1;
  keyword: string;
  location: 'JP';
  language: 'ja';
  fetchedAt: string;
  source: 'dataforseo';
  overview: RelatedKeyword;
  related: RelatedKeyword[];
  organicResults: OrganicResult[];
  warnings: string[];
}

type Row = Record<string, unknown>;
const row = (value: unknown): Row => value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const metric = (value: unknown): KeywordMetric => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
const string = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null;

export function normalizeKeyword(input: unknown): string {
  if (typeof input !== 'string') throw new Error('INVALID_KEYWORD');
  const keyword = input.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLocaleLowerCase('ja');
  if (keyword.length < 2 || keyword.length > 80 || /[\u0000-\u001f\u007f]/u.test(keyword)) throw new Error('INVALID_KEYWORD');
  return keyword;
}

function keywordMetric(value: unknown): RelatedKeyword | null {
  const item = row(value);
  const keyword = string(item.keyword);
  if (!keyword) return null;
  const info = row(item.keyword_info);
  const properties = row(item.keyword_properties);
  return {
    keyword,
    volume: metric(info.search_volume),
    difficulty: metric(properties.keyword_difficulty),
    cpc: metric(info.cpc),
    intent: string(row(item.search_intent_info).main_intent),
  };
}

export function formatKeywordExplorerResult(
  keyword: string,
  overviewResponse: unknown,
  relatedResponse: unknown,
  serpResponse: unknown,
  warnings: string[],
): KeywordExplorerResult {
  const overviewItem = row(list(row(overviewResponse).items)[0]);
  const overview = keywordMetric(overviewItem) ?? { keyword, volume: null, difficulty: null, cpc: null, intent: null };
  const seenKeywords = new Set<string>([keyword.toLocaleLowerCase('ja')]);
  const related: RelatedKeyword[] = [];
  for (const value of list(row(relatedResponse).items)) {
    const item = keywordMetric(row(value).keyword_data);
    if (!item || seenKeywords.has(item.keyword.toLocaleLowerCase('ja'))) continue;
    seenKeywords.add(item.keyword.toLocaleLowerCase('ja'));
    related.push(item);
    if (related.length >= 20) break;
  }
  const organicResults: OrganicResult[] = [];
  const seenRanks = new Set<number>();
  for (const value of list(row(serpResponse).items)) {
    const item = row(value);
    const rank = metric(item.rank_group);
    const rawUrl = string(item.url);
    if (item.type !== 'organic' || rank === null || !Number.isInteger(rank) || rank < 1 || rank > 10 || seenRanks.has(rank) || !rawUrl) continue;
    try {
      const url = new URL(rawUrl);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) continue;
      seenRanks.add(rank);
      organicResults.push({ rank, domain: url.hostname, url: url.href, title: string(item.title) ?? url.hostname });
    } catch { /* Skip malformed provider URLs. */ }
  }
  organicResults.sort((a, b) => a.rank - b.rank);
  return { schemaVersion: 1, keyword, location: 'JP', language: 'ja', fetchedAt: new Date().toISOString(), source: 'dataforseo', overview, related, organicResults, warnings };
}

export function isKeywordExplorerResult(value: unknown, keyword: string): value is KeywordExplorerResult {
  const result = row(value);
  const validMetric = (value: unknown) => value === null || metric(value) !== null;
  const validKeyword = (value: unknown) => {
    const item = row(value);
    return typeof item.keyword === 'string' && item.keyword.length > 0 && item.keyword.length <= 80 &&
      ['volume', 'difficulty', 'cpc'].every(key => validMetric(item[key])) &&
      (item.intent === null || typeof item.intent === 'string');
  };
  const validOrganic = (value: unknown) => {
    const item = row(value);
    if (!Number.isInteger(item.rank) || (item.rank as number) < 1 || (item.rank as number) > 10 ||
        typeof item.domain !== 'string' || typeof item.url !== 'string' || typeof item.title !== 'string') return false;
    try {
      const url = new URL(item.url);
      return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && url.hostname === item.domain;
    } catch { return false; }
  };
  return result.schemaVersion === 1 && result.keyword === keyword && result.location === 'JP' && result.language === 'ja' &&
    result.source === 'dataforseo' && typeof result.fetchedAt === 'string' && Number.isFinite(Date.parse(result.fetchedAt)) &&
    Array.isArray(result.related) && result.related.length <= 20 && result.related.every(validKeyword) &&
    Array.isArray(result.organicResults) && result.organicResults.length <= 10 && result.organicResults.every(validOrganic) &&
    Array.isArray(result.warnings) && result.warnings.length <= 3 && result.warnings.every(warning => typeof warning === 'string') &&
    validKeyword(result.overview);
}
