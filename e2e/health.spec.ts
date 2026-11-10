import { expect, test } from "./support/owner";

// Read-only checks of the Health pages against the live database: nothing is written.
test.skip(!!process.env.CI, "reads the live database; run locally with pnpm test:e2e");
test.describe.configure({ timeout: 120_000 });

const SLOW = { timeout: 30_000 };

test("overview shows progress rings for goals that are set", async ({ ownerPage: page }) => {
  await page.goto("/me/health");
  await expect(page.getByText("Workouts this week")).toBeVisible(SLOW);
  await expect(page.getByRole("img", { name: /% of target/ }).first()).toBeVisible();
});

test("weight entries start with the last two weeks and unfold", async ({ ownerPage: page }) => {
  await page.goto("/me/health/weight");
  const rows = page.locator("table").last().locator("tbody tr");
  await expect(rows.first()).toBeVisible(SLOW);
  const more = page.getByRole("button", { name: /Show all \d+ entries/ });
  if ((await more.count()) === 0) test.skip(true, "fewer than 15 entries: nothing to fold");
  await expect(rows).toHaveCount(14);
  await more.click();
  expect(await rows.count()).toBeGreaterThan(14);
  await expect(page.getByRole("button", { name: "Show fewer" })).toBeVisible();
});

test("workout history is grouped by week with totals, and no impossible durations", async ({ ownerPage: page }) => {
  await page.goto("/me/health/workouts");
  const weeks = page.locator(".wk-week");
  await expect(weeks.first()).toBeVisible(SLOW);
  await expect(weeks.first().locator(".wk-week-totals")).toContainText(/workouts? ·/);
  // A forgotten session must never show as days of training.
  const stats = await page.locator(".wk-row-stats").allTextContents();
  for (const text of stats) {
    const m = /(\d+) h/.exec(text);
    if (m) expect(Number(m[1])).toBeLessThanOrEqual(6);
  }
});
