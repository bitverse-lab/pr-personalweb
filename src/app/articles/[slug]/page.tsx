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

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article not found" };
  const description = article.excerpt || undefined;
  return {
    title: article.title,
    description,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: { type: "article", title: article.title, description, url: `/articles/${article.slug}`, images: [article.detail.coverUrl ? { url: article.detail.coverUrl } : { url: "/og-default.png", width: 1200, height: 630 }], publishedTime: article.detail.publishedAt ?? undefined, tags: article.tags },
  };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
            mainEntityOfPage: `${siteUrl()}/articles/${article.slug}`,
          }}
        />

        <section className="page-head">
          <div className="container">
            <p className="mono-meta mb-3">
              <Link href="/articles" className="path-label">← ~/writing</Link> · {article.date} · {article.readMinutes} min read
            </p>
            <h1 className="page-head-title article-title">{article.title}</h1>
            {article.excerpt && <p className="page-head-lede">{article.excerpt}</p>}
          </div>
        </section>

        <section className="section pt-4">
          <div className="container">
            <div className="article-layout">
              <article id="article-body" className="article-main">
                {article.detail.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={article.detail.coverUrl} className="img-fluid rounded mb-5" alt="" />
                )}
                <div className="reading-col">
                  <RichTextRenderer doc={article.detail.content} />
                </div>

                {article.tags.length > 0 && (
                  <div className="case-layers mt-5" aria-label="Tags">
                    {article.tags.map((t) => (
                      <Link href={`/articles?tag=${encodeURIComponent(t)}`} className="layer-chip" key={t}>
                        {t.toLowerCase()}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <ShareButtons url={`${siteUrl()}/articles/${article.slug}`} title={article.title} />
                </div>

                <PrevNext
                  prev={older ? { href: `/articles/${older.slug}`, title: older.title } : null}
                  next={newer ? { href: `/articles/${newer.slug}`, title: newer.title } : null}
                  prevLabel="Older article"
                  nextLabel="Newer article"
                />

                {related.length > 0 && (
                  <div className="mt-5">
                    <h2 className="mono-meta mb-2">Keep reading</h2>
                    <ul className="list-unstyled mb-0">
                      {related.map((item) => (
                        <li key={item.id} className="writing-earlier-item">
                          <Link href={`/articles/${item.slug}`} className="writing-earlier-link">{item.title}</Link>
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
