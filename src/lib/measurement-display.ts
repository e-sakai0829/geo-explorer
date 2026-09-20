// Display semantics only; does not change the scan engine or certify a baseline.
export type DisplayLanguage = "ja" | "en" | "zh-TW";
export function qualityLabel(lang: DisplayLanguage) {
  return lang === "en" ? "Quality not evaluated" : lang === "zh-TW" ? "品質未評估" : "品質未評価";
}
export function formatMeasuredScore(value: unknown, suffix = " pt") {
  return typeof value === "number" && Number.isFinite(value) ? `${value}${suffix}` : "未計測";
}
export type Observation = { status?: unknown; lastScannedAt?: unknown; brandCited?: unknown; brandMentioned?: unknown };
export function observationState(item: Observation): "cited" | "mentioned" | "none" | "unmeasured" {
  if (item.status !== "verified" || typeof item.lastScannedAt !== "string" || !Number.isFinite(Date.parse(item.lastScannedAt))) return "unmeasured";
  if (typeof item.brandCited !== "boolean" || typeof item.brandMentioned !== "boolean") return "unmeasured";
  return item.brandCited ? "cited" : item.brandMentioned ? "mentioned" : "none";
}
export function observationLabel(item: Observation, lang: DisplayLanguage) {
  const labels = {
    ja: { cited: "自社ドメインの参照を検出", mentioned: "自社ブランドの言及を検出（参照未検出）", none: "自社ブランドの言及・参照ともに未検出", unmeasured: "未測定（要スキャン）" },
    en: { cited: "Domain citation detected", mentioned: "Brand mention detected (no citation)", none: "No brand mention or citation detected", unmeasured: "Unmeasured (scan required)" },
    "zh-TW": { cited: "檢出自社網域參照", mentioned: "檢出品牌提及（未檢出參照）", none: "未檢出品牌提及或參照", unmeasured: "未測定（需要掃描）" }
  };
  return labels[lang][observationState(item)];
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function httpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try { const u = new URL(value); return ["http:", "https:"].includes(u.protocol) && !u.username && !u.password; } catch { return false; }
}
export function sanitizeTrackedItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap(item => {
    if (!record(item) || typeof item.id !== "string" || !item.id.trim() || seen.has(item.id)
      || typeof item.prompt !== "string" || !item.prompt.trim() || !httpUrl(item.url)
      || typeof item.date !== "string" || !Number.isFinite(Date.parse(item.date))) return [];
    seen.add(item.id);
    const lastScannedAt = typeof item.lastScannedAt === "string" && Number.isFinite(Date.parse(item.lastScannedAt)) ? item.lastScannedAt : null;
    const verified = item.status === "verified" && lastScannedAt !== null && typeof item.brandCited === "boolean" && typeof item.brandMentioned === "boolean";
    return [{
      promptId: typeof item.promptId === "string" ? item.promptId : null,
      surface: item.surface === "gemini_api" && item.scoreVersion === "v2" ? "gemini_api" : "legacy_unknown",
      scoreVersion: item.surface === "gemini_api" && item.scoreVersion === "v2" ? "v2" : "v1",
      modelName: typeof item.modelName === "string" ? item.modelName : "unknown",
      locale: typeof item.locale === "string" ? item.locale : "unknown",
      outcome: item.outcome === "success" || item.outcome === "unmeasured" ? item.outcome : "unknown",
      id: item.id, prompt: item.prompt, url: item.url, date: item.date,
      status: verified ? "verified" : "pending", hasBaseline: false,
      lastScannedAt: verified ? lastScannedAt : null,
      brandCited: verified ? item.brandCited as boolean : null,
      brandMentioned: verified ? item.brandMentioned as boolean : null,
      aiResponse: verified && typeof item.aiResponse === "string" ? item.aiResponse : null,
      citationSources: verified && Array.isArray(item.citationSources) ? item.citationSources.flatMap(source =>
        record(source) && httpUrl(source.url) ? [{ url: source.url, title: typeof source.title === "string" ? source.title : "" }] : []) : []
    }];
  });
}

export function trackedCitationSummary(items: any[], modelName: string, locale: string) {
  const latest = new Map<string, any>();
  for (const item of items) {
    if (item.surface !== 'gemini_api' || item.scoreVersion !== 'v2' || item.modelName !== modelName || item.locale !== locale || item.outcome !== 'success'
      || !item.promptId || observationState(item) === 'unmeasured') continue;
    const previous = latest.get(item.promptId);
    if (!previous || Date.parse(item.lastScannedAt) > Date.parse(previous.lastScannedAt) || (item.lastScannedAt === previous.lastScannedAt && item.id > previous.id)) latest.set(item.promptId, item);
  }
  const values = [...latest.values()];
  const cited = values.filter(item => item.brandCited === true).length;
  return { count: values.length, cited, rate: values.length ? cited / values.length : null };
}
