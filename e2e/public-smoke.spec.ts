import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/about", "/cv", "/projects", "/articles", "/contact", "/privacy", "/login"];

for (const route of publicRoutes) {
  test(`public page ${route} renders`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await expect(page.locator("main#main-content")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });
}

test("private workspace redirects signed-out visitors to login", async ({ page }) => {
  await page.goto("/me");

  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("public scroll reveal animates sections as they enter the viewport", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/projects", { waitUntil: "domcontentloaded" });

  const contactSection = page.locator("#contact");
  await expect(page.locator("html")).toHaveClass(/has-scroll-reveal/);
  await expect(contactSection).not.toHaveClass(/is-visible/);

  await contactSection.scrollIntoViewIfNeeded();
  await expect(contactSection).toHaveClass(/is-visible/);
  await expect(contactSection).toHaveCSS("transform", "none");
});

test("public scroll reveal stays visible when reduced motion is preferred", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#portfolio")).toHaveCSS("opacity", "1");
  await expect(page.locator("#portfolio")).toHaveCSS("transform", "none");
  await expect(page.locator("html")).not.toHaveClass(/has-scroll-reveal/);
});

test("projects masonry hydrates without server/client markup errors", async ({ page }) => {
  const hydrationMessages: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (/hydration|server html/i.test(message.text())) hydrationMessages.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/projects", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#grid .projects-grid-fallback")).toHaveCount(0);

  expect(hydrationMessages).toEqual([]);
  expect(pageErrors).toEqual([]);
});
