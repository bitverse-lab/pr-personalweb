import { revalidatePath, revalidateTag } from "next/cache";
import { reportError } from "@/lib/report-error";

/** Tag shared by every cached read of public site data (profile, links, published articles/projects). */
export const SITE_TAG = "site-data";

/** How long public site data may be served from the cache when nothing invalidates it earlier. */
export const SITE_REVALIDATE_SECONDS = 300;

/** Call after any change that visitors can see (profile, projects, articles): drops the cache and re-renders public pages. */
export function revalidateSiteData() {
  revalidateTag(SITE_TAG);
  revalidatePath("/", "layout");
}

/**
 * Runs a public-page database read and falls back to empty content if it fails.
 *
 * The public site is the part strangers see, and a database that is briefly unreachable —
 * a paused free-tier project, a connection limit, a restart — should cost a recruiter a
 * section of the page, not a crash. It also keeps `next build` from failing while
 * prerendering, so a deploy is never blocked by a database hiccup.
 *
 * Deliberately wraps the *outside* of the cache, so a failure is never itself cached.
 */
export async function publicRead<T>(what: string, read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    reportError("public-read", error);
    return fallback;
  }
}
