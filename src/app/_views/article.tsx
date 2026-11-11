import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import RichTextRenderer from "@/components/shared/RichTextRenderer";
import JsonLd from "@/components/shared/JsonLd";
import TableOfContents from "@/components/shared/TableOfContents";
import PrevNext from "@/components/shared/PrevNext";
import ReadingProgress from "@/components/shared/ReadingProgress";
import ShareButtons from "@/components/shared/ShareButtons";
import { extractHeadings } from "@/features/content/richtext";
import { siteUrl } from "@/lib/site";
import { getAdjacentArticles, getArticleBySlug, getArticles, getRelatedArticles } from "@/lib/data/articles";
import { vt } from "@/lib/view-transition";
import { dict } from "@/lib/i18n/dict";
import { languages, localize, type Locale } from "@/lib/i18n/locale";

export async function articleMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const article = await getArticleBySlug(slug);
  if (!article) return { title: dict(locale).article.notFound };
  const description = article.excerpt || undefined;
  return {
    title: article.title,
    description,
    alternates: { canonical: localize(locale, `/articles/${article.slug}`), languages: languages(`/articles/${article.slug}`) },
    openGraph: { type: "article", title: article.title, description, url: localize(locale, `/articles/${article.slug}`), images: [article.detail.coverUrl ? { url: article.detail.coverUrl } : { url: "/og-default.png", width: 1200, height: 630 }], publishedTime: article.detail.publishedAt ?? undefined, tags: article.tags },
  };
}

export async function ArticleDetailPage({ locale, slug }: { locale: Locale; slug: string }) {
  const t = dict(locale).writing;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const all = await getArticles();
  const related = getRelatedArticles(all, article, 2);
  const { older, newer } = getAdjacentArticles(all, article.slug);
  const headings = extractHeadings(article.detail.content);

  return (
    <>
      <PersonalNavbar />
      <ReadingProgress targetId="article-body" />
      <main id="main-content" tabIndex={-1}>
        <JsonLd
          data={{
            "@type": "Article",
            headline: article.title,
            description: article.excerpt || undefined,
            datePublished: article.detail.publishedAt ?? undefined,
            dateModified: article.detail.updatedAt,
            image: article.detail.coverUrl ? [article.detail.coverUrl] : undefined,
            keywords: article.tags.join(", ") || undefined,
            author: { "@type": "Person", name: article.author },
            mainEntityOfPage: `${siteUrl()}${localize(locale, `/articles/${article.slug}`)}`,
          }}
        />

        <section className="page-head">
          <div className="container">
            <p className="mono-meta mb-3">
              <Link href={localize(locale, "/articles")} className="path-label">← ~/writing</Link> · {article.date} · {article.readMinutes} {t.minRead}
            </p>
            <h1 className="page-head-title article-title" style={vt("atitle", article.slug)}>{article.title}</h1>
            {article.excerpt && <p className="page-head-lede">{article.excerpt}</p>}
          </div>
        </section>

        <section className="section pt-4">
          <div className="container">
            <div className="article-layout">
              <article id="article-body" className="article-main">
                {article.detail.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={article.detail.coverUrl} className="img-fluid rounded mb-5" alt="" style={vt("acover", article.slug)} />
                )}
                <div className="reading-col">
                  <RichTextRenderer doc={article.detail.content} />
                </div>

                {article.tags.length > 0 && (
                  <div className="case-layers mt-5" aria-label={t.tags}>
                    {article.tags.map((tag) => (
                      <Link href={localize(locale, `/articles?tag=${encodeURIComponent(tag)}`)} className="layer-chip" key={tag}>
                        {tag.toLowerCase()}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <ShareButtons url={`${siteUrl()}${localize(locale, `/articles/${article.slug}`)}`} title={article.title} />
                </div>

                <PrevNext
                  prev={older ? { href: localize(locale, `/articles/${older.slug}`), title: older.title } : null}
                  next={newer ? { href: localize(locale, `/articles/${newer.slug}`), title: newer.title } : null}
                  prevLabel={t.older}
                  nextLabel={t.newer}
                  aria={dict(locale).more.aria}
                />

                {related.length > 0 && (
                  <div className="mt-5">
                    <h2 className="mono-meta mb-2">{t.keepReading}</h2>
                    <ul className="list-unstyled mb-0">
                      {related.map((item) => (
                        <li key={item.id} className="writing-earlier-item">
                          <Link href={localize(locale, `/articles/${item.slug}`)} className="writing-earlier-link">{item.title}</Link>
                          <p className="mono-meta mb-0 mt-1">{item.date}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>

              <aside className="article-aside">
                <TableOfContents headings={headings} />
              </aside>
            </div>
          </div>
        </section>
      </main>
      <SmallFooter />
    </>
  );
}
