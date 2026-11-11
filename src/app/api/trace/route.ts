import { NextResponse } from "next/server";
import { getConsoleData } from "@/lib/data/console";
import { siteMetricRepository } from "@/server/repositories/site-metric-repository";

// One real request through this site's path, timed hop by hop on the server, for /architecture.
// Nothing is simulated: the cache hop is the hero console's cached read, the database hop is a
// round trip to Postgres. The browser adds its own measurement of the whole trip.
// shortcut: no rate limit; each call is one cached read and one `select 1`. Add one if it is ever abused.
export const dynamic = "force-dynamic";

const since = (t: number) => Math.max(0.1, Math.round((performance.now() - t) * 10) / 10);

export async function GET() {
  const started = performance.now();

  let t = performance.now();
  const consoleData = await getConsoleData();
  const cache = { ms: since(t), ok: consoleData !== null };

  t = performance.now();
  let db: { ms: number; ok: boolean };
  try {
    await siteMetricRepository.ping();
    db = { ms: since(t), ok: true };
  } catch {
    // The public pages degrade here instead of failing; the trace shows that, too.
    db = { ms: since(t), ok: false };
  }

  return NextResponse.json(
    { server: since(started), cache, db, region: process.env.VERCEL_REGION ?? null, at: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
