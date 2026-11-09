import { sweepE2ERows } from "./support/owner-db";

// Runs after every Playwright run, so a test that died after publishing never leaves an
// "E2E · " record on the live site. Skipped in CI, where the sync spec does not run.
export default async function globalTeardown() {
  if (process.env.CI) return;
  try {
    const counts = await sweepE2ERows();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total) console.log(`E2E teardown removed leftovers: ${JSON.stringify(counts)}`);
  } catch (error) {
    // No database (e.g. only public smoke tests were run offline): nothing to sweep.
    console.warn(`E2E teardown skipped: ${error instanceof Error ? error.message.split("\n")[0] : "unknown error"}`);
  }
}
