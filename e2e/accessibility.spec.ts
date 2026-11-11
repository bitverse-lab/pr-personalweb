import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/about", "/cv", "/projects", "/articles", "/contact", "/match", "/proof", "/architecture", "/privacy", "/offline", "/login", "/for/data-engineer", "/id", "/id/about", "/id/cv", "/id/projects", "/id/articles", "/id/contact"];

// Both themes: the dark one follows the system setting, which is how most visitors get it.
for (const colorScheme of ["light", "dark"] as const)
for (const route of routes) {
  test(`${route} (${colorScheme}) has no automatically detectable WCAG 2.1 A/AA violations`, async ({ page }) => {
    // Contrast is judged at rest. With reduced motion the home console shows its result at once and
    // nothing fades in, so axe never samples a row mid-animation (timing-based waits stayed flaky).
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme });
    await page.goto(route, { waitUntil: "domcontentloaded" });
    if ((await page.getByTestId("console-footer").count()) > 0) {
      await expect(page.getByTestId("console-footer")).toContainText(/row/, { timeout: 15_000 });
    }
    // Scroll-driven animations follow the scroll position and never finish; only time-based ones are waited for.
    await page.waitForFunction(
      () => document.getAnimations().every((a) => a.timeline !== document.timeline || a.playState !== "running" || a.effect?.getTiming().iterations === Infinity),
      null,
      { timeout: 10_000 },
    );

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
