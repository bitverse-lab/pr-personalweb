import { expect, test } from "./support/owner";

// The owner's CV files: uploaded in /me, offered on /cv, downloaded through a short-lived link.
// Uses the live database and storage like admin-public-sync.spec.ts, on a role the owner does not
// use (Frontend); it never touches a role that already has a CV.
test.skip(!!process.env.CI, "touches the live database and storage; run locally with pnpm test:e2e");
test.describe.configure({ timeout: 120_000 });

const SLOW = { timeout: 30_000 };
// The smallest file the server accepts as a PDF: it checks the first bytes (%PDF-).
const PDF = Buffer.from("%PDF-1.4\n1 0 obj <<>> endobj\ntrailer <<>>\n%%EOF\n");

test("a CV uploaded for a role is offered on /cv and downloads through a signed link", async ({ ownerPage: page, request }) => {
  await page.goto("/me/settings/profile");
  await page.getByRole("tab", { name: /^CV files/ }).click();
  const row = page.locator("li", { hasText: "Frontend Engineer" });
  test.skip(await row.getByRole("button", { name: /Replace/ }).isVisible(), "the owner has a Frontend CV; not touching it");

  const chooser = page.waitForEvent("filechooser");
  await row.getByRole("button", { name: /Upload PDF/ }).click();
  await (await chooser).setFiles({ name: "e2e-frontend-cv.pdf", mimeType: "application/pdf", buffer: PDF });
  await expect(row).toContainText("e2e-frontend-cv.pdf", SLOW);

  try {
    await page.goto("/cv");
    await expect(page.locator("#cv-files").getByRole("link", { name: "Frontend Engineer CV (PDF)" })).toBeVisible();

    const res = await request.get("/cv/download/frontend", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    const to = res.headers()["location"]!;
    expect(to).toContain("/storage/v1/object/sign/private-docs/");
    expect(to).toContain("download=e2e-frontend-cv.pdf");
    expect(res.headers()["cache-control"]).toContain("no-store");
  } finally {
    await page.goto("/me/settings/profile");
    await page.getByRole("tab", { name: /^CV files/ }).click();
    await row.getByRole("button", { name: "Remove the Frontend Engineer CV" }).click();
    await page.getByRole("alertdialog", { name: /Remove CV\?/ }).getByRole("button", { name: "Remove" }).click();
    await expect(row).toContainText("No CV", SLOW);
  }
  // Removed: the role now leads back to the list instead of a file.
  const gone = await request.get("/cv/download/frontend", { maxRedirects: 0 });
  expect(gone.headers()["location"]).toMatch(/\/cv#cv-files$/);
});
