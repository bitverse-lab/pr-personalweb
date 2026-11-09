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

for (const route of ["/", "/projects"]) {
  test(`${route} hydrates without server/client markup errors`, async ({ page }) => {
    const hydrationMessages: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (/hydration|server html/i.test(message.text())) hydrationMessages.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(route, { waitUntil: "load" });
    expect(hydrationMessages).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
}
