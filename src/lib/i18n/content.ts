// Owner-written content in the visitor's language. The public read models carry the English plus
// the Indonesian the owner wrote (`tr`, `detail.translations`); these pick per field, falling back
// to English for anything left empty. Pure: used by the shared page views for both locales.
import { pickDoc, pickText } from "@/features/content/translations";
import { projectPeriod, type Project } from "@/features/projects/format";
import type { Locale } from "./locale";

/** "November 3, 2026" / "3 November 2026". */
export function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function localizeProject<P extends Project>(p: P, locale: Locale): P {
  if (locale === "en") return p;
  return { ...p, name: pickText(locale, p.name, p.tr?.title), summary: pickText(locale, p.summary, p.tr?.summary), outcome: pickText(locale, p.outcome, p.tr?.outcome) };
}

type PageLike = Project & {
  period: string;
  detail: { startDate: string | null; endDate: string | null; content: import("@/db/schema/content").RichDoc; translations: import("@/features/content/translations").ProjectTr };
};

/** A project page: the card fields, the period and the case-study body. */
export function localizeProjectPage<P extends PageLike>(p: P, locale: Locale): P {
  if (locale === "en") return p;
  const card = localizeProject(p, locale);
  return {
    ...card,
    period: projectPeriod(p.detail.startDate, p.detail.endDate, locale),
    detail: { ...p.detail, content: pickDoc(locale, p.detail.content, p.detail.translations.id?.content) },
  };
}

type ArticleLike = { title: string; excerpt: string; date: string; publishedAt: string | null; tr?: { title?: string | null; excerpt?: string | null } };

export function localizeArticle<A extends ArticleLike>(a: A, locale: Locale): A {
  if (locale === "en") return a;
  return { ...a, title: pickText(locale, a.title, a.tr?.title), excerpt: pickText(locale, a.excerpt, a.tr?.excerpt), date: formatDate(a.publishedAt, locale) };
}

type ArticlePageLike = ArticleLike & { detail: { content: import("@/db/schema/content").RichDoc; translations: import("@/features/content/translations").ArticleTr } };

export function localizeArticlePage<A extends ArticlePageLike>(a: A, locale: Locale): A {
  if (locale === "en") return a;
  return { ...localizeArticle(a, locale), detail: { ...a.detail, content: pickDoc(locale, a.detail.content, a.detail.translations.id?.content) } };
}
