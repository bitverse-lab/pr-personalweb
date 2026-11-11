import { expect, test } from "@playwright/test";

test("an unknown role is a 404, not a page with a made-up title", async ({ page }) => {
  const response = await page.goto("/for/astronaut");
  expect(response?.status()).toBe(404);
});

test.describe("with public data", () => {
  // Needs projects with technologies; CI has no database.
  test.skip(!!process.env.CI, "needs the demo dataset; run locally");

  test("the data engineer link leads with data work and says how it was arranged", async ({ page }) => {
    await page.goto("/for/data-engineer");
    await expect(page.getByTestId("role-note")).toContainText("Data Engineer");
    await expect(page.locator("[data-case]").first()).toHaveAttribute("data-layers", /\bdata\b/);
    await expect(page.locator(".section-query-sql").first()).toContainText("role_fit");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https?:\/\/[^/]+\/?$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("the general page is unchanged", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("role-note")).toHaveCount(0);
  });
});
