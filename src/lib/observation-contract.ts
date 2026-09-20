export const OBSERVATION_MODELS = ["gemini-3.6-flash", "gemini-2.0-flash"] as const;
export function normalizeObservationLocale(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid observation locale");
  const aliases: Record<string, string> = { ja: "ja-JP", "ja-jp": "ja-JP", en: "en-US", "en-us": "en-US", "zh-tw": "zh-TW" };
  const locale = aliases[value.trim().toLowerCase()];
  if (!locale) throw new Error("Unsupported observation locale");
  return locale;
}
export const observationV2Enabled = () => process.env.GEO_OBSERVATION_V2_ENABLED === "true";
export const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
