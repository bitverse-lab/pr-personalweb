import { cache } from "react";
import { unstable_cache } from "next/cache";
import { SITE_REVALIDATE_SECONDS, SITE_TAG } from "@/lib/data/site-cache";
import { getProfile } from "@/lib/data/profile";
import { articleService } from "@/server/services/article-service";
import type { SiteInfo } from "@/lib/site-context";

const anyPublishedArticle = unstable_cache(
  async () => (await articleService.published(1)).length > 0,
  ["has-published-articles"],
  { tags: [SITE_TAG], revalidate: SITE_REVALIDATE_SECONDS }
);

// Everything the shared navbar and footer need. Sections with nothing to show are simply left out of the menu.
export const getSiteInfo = cache(async function getSiteInfo(): Promise<SiteInfo> {
  const profile = await getProfile();
  const hasArticles = profile.isPlaceholder ? false : await anyPublishedArticle().catch(() => false);
  return {
    name: profile.isPlaceholder ? "Personal OS" : profile.fullName,
    isPlaceholder: profile.isPlaceholder,
    links: profile.links,
    email: profile.email,
    location: profile.location,
    available: profile.availableForWork,
    availabilityNote: profile.availabilityNote,
    hasProjects: profile.projects.length > 0,
    hasArticles,
  };
});
