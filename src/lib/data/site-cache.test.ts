import { beforeEach, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

import { revalidatePath, revalidateTag } from "next/cache";
import { revalidateSiteData, SITE_TAG } from "./site-cache";

beforeEach(() => vi.clearAllMocks());

// sitemap.ts and feed.xml/route.ts keep their own `revalidate` and are not tagged, so a
// public-visible change has to name them or they stay stale for up to an hour.
test("revalidateSiteData refreshes the tag, the whole layout, the sitemap and the feed", () => {
  revalidateSiteData();

  expect(revalidateTag).toHaveBeenCalledWith(SITE_TAG);
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
  expect(revalidatePath).toHaveBeenCalledWith("/feed.xml");
});
