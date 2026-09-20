import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FiHome } from "react-icons/fi";
import { MdArrowForward, MdOutlineArrowBack } from "react-icons/md";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ArticleCard from "@/components/shared/ArticleCard";
import ArticleSidebar from "@/components/shared/ArticleSidebar";
import ParallaxBackground from "@/components/shared/ParallaxBackground";
import RichTextRenderer from "@/components/shared/RichTextRenderer";
import JsonLd from "@/components/shared/JsonLd";
import ArticleToc from "@/components/shared/ArticleToc";
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

      <section className="position-relative overflow-hidden w-100">
        <ParallaxBackground image="/images/bg/01.jpg" alt="article background" />
        <div className="bg-overlay bg-gradient-overlay-2"></div>
        <div className="bg-half-170 w-100">
          <div className="container">
            <div className="row mt-5 justify-content-center">
              <div className="col-12">
                <div className="title-heading text-center">
                  <span className="badge bg-primary">{article.tag}</span>
                  <h1 className="h5 heading fw-semibold mb-0 sub-heading text-white title-dark mt-4">{article.title}</h1>

                  <ul className="list-inline text-center mb-0">
                    <li className="list-inline-item mx-4 mt-4">
                      <span className="text-white-50 d-block">Author</span>
                      <Link href="/about" className="text-white title-dark">
                        {article.author}
                      </Link>
                    </li>

                    <li className="list-inline-item mx-4 mt-4">
                      <span className="text-white-50 d-block">Date</span>
                      <span className="text-white title-dark">{article.date}</span>
                    </li>

                    <li className="list-inline-item mx-4 mt-4">
                      <span className="text-white-50 d-block">Read Time</span>
                      <span className="text-white title-dark">{article.readMinutes} min read</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 col-md-7">
              <div className="card border-0 shadow rounded overflow-hidden">
                {article.detail.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={article.detail.coverUrl} className="img-fluid" alt="" />
                )}

                <div className="card-body" id="article-body">
                  <ArticleToc headings={headings} />
                  <RichTextRenderer doc={article.detail.content} className="mt-2" />

                  <hr className="my-4" />
                  <ShareButtons url={`${siteUrl()}/articles/${article.slug}`} title={article.title} />

                  {article.tags.length > 0 && (
                    <div className="mt-4">
                      {article.tags.map((t) => (
                        <Link href={`/articles?tag=${encodeURIComponent(t)}`} className="badge badge-link bg-primary ms-1" key={t}>
                          {t}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <PrevNext
                prev={older ? { href: `/articles/${older.slug}`, title: older.title } : null}
                next={newer ? { href: `/articles/${newer.slug}`, title: newer.title } : null}
                prevLabel="Older article"
                nextLabel="Newer article"
              />

              {related.length > 0 && (
                <div className="card shadow rounded mt-4">
                  <div className="card-body">
                    <h5 className="card-title mb-0">Keep reading :</h5>

                    <div className="row mt-2">
                      {related.map((item) => (
                        <div className="col-lg-6 mt-4 pt-2" key={item.id}>
                          <ArticleCard article={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="d-flex align-items-center justify-content-between mt-5">
                <Link href="/articles" className="text-dark align-items-center">
                  <span className="pro-icons">
                    <MdOutlineArrowBack className="align-middle me-1" />
                  </span>
                  <span className="text-muted d-none d-lg-inline-block">All Articles</span>
                </Link>

                <Link href="/" className="btn btn-lg btn-pills btn-icon btn-soft-primary">
                  <FiHome className="icon" />
                </Link>

                <Link href="/articles" className="text-dark align-items-center">
                  <span className="text-muted d-none d-lg-inline-block">More Articles</span>
                  <span className="pro-icons">
                    <MdArrowForward className="align-middle ms-1" />
                  </span>
                </Link>
              </div>
            </div>
            <ArticleSidebar articles={all} />
          </div>
        </div>
      </section>
      </main>
      <SmallFooter />
    </>
  );
}
