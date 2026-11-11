import { unstable_cache } from "next/cache";
import { SITE_REVALIDATE_SECONDS, publicRead } from "@/lib/data/site-cache";
import { siteMetricRepository } from "@/server/repositories/site-metric-repository";

// What /proof shows. Written by scripts/proof/collect.mjs (the Proof workflow); the shapes below
// are what that script stores.
export interface RunFact {
  conclusion: string;
  at: string;
  sha: string;
  run: number;
  sizeBytes?: number;
}
export interface ProofMetrics {
  tests?: { total: number; passed: number; failed: number; files: number };
  e2e?: { total: number; files: number };
  bundle?: { sharedKb: number | null; routes: { route: string; kind: "static" | "dynamic"; sizeKb: number; firstLoadKb: number }[] };
  ci?: RunFact;
  backup?: RunFact;
  reminders?: RunFact;
  commit?: { sha: string };
  deps?: { direct: number; current: number; behind: number; behindMajor: number; majorNames: string[]; deprecated: string[] };
}
export interface Proof {
  metrics: ProofMetrics;
  /** When each metric was written, ISO. */
  measuredAt: Partial<Record<keyof ProofMetrics, string>>;
  /** Round trips from this server to the database, timed when this data was generated. */
  latency: { medianMs: number; maxMs: number; samples: number; at: string } | null;
}

const EMPTY: Proof = { metrics: {}, measuredAt: {}, latency: null };

const loadProof = unstable_cache(
  async (): Promise<Proof> => {
    const rows = await siteMetricRepository.all();
    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t = performance.now();
      await siteMetricRepository.ping();
      times.push(performance.now() - t);
    }
    times.sort((a, b) => a - b);
    return {
      metrics: Object.fromEntries(rows.map((r) => [r.key, r.value])) as ProofMetrics,
      measuredAt: Object.fromEntries(rows.map((r) => [r.key, r.measuredAt.toISOString()])),
      latency: { medianMs: Math.round(times[2]), maxMs: Math.round(times[4]), samples: times.length, at: new Date().toISOString() },
    };
  },
  ["public-proof"],
  { revalidate: SITE_REVALIDATE_SECONDS },
);

/** Empty when the database is unreachable: the page then says so instead of failing. */
export function getProof(): Promise<Proof> {
  return publicRead("the proof page", loadProof, EMPTY);
}
