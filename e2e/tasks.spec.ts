import type { Page } from "@playwright/test";
import { expect, test } from "./support/owner";

// Drives Tasks against the live database. Every task is titled "E2E · …";
// global-teardown sweeps anything a failed run leaves.
test.skip(!!process.env.CI, "touches the live database; run locally with pnpm test:e2e");
test.describe.configure({ mode: "serial", timeout: 120_000 });

const SLOW = { timeout: 30_000 };
const tag = Date.now().toString(36);
const title = `E2E · Call ${tag}`;

const row = (page: Page, name: string) => page.locator(".task-row").filter({ has: page.getByText(name, { exact: true }) });

test("smart capture reads date, tag and priority from one line", async ({ ownerPage: page }) => {
  await page.goto("/me/tasks");
  const input = page.getByLabel("New task");
  await input.fill(`${title} tomorrow #e2e !high`);
  const chips = page.locator(".task-chips");
  await expect(chips.getByRole("button", { name: /Tomorrow/ })).toBeVisible();
  await expect(chips.getByRole("button", { name: /high/ })).toBeVisible();
  await input.press("Enter");

  const tomorrow = page.locator("#group-tomorrow");
  await expect(row(page, title)).toBeVisible(SLOW);
  await expect(tomorrow.getByText(title, { exact: true })).toBeVisible();
  await expect(row(page, title).getByText("High")).toBeVisible();
  await expect(row(page, title).getByRole("link", { name: "#e2e" })).toBeVisible();
});

test("a rejected reading goes back into the title", async ({ ownerPage: page }) => {
  await page.goto("/me/tasks");
  const input = page.getByLabel("New task");
  await input.fill(`E2E · Next ${tag} friday #e2e`);
  await page.locator(".task-chips").getByRole("button", { name: /Fri/ }).click();
  await input.press("Enter");
  await expect(row(page, `E2E · Next ${tag} friday`)).toBeVisible(SLOW);
});

test("the due date reschedules from the row, with undo", async ({ ownerPage: page }) => {
  await page.goto("/me/tasks");
  await row(page, title).getByRole("button", { name: /Change due date/ }).click();
  await page.getByRole("menuitem", { name: /^Today/ }).click();
  await expect(page.locator("#group-today").getByText(title, { exact: true })).toBeVisible(SLOW);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator("#group-tomorrow").getByText(title, { exact: true })).toBeVisible(SLOW);
});

test("completing a task can be undone", async ({ ownerPage: page }) => {
  await page.goto("/me/tasks");
  await row(page, title).getByRole("checkbox").check();
  await expect(row(page, title)).toHaveClass(/is-done/);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(row(page, title).getByRole("checkbox")).not.toBeChecked(SLOW);
  await expect(page.locator("#group-tomorrow").getByText(title, { exact: true })).toBeVisible(SLOW);
});

test("editing can clear the due date and priority", async ({ ownerPage: page }) => {
  await page.goto("/me/tasks");
  const r = row(page, title);
  await r.hover();
  await r.getByRole("button", { name: /edit/i }).click();
  const dialog = page.getByRole("dialog", { name: "Edit task" });
  await dialog.getByLabel("Due date").fill("");
  await dialog.getByLabel("Priority").selectOption("");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("#group-nodate").getByText(title, { exact: true })).toBeVisible(SLOW);
  await expect(row(page, title).getByText("High")).toHaveCount(0);
});

test("board: drag a card to In progress, then undo", async ({ ownerPage: page }) => {
  // Filtered to this run's task, so a drag can only ever touch test data (never a real task),
  // and the card sits at the top with no scrolling (smooth scroll would skew the coordinates).
  await page.goto(`/me/tasks?view=board&q=${encodeURIComponent(title)}`);
  const card = page.locator(".task-card").filter({ has: page.getByText(title, { exact: true }) });
  await expect(page.locator(".task-col--todo").getByText(title, { exact: true })).toBeVisible(SLOW);

  await expect(page.locator(".task-card")).toHaveCount(1);
  const from = (await card.locator(".task-card-grip").boundingBox())!;
  const to = (await page.locator(".task-col--in_progress").boundingBox())!;
  await page.mouse.move(from.x + 20, from.y + 10);
  await page.mouse.down();
  await page.mouse.move(from.x + 40, from.y + 20, { steps: 4 });
  // Same height as the card: the in-progress column is on screen there too.
  await page.mouse.move(to.x + to.width / 2, from.y + 10, { steps: 12 });
  await page.mouse.up();

  await expect(page.locator(".task-col--in_progress").getByText(title, { exact: true })).toBeVisible(SLOW);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".task-col--todo").getByText(title, { exact: true })).toBeVisible(SLOW);
  // The board updates before the server does; reload to prove the undo was actually saved.
  await expect(async () => {
    await page.reload();
    await expect(page.locator(".task-col--todo").getByText(title, { exact: true })).toBeVisible({ timeout: 5_000 });
  }).toPass(SLOW);
});

test("a repeating task comes back on its next day when ticked off, and Undo takes that back", async ({ ownerPage: page }) => {
  const habit = `E2E · Stretch ${tag}`;
  await page.goto("/me/tasks");
  const input = page.getByLabel("New task");
  await input.fill(`${habit} daily`);
  await expect(page.locator(".task-chips").getByRole("button", { name: /Every day/ })).toBeVisible();
  await input.press("Enter");
  const today = page.locator("#group-today");
  await expect(today.locator(".task-row").filter({ hasText: habit }).getByText("Every day")).toBeVisible(SLOW);

  await row(page, habit).first().getByRole("checkbox").check();
  const toast = page.getByText(/Done\. Next one on/);
  await expect(toast).toBeVisible(SLOW);
  await page.reload();
  await expect(page.locator("#group-tomorrow").getByText(habit, { exact: true })).toBeVisible(SLOW);
  // Done folds away by default.
  await page.locator("#group-done .task-group-fold").click();
  await expect(page.locator("#group-done").getByText(habit, { exact: true })).toBeVisible();

  // Un-ticking the finished one removes the occurrence it created.
  await page.locator("#group-done .task-row").filter({ hasText: habit }).getByRole("checkbox").uncheck();
  await page.waitForTimeout(1500);
  await page.reload();
  await expect(page.locator("#group-tomorrow").getByText(habit, { exact: true })).toHaveCount(0, SLOW);
  await expect(page.locator("#group-today").getByText(habit, { exact: true })).toBeVisible();
});
