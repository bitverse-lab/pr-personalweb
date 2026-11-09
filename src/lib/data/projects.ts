import { projectService, type ProjectDetail } from "@/server/services/project-service";
import { projectPeriod, projectCategories, type Project } from "@/features/projects/format";
import { publicRead } from "@/lib/data/site-cache";

export { projectCategories };
export type { Project };

// Public read model for /projects and the home page. Only published projects of the site owner are ever returned.

export interface ProjectPage extends Project {
  detail: ProjectDetail;
  period: string;
  gallery: { url: string; caption: string | null }[];
}

// Template images used when a project has no image of its own (stable per slug).
function fallbackImage(slug: string) {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `/images/portfolio/${(hash % 16) + 1}.jpg`;
}

function toProject(d: ProjectDetail): Project {
  return {
    id: d.id,
    slug: d.slug,
    name: d.title,
    label: d.category ?? "",
    category: d.category,
    image: d.coverUrl || fallbackImage(d.slug),
    summary: d.summary ?? "",
    outcome: d.outcome,
    technologies: d.technologies,
    featured: d.featured,
  };
}

export async function getProjects(): Promise<Project[]> {
  return publicRead("the project list", async () => (await projectService.published()).map(toProject), []);
}

/** Featured projects first (up to `limit`); falls back to the latest ones when nothing is featured. */
export async function getFeaturedProjects(limit = 6): Promise<Project[]> {
  const all = await getProjects();
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

/** Not wrapped in `publicRead` on purpose — see the note on getArticleBySlug: a database outage
 *  must not be reported to visitors and search engines as "this project no longer exists". */
export async function getProjectBySlug(slug: string): Promise<ProjectPage | null> {
  const detail = await projectService.publishedBySlug(slug);
  if (!detail) return null;
  const gallery = detail.gallery.map((g) => ({ url: g.url, caption: g.caption }));
  return { ...toProject(detail), detail, period: projectPeriod(detail.startDate, detail.endDate), gallery };
}

/** The projects listed just before and after `slug` in the owner's chosen order. */
export function getAdjacentProjects(all: Project[], slug: string): { prev: Project | null; next: Project | null } {
  const i = all.findIndex((p) => p.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return { prev: all[i - 1] ?? null, next: all[i + 1] ?? null };
}
