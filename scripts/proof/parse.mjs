// Pure parsers for the Proof workflow: tool output in, plain facts out. Unit-tested.

const kb = (n, unit) => (unit === "MB" ? n * 1024 : unit === "B" ? n / 1024 : n);

/**
 * Route table printed by `next build`:
 *   "├ ƒ /me/tasks      8.35 kB    127 kB"   and   "+ First Load JS shared by all   87.6 kB"
 * @returns {{ sharedKb: number | null, routes: { route: string, kind: "static" | "dynamic", sizeKb: number, firstLoadKb: number }[] }}
 */
export function parseBuildOutput(stdout) {
  const routes = [];
  let sharedKb = null;
  for (const line of stdout.split(/\r?\n/)) {
    const shared = /First Load JS shared by all\s+([\d.]+)\s*(B|kB|MB)/.exec(line);
    if (shared) sharedKb = +kb(+shared[1], shared[2]).toFixed(1);
    const m = /^[┌├└]\s+([○ƒ●])\s+(\/\S*)\s+([\d.]+)\s*(B|kB|MB)\s+([\d.]+)\s*(B|kB|MB)\s*$/.exec(line.trim());
    if (m) routes.push({ route: m[2], kind: m[1] === "ƒ" ? "dynamic" : "static", sizeKb: +kb(+m[3], m[4]).toFixed(2), firstLoadKb: +kb(+m[5], m[6]).toFixed(1) });
  }
  return { sharedKb, routes };
}

/** `playwright test --list` ends with "Total: 93 tests in 14 files". */
export function parsePlaywrightList(stdout) {
  const m = /Total:\s+(\d+)\s+tests?\s+in\s+(\d+)\s+files?/.exec(stdout);
  return m ? { total: +m[1], files: +m[2] } : null;
}

/** The JSON reporter of `vitest run` (jest-compatible fields). */
export function summarizeVitest(json) {
  return {
    total: json.numTotalTests,
    passed: json.numPassedTests,
    failed: json.numFailedTests,
    // testResults is one entry per file; numTotalTestSuites also counts every describe block.
    files: json.testResults?.length ?? json.numTotalTestSuites ?? 0,
  };
}

// "Breaking" distance between two versions: the major number, or the minor for 0.x (semver treats
// every 0.x minor as breaking).
const line = (v) => {
  const [major, minor] = String(v).replace(/^[^\d]*/, "").split(".").map(Number);
  return major === 0 ? `0.${minor}` : String(major);
};

/** `pnpm outdated --format json` and the number of direct dependencies in package.json. */
export function summarizeOutdated(json, direct) {
  const entries = Object.entries(json).filter(([, d]) => d.current && d.latest);
  const behindMajor = entries.filter(([, d]) => line(d.current) !== line(d.latest)).map(([name]) => name);
  return {
    direct,
    current: direct - entries.length,
    behind: entries.length,
    behindMajor: behindMajor.length,
    majorNames: behindMajor.slice(0, 6),
    deprecated: entries.filter(([, d]) => d.isDeprecated).map(([name]) => name),
  };
}
