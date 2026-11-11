import type { Page } from "@playwright/test";
import { expect, test } from "./support/owner";

// Proves that a change made in /me reaches the public site. Runs against the one live database,
// so every record is prefixed "E2E · " / "e2e-", published only for the assertion and deleted
// afterwards; global-teardown sweeps anything a crashed test left behind.
test.skip(!!process.env.CI, "touches the live database; run locally with pnpm test:e2e");
test.describe.configure({ mode: "serial", timeout: 120_000 });

// Assert on the editor's resulting state, not on toasts: toasts vanish, and in `next dev` the
// first call of a server action compiles it, which can take well over Playwright's 5 s default.
const SLOW = { timeout: 30_000 };

const tag = () => Date.now().toString(36);
// ConfirmDialog renders role="alertdialog"; Playwright matches roles exactly.
const confirmDelete = (page: Page, title: RegExp) => page.getByRole("alertdialog", { name: title }).getByRole("button", { name: "Delete" }).click();

async function newProject(page: Page, title: string) {
  await page.goto("/me/projects");
  await page.getByRole("button", { name: /new project/i }).click();
  await page.waitForURL(/\/me\/projects\/[0-9a-f-]{36}$/);
  await page.getByLabel("Project title").fill(title);
  await page.getByRole("textbox", { name: "Editor" }).fill("A short case study written by the end-to-end test.");
  return page.url();
}

async function publish(page: Page) {
  await page.getByRole("button", { name: /^Publish$/ }).click();
  await expect(page.getByRole("link", { name: "View on site" })).toBeVisible(SLOW);
}

async function unpublish(page: Page) {
  await page.getByRole("button", { name: "Unpublish (back to draft)" }).click();
  await expect(page.getByRole("button", { name: /^Publish$/ })).toBeVisible(SLOW);
}

async function deleteFromEditor(page: Page, editorUrl: string, dialog: RegExp) {
  await page.goto(editorUrl);
  await page.getByRole("button", { name: /^Delete$/ }).click();
  await confirmDelete(page, dialog);
  await page.waitForURL(/\/me\/(projects|articles)$/, SLOW);
}

test("signed-in owner fixture reaches the workspace", async ({ ownerPage }) => {
  await ownerPage.goto("/me");
  await expect(ownerPage).toHaveURL(/\/me$/);
});

