import { expect, test } from "@playwright/test";

// Needs dated projects and roles; CI has no database.
test.skip(!!process.env.CI, "needs the demo dataset; run locally");

test("the career scrubber walks back through dated work and tells it in words", async ({ page }) => {
  await page.goto("/");
  const slider = page.getByLabel("career");
  await expect(slider).toBeVisible();
  const min = Number(await slider.getAttribute("min"));
  const max = Number(await slider.getAttribute("max"));
  expect(max).toBeGreaterThan(min);
  const caption = page.locator(".career-caption");
  await expect(caption).toContainText("today");

  await slider.fill(String(min));
  await expect(caption).toContainText(String(min));
  await expect(slider).toHaveAttribute("aria-valuetext", new RegExp(`^${min}: `));

  // Keyboard works the same way, and returning to the end means "today" again.
  await slider.focus();
  await page.keyboard.press("End");
  await expect(caption).toContainText("today");
});
