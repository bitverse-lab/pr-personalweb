/**
 * Fixed-window counter kept in this server instance's memory. Returns how many seconds the caller
 * must wait, or 0 when the hit is allowed.
 * shortcut: per instance, so N warm serverless instances allow N times the limit; move it to the
 * database or a KV store if a public endpoint ever needs a hard limit.
 */
export function createRateLimit(limit: number, windowMs: number) {
  const windows = new Map<string, { start: number; count: number }>();
  return (key: string, now = Date.now()): number => {
    const w = windows.get(key);
    if (!w || now - w.start >= windowMs) {
      // Drop expired keys now and then so one instance never holds every address it has seen.
      if (windows.size > 5000) windows.forEach((v, k) => now - v.start >= windowMs && windows.delete(k));
      windows.set(key, { start: now, count: 1 });
      return 0;
    }
    if (w.count >= limit) return Math.ceil((w.start + windowMs - now) / 1000);
    w.count++;
    return 0;
  };
}

/** The caller's address as the proxy reports it ("" when there is none, e.g. local requests). */
export const clientIp = (h: Headers) => (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
