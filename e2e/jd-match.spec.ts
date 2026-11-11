import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// /match: a pasted job description answered with evidence from the public data. Needs that data,
// so it runs locally (CI has no database). The opt-in model download is not exercised here.
test.skip(!!process.env.CI, "needs public data; run locally with pnpm test:e2e");

test("a job description is answered requirement by requirement, gaps included, without sending it", async ({ page }) => {
  const sent: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET" || (r.postData() ?? "").includes("PostgreSQL")) sent.push(r.url());
  });
  await page.goto("/match");
  await page.getByRole("button", { name: "Try a sample" }).click();
  const results = page.getByRole("region", { name: /requirements have evidence/ }).or(page.locator(".jd-results"));
  await expect(page.getByRole("heading", { name: /of \d+ requirements have evidence/ })).toBeVisible({ timeout: 30_000 });

  const sql = page.locator(".jd-req").filter({ hasText: "PostgreSQL" });
  await expect(sql.locator(".jd-ev-link").first()).toBeVisible();
  // Kubernetes is not on the site: an honest gap, not a stretched match.
  await expect(page.locator(".jd-req.is-gap").filter({ hasText: "Kubernetes" })).toBeVisible();
  // Benefits are not requirements.
  await expect(results.getByText(/health insurance/)).toHaveCount(0);

  const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(a11y.violations.map((v) => v.id)).toEqual([]);
  expect(sent).toEqual([]);
});
