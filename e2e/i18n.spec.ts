import { expect, test } from "@playwright/test";

test("the Indonesian pages say so, and link within Indonesian", async ({ page }) => {
  await page.goto("/id/projects");
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Kontak" })).toHaveAttribute("href", "/id/contact");
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", /\/projects$/);
  await expect(page.locator('link[rel="alternate"][hreflang="id"]')).toHaveAttribute("href", /\/id\/projects$/);
});

test("the language switch keeps the page and goes both ways", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: /^ID: / }).click();
  await expect(page).toHaveURL(/\/id\/contact$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Merekrut");
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await page.getByRole("link", { name: /^EN: / }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("a page with no Indonesian version switches to the Indonesian home", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("link", { name: /^ID: / })).toHaveAttribute("href", "/id");
});

test("the contact form speaks Indonesian on /id", async ({ page }) => {
  await page.goto("/id/contact");
  await expect(page.getByLabel(/Nama Anda/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Kirim pesan" })).toBeVisible();
});

for (const width of [992, 1280]) {
  for (const path of ["/", "/id"]) {
    test(`the desktop header stays one row at ${width}px on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      const tops = await page.evaluate(() =>
        Array.from(document.querySelectorAll("#navmenu-nav > li")).filter((li) => (li as HTMLElement).offsetParent).map((li) => Math.round(li.getBoundingClientRect().top)),
      );
      expect(new Set(tops).size).toBe(1);
    });
  }
}
