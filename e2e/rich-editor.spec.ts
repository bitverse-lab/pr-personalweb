import { expect, test } from "./support/owner";

// A pasted link carries ProseMirror attrs with a null prototype, which Server Actions refuse; the
// autosave then failed silently and the link was lost. Writes an "E2E · " project, deleted after.
test.skip(!!process.env.CI, "touches the live database; run locally with pnpm test:e2e");
test.describe.configure({ timeout: 120_000 });

test("pasting a link into the rich editor saves", async ({ ownerPage: page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto("/me/projects");
  await page.getByRole("button", { name: /new project/i }).click();
  await page.waitForURL(/\/me\/projects\/[0-9a-f-]{36}$/);
  const url = page.url();
  try {
    await page.getByLabel("Project title").fill(`E2E · Paste ${Date.now().toString(36)}`);
    const editor = page.getByRole("textbox", { name: "Editor" });
    await editor.click();
    await editor.evaluate((el) => {
      const dt = new DataTransfer();
      dt.setData("text/plain", "https://example.com/a-pasted-link");
      dt.setData("text/html", '<a href="https://example.com/a-pasted-link">https://example.com/a-pasted-link</a>');
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    await expect(editor.locator('a[href="https://example.com/a-pasted-link"]')).toBeVisible();
    await page.waitForTimeout(4000); // autosave debounce + server action
    await page.reload();
    await expect(page.getByRole("textbox", { name: "Editor" }).locator('a[href="https://example.com/a-pasted-link"]')).toBeVisible({ timeout: 30_000 });
    expect(errors.filter((e) => /plain objects|null prototype/i.test(e))).toEqual([]);
  } finally {
    await page.goto(url);
    await page.getByRole("button", { name: /^Delete$/ }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await page.waitForURL(/\/me\/projects$/, { timeout: 30_000 });
  }
});
