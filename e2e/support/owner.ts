import { test as base, type Page } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { findOwner, openSql } from "./owner-db";

const COOKIE = "authjs.session-token"; // http (localhost) name; also the JWT salt

/**
 * A page signed in as the site owner. Google sign-in cannot be automated, so the fixture mints
 * the same encrypted JWT Auth.js would issue, using AUTH_SECRET. Local only.
 */
export const test = base.extend<{ ownerPage: Page }>({
  ownerPage: async ({ page, baseURL }, use) => {
    const host = new URL(baseURL ?? "http://localhost:3001").hostname;
    if (host !== "localhost" && host !== "127.0.0.1") throw new Error(`Refusing to mint an owner session for ${host}; local runs only.`);
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET must be set in .env.local");

    const sql = openSql();
    const owner = await findOwner(sql).finally(() => sql.end());
    const token = await encode({ token: { id: owner.id, sub: owner.id, email: owner.email, name: owner.name }, secret, salt: COOKIE });
    await page.context().addCookies([{ name: COOKIE, value: token, domain: host, path: "/", httpOnly: true, sameSite: "Lax", secure: false }]);
    await use(page);
  },
});

export { expect } from "@playwright/test";
