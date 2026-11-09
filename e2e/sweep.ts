// Manual cleanup after an interrupted run: pnpm exec tsx e2e/sweep.ts
import { sweepE2ERows } from "./support/owner-db";

sweepE2ERows()
  .then((counts) => console.log(`Removed E2E leftovers: ${JSON.stringify(counts)}`))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message.split("\n")[0] : "Sweep failed.");
    process.exit(1);
  });
