import { expect, test } from "@playwright/test";

// Runs in CI too: there the database is unreachable on purpose, and the trace must say so
// rather than fail.
test("a request sent through the site comes back timed, stop by stop", async ({ page }) => {
  await page.goto("/architecture");
  await page.getByRole("button", { name: "Send a request" }).click();
  const total = page.locator(".arch-total");
  await expect(total).toContainText(/Round trip \d+ ms/, { timeout: 20_000 });
  await expect(total).toContainText(/postgres \d+ ms/);
  await expect(page.locator(".arch-ms").first()).toContainText(/\d+ ms/);
});

test("each stop opens its decision and the real code behind it", async ({ page }) => {
  await page.goto("/architecture");
  const server = page.getByRole("button", { name: /Next\.js server/ });
  await server.click();
  await expect(server).toHaveAttribute("aria-expanded", "true");
  const detail = page.locator("#arch-detail");
  await expect(detail).toContainText("degrade");
  await expect(detail.locator("code")).toContainText("export async function publicRead");
  await expect(detail.locator("figcaption")).toContainText(/src\/lib\/data\/site-cache\.ts:\d+/);
  await server.click();
  await expect(detail).toBeHidden();
});

test("the trace endpoint is never cached", async ({ request }) => {
  const res = await request.get("/api/trace");
  expect(res.headers()["cache-control"]).toContain("no-store");
  const body = await res.json();
  expect(body).toMatchObject({ cache: { ok: expect.any(Boolean) }, db: { ok: expect.any(Boolean) } });
});
