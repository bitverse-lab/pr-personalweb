import { test } from "@playwright/test";

// CI runs against a deliberately unreachable database (see .github/workflows/ci.yml), so the site
// shows its empty, placeholder state there. Tests that assert on the demo dataset skip in CI and run
// locally after `pnpm db:seed --yes`.
export const SEED_ONLY = "needs the demo dataset (pnpm db:seed --yes); CI has no database";

export function needsSeed() {
  test.skip(!!process.env.CI, SEED_ONLY);
}
