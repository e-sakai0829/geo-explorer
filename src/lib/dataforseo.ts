type Row = Record<string, unknown>;
const row = (value: unknown): Row => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const num = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER ? value : null;
const sum = (...values: unknown[]): number | null => values.every(v => num(v) !== null) ? (values as number[]).reduce((a, b) => a + b, 0) : null;
export interface FormattedKeyword {
  id: string; keyword: string; intent: "I" | "N" | "C" | "T" | "?"; intentLabel: string;
  position: number; prevPosition: number | null; volume: number | null; cpc: number | null; kd: number | null; traffic: number | null; url: string;
}
export interface FormattedTopPage {
  id: string; url: string; pageType: string; ur: number | null; traffic: number | null;
  trafficShare: number | null; trafficValue: number | null; refDomains: number | null;
  keywordsCount: number; topKeyword: string; topKeywordPos: number; topKeywordVol: number | null;
}
export interface FormattedMonthlyData {
  month: string; shortLabel: string; traffic: number; pos1_3: number; pos4_10: number;
  pos11_20: number; pos21_50: number; hasGoogleUpdate?: boolean; updateBadge?: string;
}
export interface SiteExplorerResult {
  schemaVersion: 3; domain: string; source: "dataforseo"; fetchedAt: string; warnings: string[];
  summary: { dr: number | null; ur: number | null; backlinks: number | null; refDomains: number | null;
    dofollowPercent: number | null; organicKeywords: number | null; organicTraffic: number | null;
    trafficValue: number | null; pos1_3Count: number | null; pos4_10Count: number | null;
    pos11_20Count: number | null; pos21_50Count: number | null };
  history: FormattedMonthlyData[]; keywords: FormattedKeyword[]; topPages: FormattedTopPage[];
}
export function normalizeDomain(input: string): string {
  if (!input.trim() || input.length > 2048) throw new Error("INVALID_DOMAIN");
  const url = new URL(input.includes("://") ? input.trim() : `https://${input.trim()}`);
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port ||
      host.length > 253 || !host.includes('.') || /^\d+(\.\d+){3}$/.test(host) ||
      !host.split('.').every(s => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s)) ||
      /\.(localhost|local|internal|test|invalid)$/.test(host)) throw new Error("INVALID_DOMAIN");
  return host;
}
export class DataForSeoError extends Error {
  constructor(public code: string, public status = 502) { super(code); }
}
export async function callDataForSeo(endpoint: string, payload: unknown): Promise<Row> {
  const login = process.env.DATAFORSEO_API_LOGIN;
  const password = process.env.DATAFORSEO_API_PASSWORD;
  if (!login || !password) throw new DataForSeoError("PROVIDER_NOT_CONFIGURED", 503);
  try {
    const response = await fetch(`https://api.dataforseo.com/v3/${endpoint}`, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new DataForSeoError(`PROVIDER_HTTP_${response.status}`, response.status === 429 ? 429 : 502);
    const body = row(await response.json());
    const task = row(list(body.tasks)[0]);
    if (body.status_code !== 20000 || task.status_code !== 20000) throw new DataForSeoError("PROVIDER_TASK_FAILED");
    const result = row(list(task.result)[0]);
    if (!Object.keys(result).length) throw new DataForSeoError("PROVIDER_EMPTY_RESULT");
    return result;
  } catch (error) {
    if (error instanceof DataForSeoError) throw error;
    throw new DataForSeoError(error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name) ? "PROVIDER_TIMEOUT" : "PROVIDER_UNAVAILABLE", 503);
  }
}
function safeUrl(value: unknown): string | null {
  try {
    const url = new URL(String(value));
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    url.hash = '';
    return url.href;
  } catch { return null; }
}
export function normalizeResults(domain: string, ranked: Row, backlinks: Row, historical: Row, warnings: string[] = []): SiteExplorerResult {
  const organic = row(row(ranked.metrics).organic);
  const seen = new Set<string>();
  const keywords: FormattedKeyword[] = [];
  const costs = new Map<string, number | null>();
  for (const value of list(ranked.items)) {
    const item = row(value), data = row(item.keyword_data), serp = row(row(item.ranked_serp_element).serp_item);
    const info = row(data.keyword_info), props = row(data.keyword_properties);
    const keyword = typeof data.keyword === 'string' ? data.keyword : '';
    if (serp.type !== 'organic' || serp.is_paid === true) continue;
    const url = safeUrl(serp.url), position = num(serp.rank_group);
    if (!keyword || !url || position === null || position < 1 || !Number.isInteger(position)) continue;
    const key = JSON.stringify([keyword, url]);
    if (seen.has(key)) continue;
    seen.add(key);
    const intentName = row(data.search_intent_info).main_intent;
    const intents: Record<string, FormattedKeyword['intent']> = { informational: 'I', navigational: 'N', commercial: 'C', transactional: 'T' };
    keywords.push({ id: key, keyword, url, position, prevPosition: null,
      volume: num(info.search_volume), cpc: num(info.cpc), kd: num(props.keyword_difficulty), traffic: num(serp.etv),
      intent: Object.hasOwn(intents, String(intentName)) ? intents[String(intentName)] : '?', intentLabel: typeof intentName === 'string' ? intentName : '未取得' });
    costs.set(key, num(serp.estimated_paid_traffic_cost));
  }
  const groups = new Map<string, FormattedKeyword[]>();
  for (const keyword of keywords) groups.set(keyword.url, [...(groups.get(keyword.url) ?? []), keyword]);
  const trafficTotal = sum(...keywords.map(k => k.traffic));
  const topPages = [...groups].map(([url, items]): FormattedTopPage => {
    items.sort((a, b) => (b.traffic ?? -1) - (a.traffic ?? -1));
    const best = items[0], traffic = sum(...items.map(k => k.traffic));
    return { id: url, url, pageType: '未分類', ur: null, refDomains: null, traffic,
      trafficShare: trafficTotal !== null && trafficTotal > 0 && traffic !== null ? traffic / trafficTotal * 100 : null,
      trafficValue: sum(...items.map(k => costs.get(k.id))), keywordsCount: items.length,
      topKeyword: best.keyword, topKeywordPos: best.position, topKeywordVol: best.volume };
  }).sort((a, b) => (b.traffic ?? -1) - (a.traffic ?? -1));
  const months = new Map<string, FormattedMonthlyData>();
  for (const value of list(historical.items)) {
    const item = row(value), metrics = row(row(item.metrics).organic);
    const year = num(item.year), month = num(item.month);
    const traffic = num(metrics.etv), p13 = sum(metrics.pos_1, metrics.pos_2_3), p410 = num(metrics.pos_4_10);
    const p1120 = num(metrics.pos_11_20), p2150 = sum(metrics.pos_21_30, metrics.pos_31_40, metrics.pos_41_50);
    if (!year || !Number.isInteger(year) || year < 2000 || year > 2100 || !month || month > 12 || !Number.isInteger(month) ||
      [traffic, p13, p410, p1120, p2150].some(v => v === null)) continue;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    months.set(key, { month: key, shortLabel: `${year}/${month}`, traffic: traffic!, pos1_3: p13!, pos4_10: p410!, pos11_20: p1120!, pos21_50: p2150! });
  }
  return { schemaVersion: 3, domain, source: 'dataforseo', fetchedAt: new Date().toISOString(), warnings,
    summary: { dr: num(backlinks.rank), ur: null, backlinks: num(backlinks.backlinks), refDomains: num(backlinks.referring_domains), dofollowPercent: null,
      organicKeywords: num(organic.count), organicTraffic: num(organic.etv), trafficValue: num(organic.estimated_paid_traffic_cost),
      pos1_3Count: sum(organic.pos_1, organic.pos_2_3), pos4_10Count: num(organic.pos_4_10), pos11_20Count: num(organic.pos_11_20),
      pos21_50Count: sum(organic.pos_21_30, organic.pos_31_40, organic.pos_41_50) },
    history: [...months].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value), keywords, topPages };
}
export async function getSiteExplorerData(domain: string): Promise<SiteExplorerResult> {
  const target = normalizeDomain(domain);
  const results = await Promise.allSettled([
    callDataForSeo('dataforseo_labs/google/ranked_keywords/live', [{ target, location_code: 2392, language_code: 'ja', item_types: ['organic'], limit: 100, order_by: ['ranked_serp_element.serp_item.etv,desc'] }]),
    callDataForSeo('backlinks/summary/live', [{ target, include_subdomains: true }]),
    callDataForSeo('dataforseo_labs/google/historical_rank_overview/live', [{ target, location_code: 2392, language_code: 'ja' }]),
  ]);
  if (results.every(r => r.status === 'rejected')) throw (results[0] as PromiseRejectedResult).reason;
  const warnings = results.flatMap((r, i) => r.status === 'rejected' ? [`${['キーワード', '被リンク', '履歴'][i]}データを取得できませんでした。`] : []);
  const values = results.map(r => r.status === 'fulfilled' ? r.value : {});
  return normalizeResults(target, values[0], values[1], values[2], warnings);
}

