import { expect, test } from "@playwright/test";
import { needsSeed } from "./support/seed";

// About, CV and Contact in the shared language. Needs the demo dataset: pnpm db:seed --yes

test("/about leads with what the owner does now, and rates no skill with a bar", async ({ page }) => {
  needsSeed();
  await page.goto("/about");
  await expect(page.locator("[data-now]")).toContainText("Nusantara Data Labs");
  await expect(page.locator(".progress")).toHaveCount(0);
});

test("/cv prints as a sheet, without the site navigation", async ({ page }) => {
  await page.goto("/cv");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#topnav")).toBeHidden();
});

test("/cv shows the highlights as proof", async ({ page }) => {
  needsSeed();
  await page.goto("/cv");
  await expect(page.locator("[data-proof]")).toContainText("3.92 /4.00");
});

test("/contact shows the owner's status, and the form still refuses an empty message", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByTestId("contact-status")).toBeVisible();
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.locator(".invalid-feedback, [role=alert]").first()).toBeVisible();
});
