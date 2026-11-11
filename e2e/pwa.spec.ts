import { expect, test } from "@playwright/test";

// The service worker registers in production builds only, so this runs against `next start`:
//   pnpm build && pnpm exec next start -p 3002
//   PLAYWRIGHT_BASE_URL=http://localhost:3002 pnpm exec playwright test e2e/pwa.spec.ts
test.skip(!process.env.PLAYWRIGHT_BASE_URL, "needs a production server (see the comment above)");

test("installable, reads saved pages offline, never stores private routes", async ({ page, context }) => {
  const manifest = await (await page.request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ display: "standalone", start_url: "/" });
  for (const icon of manifest.icons) expect((await page.request.get(icon.src)).ok()).toBe(true);

  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  // The first load happened before the worker took control; this one is saved.
  await page.goto("/privacy");
  await page.goto("/login");

  await context.setOffline(true);
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();

  await page.goto("/cv?never-saved");
  await expect(page.getByRole("heading", { level: 1, name: "You are offline" })).toBeVisible();
  await expect(page.locator(".saved-pages").getByRole("link", { name: "Privacy" })).toBeVisible();

  const stored = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) for (const r of await (await caches.open(name)).keys()) urls.push(new URL(r.url).pathname);
    return urls;
  });
  expect(stored).toContain("/privacy");
  expect(stored.filter((p) => /^\/(me|login|api)(\/|$)/.test(p))).toEqual([]);
  await context.setOffline(false);
});
