import type { Page } from "@playwright/test";
import { expect, test } from "./support/owner";

// Indonesian content written in /me reaches /id, and the English pages keep the English. Runs
// against the live database like admin-public-sync.spec.ts: "E2E · " rows, deleted afterwards.
test.skip(!!process.env.CI, "touches the live database; run locally with pnpm test:e2e");
test.describe.configure({ mode: "serial", timeout: 150_000 });

const SLOW = { timeout: 30_000 };
const tag = () => Date.now().toString(36);
const confirmDelete = (page: Page, title: RegExp) => page.getByRole("alertdialog", { name: title }).getByRole("button", { name: "Delete" }).click();

test("an experience's Indonesian role shows on /id/cv and not on /cv", async ({ ownerPage: page }) => {
  const company = `E2E · Acme ${tag()}`;
  const role = `E2E Engineer ${tag()}`;
  const peran = `E2E Insinyur ${tag()}`;
  const openTab = async () => {
    await page.goto("/me/settings/profile");
    await page.getByRole("tab", { name: /^Experience/ }).click();
    return page.getByRole("tabpanel").filter({ hasText: "Work experience" });
  };
  await (await openTab()).getByRole("button", { name: "Add", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add experience" });
  await dialog.locator("#x-company").fill(company);
  await dialog.locator("#x-role").fill(role);
  await dialog.locator("#x-start").fill("2024-01");
  await dialog.locator("#x-current").check();
  await dialog.getByRole("button", { name: /Bahasa Indonesia/ }).click();
  await dialog.locator("#x-role-id").fill(peran);
  await expect(dialog.getByRole("button", { name: /Bahasa Indonesia 1\/3/ })).toBeVisible();
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toHaveCount(0, SLOW);
  try {
    await page.goto("/id/cv");
    await expect(page.getByText(peran)).toBeVisible();
    await expect(page.getByText(company).first()).toBeVisible(); // company names are not translated
    await page.goto("/cv");
    await expect(page.getByText(role)).toBeVisible();
    await expect(page.getByText(peran)).toHaveCount(0);
  } finally {
    await (await openTab()).getByRole("button", { name: `Delete ${role}` }).click();
    await confirmDelete(page, /Delete experience\?/);
    await expect(page.getByText(role)).toHaveCount(0, SLOW);
  }
});

test("a project's Indonesian title and summary show on /id, with English as the fallback", async ({ ownerPage: page }) => {
  const title = `E2E · Bilingual ${tag()}`;
  const judul = `E2E · Dwibahasa ${tag()}`;
  await page.goto("/me/projects");
  await page.getByRole("button", { name: /new project/i }).click();
  await page.waitForURL(/\/me\/projects\/[0-9a-f-]{36}$/);
  const editorUrl = page.url();
  await page.getByLabel("Project title").fill(title);
  await page.locator("#p-summary").fill("An English summary.");
  await page.getByRole("textbox", { name: "Editor" }).fill("The English case study.");
  await page.getByRole("button", { name: /Bahasa Indonesia/ }).click();
  await page.getByLabel("Title in Indonesian").fill(judul);
  await page.locator("#p-summary-id").fill("Ringkasan berbahasa Indonesia.");
  await page.getByRole("button", { name: /^Publish$/ }).click();
  await expect(page.getByRole("link", { name: "View on site" })).toBeVisible(SLOW);
  const slug = (await page.getByRole("link", { name: "View on site" }).getAttribute("href"))!.split("/").pop()!;
  try {
    await page.goto(`/id/projects/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(judul);
    await expect(page.getByText("Ringkasan berbahasa Indonesia.")).toBeVisible();
    // no Indonesian case study was written, so the English one is shown
    await expect(page.getByText("The English case study.")).toBeVisible();
    await page.goto(`/projects/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await page.goto("/me/projects");
    await expect(page.getByRole("row", { name: new RegExp(title) }).or(page.locator("li", { hasText: title })).getByText("ID 2/3").first()).toBeVisible();
  } finally {
    await page.goto(editorUrl);
    await page.getByRole("button", { name: /^Delete$/ }).click();
    await confirmDelete(page, /Delete project\?/);
    await page.waitForURL(/\/me\/projects$/, SLOW);
  }
});
