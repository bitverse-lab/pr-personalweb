import { expect, test } from "@playwright/test";

// Regressions found by inspecting the public site at phone width (390 px) and on desktop.

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the header stays one row high", async ({ page }) => {
    await page.goto("/cv");
    const header = await page.locator("#topnav").boundingBox();
    // one row is ~80 px; the wrapped CV button made it 148
    expect(header!.height).toBeLessThanOrEqual(96);
  });

  for (const path of ["/cv", "/privacy", "/login", "/about"]) {
    test(`the page heading on ${path} is not hidden under the fixed header`, async ({ page }) => {
      await page.goto(path);
      const covered = await page.evaluate(() => {
        const h1 = document.querySelector("h1")!;
        const r = h1.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + 4, r.top + 4);
        return !!hit && !!document.getElementById("topnav")?.contains(hit);
      });
      expect(covered).toBe(false);
    });
  }

  test("the CV download is still reachable from the menu", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.locator("#navigation").getByRole("link", { name: /download cv/i })).toBeVisible();
  });

  test("Escape closes the menu and returns focus to the toggle", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    await expect(page.locator("#navigation")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#navigation")).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
  });
});

test("navigation uses Work and Writing labels", async ({ page }) => {
  // needs published projects and articles (pnpm db:seed) so both items are shown
  await page.goto("/");
  const nav = page.locator("#navigation");
  await expect(nav.getByRole("link", { name: "Work", exact: true })).toHaveAttribute("href", "/projects");
  await expect(nav.getByRole("link", { name: "Writing", exact: true })).toHaveAttribute("href", "/articles");
  await expect(nav.getByRole("link", { name: "Projects", exact: true })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Articles", exact: true })).toHaveCount(0);
});

test("page titles name the site once", async ({ page }) => {
  for (const path of ["/about", "/cv", "/projects", "/contact", "/login", "/this-page-does-not-exist"]) {
    await page.goto(path);
    const title = await page.title();
    const parts = title.split(" | ");
    expect(new Set(parts).size, `${path}: "${title}"`).toBe(parts.length);
    expect(title.split("Verindra Hernanda Putra").length - 1, `${path}: "${title}"`).toBe(1);
  }
  await page.goto("/login");
  expect(await page.title()).toMatch(/^Sign in \| /);
  await page.goto("/this-page-does-not-exist");
  expect(await page.title()).toMatch(/^Page not found \| /);
});

test("a portrait that fails to load shows initials, not a broken image", async ({ page }) => {
  await page.route(/\/storage\/v1\/object\/public\//, (route) => route.abort());
  await page.goto("/", { waitUntil: "load" });
  await page.waitForTimeout(500);
  const broken = await page.evaluate(() => Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 0 && getComputedStyle(i).display !== "none").map((i) => i.alt));
  expect(broken).toEqual([]);
  await expect(page.getByRole("img", { name: /^Portrait of / }).first()).toBeVisible();
});

test("no page requests the template's stock photos as covers", async ({ page }) => {
  // the seed has an archived/draft project and a draft article without covers, and published ones with covers
  const stock: string[] = [];
  page.on("request", (r) => { if (/\/images\/(blog|portfolio)\//.test(r.url())) stock.push(r.url()); });
  for (const path of ["/", "/projects", "/articles"]) await page.goto(path, { waitUntil: "load" });
  expect(stock).toEqual([]);
});

test("the projects hero does not use the template's stock photo", async ({ page }) => {
  await page.goto("/projects");
  const bg = await page.locator("section#hero").evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).not.toContain("bg01.jpg");
});
