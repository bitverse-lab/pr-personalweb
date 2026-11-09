import { expect, test } from "@playwright/test";

// Projects as case studies by layer. Needs the demo dataset: pnpm db:seed --yes

test("the featured case study is larger than the others", async ({ page }) => {
  await page.goto("/projects");
  const featured = await page.locator("[data-case].case--featured").boundingBox();
  const other = await page.locator("[data-case]:not(.case--featured)").first().boundingBox();
  expect(featured!.width).toBeGreaterThan(other!.width);
});

test("layer chips filter the work, and 'all' brings every project back", async ({ page }) => {
  await page.goto("/projects");
  const cases = page.locator("[data-case]");
  const total = await cases.count();
  await page.getByRole("button", { name: "ml", exact: true }).click();
  await expect(page.getByRole("button", { name: "ml", exact: true })).toHaveAttribute("aria-pressed", "true");
  const visible = page.locator("[data-case]:visible");
  await expect(visible).not.toHaveCount(total);
  for (const layers of await visible.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.layers ?? ""))) {
    expect(layers.split(" ")).toContain("ml");
  }
  await page.getByRole("button", { name: "all", exact: true }).click();
  await expect(page.locator("[data-case]:visible")).toHaveCount(total);
});

test("the header states real counts under the title", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Things I shipped, by the layers I built.");
  await expect(page.getByTestId("work-meta")).toHaveText(/^~\/work · \d+ projects? · \d+ layers?$/);
});

test("a project page leads with its outcome and layers", async ({ page }) => {
  await page.goto("/projects/rice-yield-forecasting");
  await expect(page.getByTestId("project-outcome")).toHaveText("7% median error · 40 cooperatives");
  await expect(page.getByTestId("project-layers").getByText("ml", { exact: true })).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const path of ["/projects", "/projects/rice-yield-forecasting"]) {
    test(`${path} does not overflow horizontally`, async ({ page }) => {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });
  }
});
