export function formatTickLabel(value: number): string {
  if (!Number.isFinite(value)) return "—";
  for (const [unit, suffix] of [[1e9, "B"], [1e6, "M"], [1e3, "K"]] as const) {
    if (value >= unit && value < unit * 1000) return `${Number((value / unit).toPrecision(4))}${suffix}`;
  }
  return value >= 1e12 ? value.toExponential(2) : String(Number(value.toPrecision(4)));
}

export function calculateNiceScale(rawMax: number, divisions = 4) {
  const count = Number.isInteger(divisions) && divisions >= 1 && divisions <= 20 ? divisions : 4;
  const value = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : 0;
  const rawStep = Math.max(1, (value / count) * 1.05);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const factor = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(n => n * magnitude >= rawStep) ?? 10;
  let step = Math.max(1, factor * magnitude);
  if (!Number.isFinite(step * count)) step = Number.MAX_VALUE / count;
  const max = step * count;
  return { max, step, ticks: Array.from({ length: count + 1 }, (_, i) => {
    const value = step * (count - i);
    return { value, yPercent: i / count * 100, label: formatTickLabel(value) };
  }) };
}

export function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);
  if (typeof value === "string" && /^[\s]*[=+@-]/u.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

export const displayMetric = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("ja-JP", { maximumFractionDigits: 2 }) : "—";
