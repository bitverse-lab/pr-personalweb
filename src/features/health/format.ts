/** Format a "YYYY-MM-DD" string without any timezone shift. */
export function fmtDate(d: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}

export function fmtDelta(n: number | null, unit = "kg"): string {
  if (n === null) return "—";
  if (n === 0) return `0 ${unit}`;
  return `${n > 0 ? "+" : "−"}${Math.abs(n)} ${unit}`;
}
