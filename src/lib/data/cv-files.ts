import { unstable_cache } from "next/cache";
import { SITE_REVALIDATE_SECONDS, SITE_TAG, publicRead } from "@/lib/data/site-cache";
import { articleRepository } from "@/server/repositories/article-repository";
import { cvFileService, type CvFileDto } from "@/server/services/cv-file-service";

// Public read model for the owner's CV files: which roles have one. The files themselves are only
// reached through /cv/download/<role>, which hands out a short-lived link.
const loadCvFiles = unstable_cache(
  async (): Promise<CvFileDto[]> => {
    const owner = await articleRepository.owner();
    return owner ? cvFileService.list(owner.id) : [];
  },
  ["public-cv-files", "v1"],
  { tags: [SITE_TAG], revalidate: SITE_REVALIDATE_SECONDS }
);

export const getCvFiles = () => publicRead("cv-files", loadCvFiles, []);
