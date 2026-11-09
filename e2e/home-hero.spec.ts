import { expect, test } from "@playwright/test";

// Hero C v3 (docs/superpowers/specs/assets/2026-11-09-public-redesign/hero-c-v3-prototype.html).
// Needs the demo dataset: pnpm db:seed --yes
const SLOW = { timeout: 15_000 };

test.describe("home hero console", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("runs the profile query against the site's own tables and reports real rows and time", async ({ page }) => {
    const tabs = page.getByRole("tablist", { name: "Queries" });
    for (const name of ["profile.sql", "stack.sql", "projects.sql"]) await expect(tabs.getByRole("tab", { name })).toBeVisible();
    await expect(tabs.getByRole("tab", { name: "profile.sql" })).toHaveAttribute("aria-selected", "true");
    const footer = page.getByTestId("console-footer");
    await expect(footer).toContainText(/\d+ rows?/, SLOW);
    await expect(footer).toContainText(/\d+ ms · (just now|\d+ min ago)/);
    await expect(page.getByTestId("console-rows").getByText("3.92 /4.00")).toBeVisible();
  });

  test("switching tabs replaces the rows and moves the selection", async ({ page }) => {
    await page.getByRole("tab", { name: "stack.sql" }).click();
    await expect(page.getByRole("tab", { name: "stack.sql" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("console-rows").getByText("PostgreSQL", { exact: true })).toBeVisible(SLOW);
  });

  test("plain language hides the SQL and the key column", async ({ page }) => {
    const sw = page.getByRole("switch", { name: "Show in plain language" });
    await sw.click();
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("console-query")).not.toContainText("SELECT", SLOW);
    await expect(page.getByTestId("console-rows").locator("[data-col=key]").first()).toBeHidden();
  });

  test("pointing at a layer lights the projects that use it", async ({ page }) => {
    await page.getByRole("tab", { name: "stack.sql" }).click();
    const row = page.getByTestId("console-rows").locator("[data-layer=ml]");
    await row.hover();
    const work = page.locator("#work");
    await expect(work).toContainText("WHERE layer = 'ml'", SLOW);
    await expect(work.locator("[data-case].lit").first()).toBeVisible();
    await expect(work.locator("[data-case].dim")).not.toHaveCount(0);
  });

  test("choosing a project row brings its case study into view and focus", async ({ page }) => {
    await page.getByRole("tab", { name: "projects.sql" }).click();
    const row = page.getByTestId("console-rows").getByRole("button").first();
    const slug = await row.getAttribute("data-slug");
    await row.click();
    const card = page.locator(`#case-${slug}`);
    await expect(card).toBeInViewport(SLOW);
    await expect(card.getByRole("heading")).toBeFocused();
  });

  test("the template's typing animation, skill bars and portrait are gone", async ({ page }) => {
    await expect(page.locator(".home-portrait-frame, .progress, .typewrite, [class*=TypeAnimation]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Verindra");
  });
});

test.describe("on a phone with reduced motion", () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

  test("the console is flat, nothing overflows, and every row is visible at once", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const console = page.getByTestId("console");
    await expect(console).toHaveCSS("transform", "none");
    const rows = page.getByTestId("console-rows").locator("[data-row]");
    await expect(rows.first()).toBeVisible({ timeout: 1_000 });
    await expect(rows.last()).toBeVisible({ timeout: 1_000 });
  });
});
