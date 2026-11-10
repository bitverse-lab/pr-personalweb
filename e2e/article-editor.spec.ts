import type { Page } from "@playwright/test";
import { expect, test } from "./support/owner";

// The article editor's saving rules. Writes "E2E · " drafts and deletes them; global-teardown
// sweeps anything a crashed test left behind.
test.skip(!!process.env.CI, "touches the live database; run locally with pnpm test:e2e");
test.describe.configure({ timeout: 120_000 });

const SLOW = { timeout: 30_000 };
const tag = () => Date.now().toString(36);

async function newDraft(page: Page, title: string) {
  await page.goto("/me/articles");
  await page.getByRole("button", { name: /new article/i }).click();
  await page.waitForURL(/\/me\/articles\/[0-9a-f-]{36}$/);
  await page.getByLabel("Article title").fill(title);
  return page.url();
}

const saved = (page: Page) => expect(page.getByRole("status").filter({ hasText: /(^|\s)Saved\b/})).toBeVisible(SLOW);

async function remove(page: Page, url: string) {
  await page.goto(url);
  await page.getByRole("button", { name: /^Delete$/ }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await page.waitForURL(/\/me\/articles$/, SLOW);
}

test("going to Preview and back keeps the writing, and later edits build on it", async ({ ownerPage: page }) => {
  const url = await newDraft(page, `E2E · Preview ${tag()}`);
  try {
    const editor = page.getByRole("textbox", { name: "Editor" });
    await editor.fill("First paragraph written before previewing.");
    await page.getByRole("button", { name: "Preview" }).click();
    await expect(page.getByRole("article", { name: "Preview" })).toContainText("First paragraph written before previewing.");
    await page.getByRole("button", { name: "Write" }).click();
    await expect(editor).toContainText("First paragraph written before previewing.");
    await editor.press("End");
    await editor.pressSequentially(" More after.");
    await saved(page);
    await page.reload();
    await expect(page.getByRole("textbox", { name: "Editor" })).toContainText("First paragraph written before previewing. More after.", SLOW);
  } finally {
    await remove(page, url);
  }
});

test("a project's case study survives Preview and back", async ({ ownerPage: page }) => {
  await page.goto("/me/projects");
  await page.getByRole("button", { name: /new project/i }).click();
  await page.waitForURL(/\/me\/projects\/[0-9a-f-]{36}$/);
  const url = page.url();
  try {
    await page.getByLabel("Project title").fill(`E2E · Project preview ${tag()}`);
    const editor = page.getByRole("textbox", { name: "Editor" });
    await editor.fill("Case study written before previewing.");
    await page.getByRole("button", { name: "Preview" }).click();
    await page.getByRole("button", { name: "Write" }).click();
    await expect(editor).toContainText("Case study written before previewing.");
    await editor.press("End");
    await editor.pressSequentially(" Still here.");
    await saved(page);
    await page.reload();
    await expect(page.getByRole("textbox", { name: "Editor" })).toContainText("Case study written before previewing. Still here.", SLOW);
  } finally {
    await page.goto(url);
    await page.getByRole("button", { name: /^Delete$/ }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await page.waitForURL(/\/me\/projects$/, SLOW);
  }
});

test("a title that clashes with another article's slug still saves, numbered", async ({ ownerPage: page }) => {
  const title = `E2E · Clash ${tag()}`;
  const first = await newDraft(page, title);
  await saved(page);
  const base = await page.locator("#article-slug").inputValue();
  const second = await newDraft(page, title);
  try {
    await page.getByRole("textbox", { name: "Editor" }).fill("Body of the second article.");
    await saved(page);
    await expect(page.locator("#article-slug")).toHaveValue(`${base}-2`);
    await page.reload();
    await expect(page.getByRole("textbox", { name: "Editor" })).toContainText("Body of the second article.", SLOW);
  } finally {
    await remove(page, second);
    await remove(page, first);
  }
});

test("a half-typed cover URL does not stop the article from saving", async ({ ownerPage: page }) => {
  const url = await newDraft(page, `E2E · Cover ${tag()}`);
  try {
    await page.locator("#article-cover").fill("htt");
    await expect(page.getByText(/Use a full link starting with https/)).toBeVisible();
    await page.getByRole("textbox", { name: "Editor" }).fill("Saved despite the cover field.");
    await saved(page);
    await page.reload();
    await expect(page.getByRole("textbox", { name: "Editor" })).toContainText("Saved despite the cover field.", SLOW);
  } finally {
    await remove(page, url);
  }
});

test("Publish waits for a title and writing; Ctrl+S saves at once", async ({ ownerPage: page }) => {
  const url = await newDraft(page, "");
  try {
    const publish = page.getByRole("button", { name: /^Publish$/ });
    await expect(publish).toBeDisabled();
    await page.getByLabel("Article title").fill(`E2E · Ready ${tag()}`);
    const editor = page.getByRole("textbox", { name: "Editor" });
    await editor.fill("Enough to publish.");
    await expect(publish).toBeEnabled();
    await editor.press("ControlOrMeta+s");
    await saved(page);
  } finally {
    await remove(page, url);
  }
});
