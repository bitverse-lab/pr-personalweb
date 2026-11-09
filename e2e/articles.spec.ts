import { expect, test } from "@playwright/test";

// Articles option B + reading layout. Needs the demo dataset: pnpm db:seed --yes
// Newest published demo article: "Serving a PyTorch model behind Next.js without a GPU".

test("the newest article leads, large, with an 'Earlier' list beside it", async ({ page }) => {
  await page.goto("/articles");
  const latest = page.locator("[data-latest]");
  await expect(latest).toHaveCount(1);
  await expect(latest).toContainText("Serving a PyTorch model behind Next.js without a GPU");
  await expect(latest).toContainText(/Latest · .+ · \d+ min/);
  await expect(page.getByRole("heading", { name: "Earlier" })).toBeVisible();
});

test("a cover that cannot be shown becomes the title set in type, never a stock photo", async ({ page }) => {
  // every published demo article has a cover, so make the cover fail to load
  await page.route(/\/storage\/v1\/object\/public\//, (route) => route.abort());
  await page.goto("/articles", { waitUntil: "load" });
  await expect(page.locator("[data-latest] .cover-block--type")).toBeVisible();
  await expect(page.locator('img[src*="/images/"]')).toHaveCount(0);
});

test("the article contents follow the reader", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/articles/laravel-queue-dropping-jobs");
  const toc = page.getByRole("navigation", { name: "On this page" });
  await expect(toc).toBeVisible();
  const second = page.locator("article h2").nth(1);
  await second.scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 120);
  const name = (await second.textContent())!.trim();
  await expect(toc.getByRole("link", { name })).toHaveAttribute("aria-current", "true", { timeout: 5_000 });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const path of ["/articles", "/articles/laravel-queue-dropping-jobs"]) {
    test(`${path} does not overflow horizontally`, async ({ page }) => {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });
  }
});
