import type { MetadataRoute } from "next";
import { articleService } from "@/server/services/article-service";
import { projectService } from "@/server/services/project-service";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPages = ["", "/about", "/cv", "/projects", "/articles", "/contact", "/match", "/proof", "/privacy"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  let articles: MetadataRoute.Sitemap = [];
  try {
    articles = (await articleService.published(200)).map((a) => ({
      url: `${base}/articles/${a.slug}`,
      lastModified: new Date(a.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // the sitemap must still render if the database is briefly unreachable
  }
  let projects: MetadataRoute.Sitemap = [];
  try {
    projects = (await projectService.published()).map((p) => ({
      url: `${base}/projects/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // same: never fail the sitemap
  }
  return [...staticPages, ...articles, ...projects];
}
