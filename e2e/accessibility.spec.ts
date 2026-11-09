import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/about", "/cv", "/projects", "/articles", "/contact", "/privacy", "/login"];

for (const route of routes) {
  test(`${route} has no automatically detectable WCAG 2.1 A/AA violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations.map(({ id, impact, help, nodes }) => ({
        id,
        impact,
        help,
        elements: nodes.map(({ target, failureSummary, html }) => ({ target, failureSummary, html })),
      })),
    ).toEqual([]);
  });
}
