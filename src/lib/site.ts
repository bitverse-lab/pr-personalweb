/** Public base URL of the site (no trailing slash). Set SITE_URL in production; falls back to AUTH_URL, then localhost. */
export function siteUrl(): string {
  return (process.env.SITE_URL ?? process.env.AUTH_URL ?? "http://localhost:3001").replace(/\/$/, "");
}
