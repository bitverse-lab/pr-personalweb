import { articleRepository } from "@/server/repositories/article-repository";
import { articleService, type ArticleDetail, type ArticleListItem } from "@/server/services/article-service";
import { readingMinutes } from "@/features/content/richtext";

// Public read model for /articles. Only published articles of the site owner are ever returned.

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  tags: string[];
  date: string;
  image: string;
  readMinutes: number;
}

export interface ArticlePage extends Article {
  detail: ArticleDetail;
  author: string;
}

// Template images used when an article has no cover of its own (stable per slug).
function fallbackImage(slug: string) {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `/images/blog/${(hash % 9) + 1}.jpg`;
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function toArticle(item: ArticleListItem): Article {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt ?? "",
    tag: item.tags[0] ?? "Article",
    tags: item.tags,
    date: formatDate(item.publishedAt),
    image: item.coverUrl || fallbackImage(item.slug),
    readMinutes: readingMinutes(item.wordCount),
  };
}

export async function getArticles(): Promise<Article[]> {
  return (await articleService.published()).map(toArticle);
}

export async function getArticleBySlug(slug: string): Promise<ArticlePage | null> {
  const [detail, owner] = await Promise.all([articleService.publishedBySlug(slug), articleRepository.owner()]);
  if (!detail) return null;
  return { ...toArticle(detail), detail, author: owner?.name || "Author" };
}

export function getRelatedArticles(all: Article[], current: Article, limit = 2): Article[] {
  const others = all.filter((a) => a.slug !== current.slug);
  const shared = others.filter((a) => a.tags.some((t) => current.tags.includes(t)));
  return [...shared, ...others.filter((a) => !shared.includes(a))].slice(0, limit);
}

/** Older and newer published articles around `slug` (the list is newest first). */
export function getAdjacentArticles(all: Article[], slug: string): { older: Article | null; newer: Article | null } {
  const i = all.findIndex((a) => a.slug === slug);
  if (i < 0) return { older: null, newer: null };
  return { older: all[i + 1] ?? null, newer: all[i - 1] ?? null };
}