test("a published project appears on the public site, and leaves it when unpublished", async ({ ownerPage: page }) => {
  const title = `E2E · Sync project ${tag()}`;
  const editor = await newProject(page, title);
  const slug = await page.locator("#p-slug").inputValue();
  expect(slug).toMatch(/^e2e-/);
  try {
    await publish(page);
    await page.goto("/projects");
    await expect(page.getByRole("link", { name: title })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Work", exact: true }).first()).toBeVisible();
    const detail = await page.goto(`/projects/${slug}`);
    expect(detail?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    await page.goto(editor);
    await unpublish(page);
    await page.goto("/projects");
    await expect(page.getByText(title)).toHaveCount(0);
    expect((await page.goto(`/projects/${slug}`))?.status()).toBe(404);
  } finally {
    await deleteFromEditor(page, editor, /Delete project\?/);
  }
});

test("a featured project shows on the home page until unfeatured", async ({ ownerPage: page }) => {
  const title = `E2E · Featured ${tag()}`;
  const editor = await newProject(page, title);
  try {
    await publish(page);
    await page.getByRole("button", { name: "☆ Feature on home page" }).click();
    await expect(page.getByRole("button", { name: "★ Featured on home page" })).toBeVisible(SLOW);
    await page.goto("/");
    // Home fills its three slots featured-first, then newest, so an unfeatured project can still
    // appear; what must follow the admin flag is whether its card is marked featured.
    const card = page.locator("[data-case]").filter({ has: page.getByRole("link", { name: title }) });
    await expect(card).toHaveAttribute("data-featured", "");

    await page.goto(editor);
    await page.getByRole("button", { name: "★ Featured on home page" }).click();
    await expect(page.getByRole("button", { name: "☆ Feature on home page" })).toBeVisible(SLOW);
    await page.goto("/");
    await expect(page.locator("[data-case][data-featured]").filter({ has: page.getByRole("link", { name: title }) })).toHaveCount(0);
  } finally {
    await deleteFromEditor(page, editor, /Delete project\?/);
  }
});

test("a published article reaches the list, its page, the feed and the sitemap", async ({ ownerPage: page, request }) => {
  const title = `E2E · Sync article ${tag()}`;
  await page.goto("/me/articles");
  await page.getByRole("button", { name: /new article/i }).click();
  await page.waitForURL(/\/me\/articles\/[0-9a-f-]{36}$/);
  const editor = page.url();
  await page.getByLabel("Article title").fill(title);
  await page.getByRole("textbox", { name: "Editor" }).fill("An article body written by the end-to-end test.");
  const slug = await page.locator("#article-slug").inputValue();
  expect(slug).toMatch(/^e2e-/);
  try {
    await publish(page);
    await page.goto("/articles");
    // listed in the main grid and in the "Latest Posts" sidebar
    await expect(page.getByText(title).first()).toBeVisible();
    expect((await page.goto(`/articles/${slug}`))?.status()).toBe(200);
    expect(await (await request.get("/feed.xml")).text()).toContain(slug);
    expect(await (await request.get("/sitemap.xml")).text()).toContain(slug);

    await page.goto(editor);
    await unpublish(page);
    await page.goto("/articles");
    await expect(page.getByText(title)).toHaveCount(0);
    expect((await page.goto(`/articles/${slug}`))?.status()).toBe(404);
    expect(await (await request.get("/feed.xml")).text()).not.toContain(slug);
    expect(await (await request.get("/sitemap.xml")).text()).not.toContain(slug);
  } finally {
    await deleteFromEditor(page, editor, /Delete article\?/);
  }
});

test("a published testimonial shows on the home page until hidden", async ({ ownerPage: page }) => {
  const name = `E2E · Reviewer ${tag()}`;
  const quote = `End-to-end testimonial ${tag()}`;
  await page.goto("/me/testimonials");
  await page.getByRole("button", { name: "Add" }).click();
  await page.locator("#t-quote").fill(quote);
  await page.locator("#t-name").fill(name);
  await page.getByRole("dialog", { name: "Add testimonial" }).getByRole("button", { name: "Save" }).click();
  const row = page.getByRole("listitem").filter({ hasText: name });
  await expect(row).toBeVisible(SLOW);
  try {
    await row.getByRole("button", { name: "Show on home page" }).click();
    await expect(row.getByRole("button", { name: "Hide from home page" })).toBeVisible(SLOW);
    await page.goto("/");
    await expect(page.getByText(quote)).toBeVisible();

    await page.goto("/me/testimonials");
    await row.getByRole("button", { name: "Hide from home page" }).click();
    await expect(row.getByRole("button", { name: "Show on home page" })).toBeVisible(SLOW);
    await page.goto("/");
    await expect(page.getByText(quote)).toHaveCount(0);
  } finally {
    await page.goto("/me/testimonials");
    await page.getByRole("button", { name: `Delete testimonial from ${name}` }).click();
    await confirmDelete(page, /Delete testimonial\?/);
    await expect(page.getByText(name)).toHaveCount(0, SLOW);
  }
});

test("an added experience appears on the CV and home pages, and goes when deleted", async ({ ownerPage: page }) => {
  const company = `E2E · Acme ${tag()}`;
  const role = `E2E Engineer ${tag()}`;
  // Experience lives in a tab panel that stays hidden until its tab ("Experience (n)") is selected.
  const openExperienceTab = async () => {
    await page.goto("/me/settings/profile");
    await page.getByRole("tab", { name: /^Experience/ }).click();
    return page.getByRole("tabpanel").filter({ hasText: "Work experience" });
  };
  await (await openExperienceTab()).getByRole("button", { name: "Add", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add experience" });
  await dialog.locator("#x-company").fill(company);
  await dialog.locator("#x-role").fill(role);
  await dialog.locator("#x-start").fill("2024-01");
  await dialog.locator("#x-current").check();
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toHaveCount(0, SLOW);
  try {
    // the experience timeline renders on /cv and the home page (not /about)
    for (const path of ["/cv", "/"]) {
      await page.goto(path);
      await expect(page.getByText(company).first()).toBeVisible();
    }
  } finally {
    await (await openExperienceTab()).getByRole("button", { name: `Delete ${role}` }).click();
    await confirmDelete(page, /Delete experience\?/);
    await expect(page.getByText(role)).toHaveCount(0, SLOW);
  }
  await page.goto("/cv");
  await expect(page.getByText(company)).toHaveCount(0);
});
