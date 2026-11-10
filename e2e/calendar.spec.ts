import type { Page } from "@playwright/test";
import { expect, test } from "./support/owner";

// Drives the calendar against the live database. Every event is titled "E2E · …" and lives three
// months ahead, away from real plans; global-teardown sweeps anything a failed run leaves.
test.skip(!!process.env.CI, "touches the live database; run locally with pnpm test:e2e");
test.describe.configure({ mode: "serial", timeout: 120_000 });

const SLOW = { timeout: 30_000 };
const pad = (n: number) => String(n).padStart(2, "0");
const target = (() => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + 3, 15);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, year: d.getFullYear(), month: d.getMonth() };
})();
const tag = Date.now().toString(36);
const quickTitle = `E2E · Quick ${tag}`;
const timedTitle = `E2E · Timed ${tag}`;

async function openTargetMonth(page: Page) {
  await page.goto("/me/calendar");
  // FullCalendar loads after the page; navigation is disabled until it is ready.
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeEnabled({ timeout: 30_000 });
  await page.getByRole("button", { name: "Month", exact: true }).click();
  const title = new Date(target.year, target.month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

// Exact title match: "E2E · Quick x" must not also match its "(copy)".
const event = (page: Page, title: string) => page.locator(".fc-event").filter({ has: page.getByText(title, { exact: true }) });

test("quick add creates an event from a clicked day", async ({ ownerPage: page }) => {
  await openTargetMonth(page);
  await page.locator(`td.fc-daygrid-day[data-date="${target.date}"] .fc-daygrid-day-frame`).click();
  const pop = page.getByRole("dialog", { name: "Add event" });
  await expect(pop).toBeVisible();
  await expect(pop.getByLabel("Event title")).toBeFocused();
  await pop.getByRole("radio", { name: "Focus" }).click();
  await pop.getByLabel("Event title").fill(quickTitle);
  await pop.getByLabel("Event title").press("Enter");
  await expect(event(page, quickTitle)).toBeVisible(SLOW);
  // It lands with a one-shot highlight so the eye finds it.
  await expect(event(page, quickTitle)).toHaveClass(/is-landed/);
});

test("peek shows the event, duplicate copies it, delete offers undo", async ({ ownerPage: page }) => {
  await openTargetMonth(page);
  await event(page, quickTitle).click();
  const peek = page.getByRole("dialog", { name: quickTitle });
  await expect(peek.getByText("Focus")).toBeVisible();
  await expect(peek.getByText("All day")).toBeVisible();

  await peek.getByRole("button", { name: "Duplicate" }).click();
  const dup = page.getByRole("dialog", { name: "Duplicate event" });
  await expect(dup.getByLabel("Title")).toHaveValue(`${quickTitle} (copy)`);
  await dup.getByRole("button", { name: "Save" }).click();
  await expect(event(page, `${quickTitle} (copy)`)).toBeVisible(SLOW);

  await event(page, `${quickTitle} (copy)`).click();
  await page.getByRole("dialog", { name: `${quickTitle} (copy)` }).getByRole("button", { name: "Delete" }).click();
  await expect(event(page, `${quickTitle} (copy)`)).toHaveCount(0, SLOW);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(event(page, `${quickTitle} (copy)`)).toBeVisible(SLOW);
});

test("category filter hides and restores events", async ({ ownerPage: page }) => {
  await openTargetMonth(page);
  await expect(event(page, quickTitle)).toBeVisible(SLOW);
  const chip = page.getByRole("button", { name: "Focus", exact: true });
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await expect(event(page, quickTitle)).toHaveCount(0);
  await chip.click();
  await expect(event(page, quickTitle)).toBeVisible();
});

test("overlapping times are flagged before saving", async ({ ownerPage: page }) => {
  await openTargetMonth(page);
  const at = (h: number) => `${target.date}T${pad(h)}:00`;

  await page.keyboard.press("n");
  let dialog = page.getByRole("dialog", { name: "New event" });
  await dialog.getByLabel("Title").fill(timedTitle);
  await dialog.getByLabel("Starts").fill(at(9));
  await dialog.getByLabel("Ends").fill(at(10));
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(event(page, timedTitle)).toBeVisible(SLOW);

  await page.keyboard.press("n");
  dialog = page.getByRole("dialog", { name: "New event" });
  await dialog.getByLabel("Starts").fill(at(9));
  await dialog.getByLabel("Ends").fill(`${target.date}T09:30`);
  await expect(dialog.getByRole("status")).toContainText(timedTitle, SLOW);
  await dialog.getByRole("button", { name: "Cancel" }).click();
});

test("keyboard shortcuts switch views and list themselves", async ({ ownerPage: page }) => {
  await page.goto("/me/calendar");
  await page.keyboard.press("w");
  await expect(page.getByRole("button", { name: "Week", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("?");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toHaveCount(0);
  await page.keyboard.press("m");
  await expect(page.getByRole("button", { name: "Month", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("dragging an event to another day can be undone", async ({ ownerPage: page }) => {
  await openTargetMonth(page);
  const [y, m] = target.date.split("-");
  const from = `${y}-${m}-10`;
  const to = `${y}-${m}-11`;
  const title = `E2E · Move ${tag}`;
  await page.locator(`td.fc-daygrid-day[data-date="${from}"] .fc-daygrid-day-frame`).click();
  await page.getByLabel("Event title").fill(title);
  await page.getByLabel("Event title").press("Enter");
  await expect(event(page, title)).toBeVisible(SLOW);

  await event(page, title).dragTo(page.locator(`td.fc-daygrid-day[data-date="${to}"] .fc-daygrid-day-frame`));
  await expect(page.locator(`td.fc-daygrid-day[data-date="${to}"]`).getByText(title, { exact: true })).toBeVisible(SLOW);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(`td.fc-daygrid-day[data-date="${from}"]`).getByText(title, { exact: true })).toBeVisible(SLOW);
});

test("a running event shows as happening now with its progress", async ({ ownerPage: page }) => {
  const local = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const now = new Date();
  const title = `E2E · Now ${tag}`;
  await page.goto("/me/calendar");
  await page.keyboard.press("n");
  const dialog = page.getByRole("dialog", { name: "New event" });
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByLabel("Starts").fill(local(new Date(now.getTime() - 30 * 60_000)));
  await dialog.getByLabel("Ends").fill(local(new Date(now.getTime() + 30 * 60_000)));
  await dialog.getByRole("button", { name: "Save" }).click();

  const agenda = page.getByRole("complementary", { name: "Agenda" });
  await expect(agenda.getByText("Happening now")).toBeVisible(SLOW);
  await expect(agenda.getByRole("progressbar", { name: "Time elapsed" })).toBeVisible();
});
