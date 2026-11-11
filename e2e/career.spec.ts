import { expect, test } from "./support/owner";

// Drives Career against the live database. The company and role are both "E2E · …";
// global-teardown deletes them (applications cascade with the company).
test.skip(!!process.env.CI, "touches the live database; run locally with pnpm test:e2e");
test.describe.configure({ mode: "serial", timeout: 120_000 });

const SLOW = { timeout: 30_000 };
const tag = Date.now().toString(36);
const company = `E2E · Co ${tag}`;
const role = `E2E · Engineer ${tag}`;

test.use({ viewport: { width: 1440, height: 1400 } });

test("a new application lands in Wishlist", async ({ ownerPage: page }) => {
  await page.goto("/me/career");
  await page.getByRole("button", { name: /New application/ }).click();
  const dialog = page.getByRole("dialog", { name: "New application" });
  await dialog.getByLabel("Company").fill(company);
  await dialog.getByLabel("Role").fill(role);
  await dialog.getByRole("button", { name: /Save|Add|Create/ }).click();
  // Saving opens the new application.
  await page.waitForURL(/\/me\/career\/applications\/[0-9a-f-]{36}$/, SLOW);
  await expect(page.locator(".stepper-step.is-current")).toContainText("Wishlist");

  await page.goto("/me/career");
  await expect(page.locator(".pl-col").first().getByText(role, { exact: true })).toBeVisible(SLOW);
  await expect(page.locator(".pl-card", { hasText: role }).getByText("New today")).toBeVisible();
});

test("detail: move to the next stage with one click, then undo", async ({ ownerPage: page }) => {
  await page.goto("/me/career");
  await page.getByRole("link", { name: role, exact: true }).click();
  await expect(page.locator(".stepper")).toBeVisible(SLOW);
  await expect(page.locator(".stepper-step.is-current")).toContainText("Wishlist");

  await page.getByRole("button", { name: "Move to Applied" }).click();
  await expect(page.locator(".stepper-step.is-current")).toContainText("Applied", SLOW);
  await expect(page.getByRole("button", { name: "Move to Screening" })).toBeVisible();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".stepper-step.is-current")).toContainText("Wishlist", SLOW);
});

test("board: drag to Applied, then undo", async ({ ownerPage: page }) => {
  await page.goto("/me/career");
  const card = page.locator(".pl-card", { hasText: role });
  await expect(card).toBeVisible(SLOW);
  const from = (await card.boundingBox())!;
  const to = (await page.locator(".pl-col").nth(1).boundingBox())!;

  await page.mouse.move(from.x + 30, from.y + 60);
  await page.mouse.down();
  await page.mouse.move(from.x + 50, from.y + 70, { steps: 4 });
  // Guard: only drop if the lifted card is ours; otherwise cancel, so real data is never moved.
  const lifted = page.locator(".pl-card.is-lifted");
  if (!(await lifted.textContent())?.includes(role)) {
    await page.keyboard.press("Escape");
    await page.mouse.up();
    throw new Error("Grabbed the wrong card; drag cancelled.");
  }
  await page.mouse.move(to.x + to.width / 2, to.y + 120, { steps: 12 });
  await page.mouse.up();

  await expect(page.locator(".pl-col").nth(1).getByText(role, { exact: true })).toBeVisible(SLOW);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".pl-col").first().getByText(role, { exact: true })).toBeVisible(SLOW);
  // The board updates before the server does; reload to prove the undo was actually saved.
  await expect(async () => {
    await page.reload();
    await expect(page.locator(".pl-col").first().getByText(role, { exact: true })).toBeVisible({ timeout: 5_000 });
  }).toPass(SLOW);
});

test("applications list filters by stage chip", async ({ ownerPage: page }) => {
  await page.goto("/me/career/applications");
  await page.getByRole("link", { name: /^Wishlist/ }).click();
  await expect(page).toHaveURL(/status=wishlist/, SLOW);
  await expect(page.getByText(role, { exact: true })).toBeVisible(SLOW);
  await page.getByRole("link", { name: /^Offer/ }).click();
  await expect(page.getByText(role, { exact: true })).toHaveCount(0);
});
