import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The hero's live SQL console: a real Postgres (PGlite) in the visitor's browser, loaded with the
// public snapshot. Needs the snapshot to have rows, so it runs locally (CI has no database).
test.skip(!!process.env.CI, "needs public data in the snapshot; run locally with pnpm test:e2e");
test.describe.configure({ timeout: 240_000 });

const SLOW = { timeout: 120_000 };

test("make it live: real queries, errors, local writes, runaway queries stopped", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: /Make it live/ }).click();
  const live = page.getByTestId("live-console");
  // The first preset runs by itself once Postgres is up.
  await expect(live.locator("tbody tr").first()).toBeVisible(SLOW);
  await expect(live.locator(".qc-host")).toContainText(/postgres \d+/);

  const editor = live.getByLabel("SQL to run");
  await editor.fill("SELECT nope FROM project;");
  await editor.press("Control+Enter");
  await expect(live.locator(".qc-live-error")).toContainText("nope");

  // Writes change only this tab's copy.
  await editor.fill("DELETE FROM testimonial; SELECT count(*) FROM testimonial;");
  await editor.press("Control+Enter");
  await expect(live.locator("tbody td").first()).toHaveText("0");

  // A query that would run forever is stopped, and the sandbox comes back with the original data.
  await editor.fill("SELECT count(*) FROM generate_series(1, 2000000000);");
  await editor.press("Control+Enter");
  await expect(live.locator(".qc-live-error")).toContainText(/Stopped after 5 s/, { timeout: 30_000 });
  await expect(live.locator(".qc-foot")).toContainText(/ready in/, SLOW);
  await editor.fill("SELECT count(*) > 0 FROM project;");
  await editor.press("Control+Enter");
  await expect(live.locator("tbody td").first()).toHaveText("true");

  const a11y = await new AxeBuilder({ page }).include("[data-testid=live-console]").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(a11y.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(" | ")}`)).toEqual([]);

  await live.getByRole("button", { name: "back to read-only" }).click();
  await expect(page.getByTestId("console")).toBeVisible();
  expect(errors).toEqual([]);
});