// Cached JSON is an external input: a version tag alone cannot establish its shape.
export function isSiteExplorerResult(value: unknown, domain: string): value is SiteExplorerResult {
  const data = row(value);
  const metric = (v: unknown) => v === null || num(v) !== null;
  const fields = (v: unknown, names: string[]) => names.every(name => metric(row(v)[name]));
  const text = (v: unknown) => typeof v === 'string';
  const validUrl = (v: unknown) => typeof v === 'string' && safeUrl(v) === v;
  const bounded = (v: unknown, max: number, test: (item: Row) => boolean) =>
    Array.isArray(v) && v.length <= max && v.every(item => !!item && typeof item === 'object' && !Array.isArray(item) && test(row(item)));
  const timestamp = typeof data.fetchedAt === 'string' ? Date.parse(data.fetchedAt) : NaN;
  return data.schemaVersion === 3 && data.domain === domain && data.source === 'dataforseo' &&
    Number.isFinite(timestamp) && timestamp <= Date.now() &&
    fields(data.summary, ['dr', 'ur', 'backlinks', 'refDomains', 'dofollowPercent', 'organicKeywords', 'organicTraffic', 'trafficValue', 'pos1_3Count', 'pos4_10Count', 'pos11_20Count', 'pos21_50Count']) &&
    bounded(data.history, 120, item => text(item.month) && /^\d{4}-(0[1-9]|1[0-2])$/.test(String(item.month)) && text(item.shortLabel) &&
      ['traffic', 'pos1_3', 'pos4_10', 'pos11_20', 'pos21_50'].every(key => num(item[key]) !== null) &&
      (item.hasGoogleUpdate === undefined || typeof item.hasGoogleUpdate === 'boolean') && (item.updateBadge === undefined || text(item.updateBadge))) &&
    bounded(data.keywords, 100, item => text(item.id) && text(item.keyword) && text(item.intentLabel) && ['I', 'N', 'C', 'T', '?'].includes(String(item.intent)) &&
      validUrl(item.url) && Number.isInteger(item.position) && Number(item.position) >= 1 &&
      fields(item, ['prevPosition', 'volume', 'kd', 'traffic']) &&
      (item.cpc === undefined || metric(item.cpc))) &&
    bounded(data.topPages, 100, item => text(item.id) && validUrl(item.url) && text(item.pageType) && text(item.topKeyword) &&
      Number.isInteger(item.keywordsCount) && Number(item.keywordsCount) >= 1 && Number.isInteger(item.topKeywordPos) && Number(item.topKeywordPos) >= 1 &&
      fields(item, ['ur', 'traffic', 'trafficShare', 'trafficValue', 'refDomains', 'topKeywordVol'])) &&
    Array.isArray(data.warnings) && data.warnings.length <= 10 && data.warnings.every(text);
}
