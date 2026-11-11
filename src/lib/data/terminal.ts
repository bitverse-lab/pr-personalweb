import { getArticles } from "@/lib/data/articles";
import { getProjects } from "@/lib/data/projects";
import type { TerminalIndex } from "@/components/shared/PublicTerminal";

/** What the public terminal can jump to. Both reads are cached and degrade to [] when the database is down. */
export async function getTerminalIndex(): Promise<TerminalIndex> {
  const [projects, articles] = await Promise.all([getProjects(), getArticles()]);
  return {
    projects: projects.map((p) => ({ slug: p.slug, name: p.name, keywords: [...p.technologies, p.category ?? ""].filter(Boolean) })),
    articles: articles.map((a) => ({ slug: a.slug, title: a.title, keywords: a.tags ?? [] })),
  };
}
