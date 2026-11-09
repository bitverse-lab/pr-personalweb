import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ArticleCard from "@/components/shared/ArticleCard";
import ArticleListSkeleton from "@/components/shared/ArticleListSkeleton";
import ArticleSidebar from "@/components/shared/ArticleSidebar";
import { getArticles } from "@/lib/data/articles";

export const metadata: Metadata = {
  title: "Articles",
  description: "Writing on things I am building and learning.",
};

type ArticlesPageProps = { searchParams: Promise<{ q?: string; tag?: string }> };

export default function ArticlesPage({ searchParams }: ArticlesPageProps) {
  return (
    <>
      <PersonalNavbar />
      <Suspense fallback={<ArticleListSkeleton />}>
        <ArticlesContent searchParams={searchParams} />
      </Suspense>
      <SmallFooter />
    </>
  );
}

async function ArticlesContent({ searchParams }: ArticlesPageProps) {
  const { q = "", tag = "" } = await searchParams;
  const all = await getArticles();

  const needle = q.trim().toLowerCase();
  const articles = all.filter(
    (a) =>
      (!tag || a.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) &&
      (!needle || a.title.toLowerCase().includes(needle) || a.excerpt.toLowerCase().includes(needle))
  );
  const filtered = !!needle || !!tag;

  return (
    <>
      <main id="main-content" tabIndex={-1}>
      <section className="d-table w-100 position-relative overflow-hidden">
        <div className="bg-overlay bg-gradient-overlay-2"></div>
        <div className="bg-half-170">
          <div className="container">
            <div className="row mt-5 justify-content-center">
              <div className="col-12">
                <div className="title-heading text-center">
                  <h1 className="h2 text-white title-dark">Articles</h1>
                  <p className="text-white-50 mb-0">Writing on things I am building and learning.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="features-absolute blog-search">
                <div className="row justify-content-center">
                  <div className="col-md-9">
                    <div className="text-center subcribe-form">
                      <form style={{ maxWidth: "800px" }} method="get" action="/articles" role="search">
                        <div className="mb-0">
                          <input type="text" id="help" name="q" className="border shadow rounded-pill bg-white" placeholder="Search" defaultValue={q} aria-label="Search articles" />
                          <button type="submit" className="btn btn-pills btn-primary">
                            Search
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="row justify-content-center">
            <div className="col">
              <div className="section-title text-center mb-4 pb-2">
                <h4 className="mb-4">{filtered ? "Results" : "Latest Posts"}</h4>
                {filtered && (
                  <p className="text-muted para-desc mb-0 mx-auto">
                    {articles.length} article{articles.length === 1 ? "" : "s"}
                    {tag && <> tagged “{tag}”</>}
                    {needle && <> matching “{q}”</>} ·{" "}
                    <Link href="/articles">clear filters</Link>
                  </p>
                )}
              </div>
            </div>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-5">
              <h5 className="mb-2">{filtered ? "Nothing matches your search" : "No articles published yet"}</h5>
              <p className="text-muted mb-0">{filtered ? "Try a different keyword or tag." : "Check back soon — new writing will show up here."}</p>
            </div>
          ) : (
            <div className="row">
              <div className="col-lg-8 col-md-6">
                <div className="row">
                  {articles.map((article) => (
                    <div className="col-lg-6 mt-4 pt-2" key={article.id}>
                      <ArticleCard article={article} />
                    </div>
                  ))}
                </div>
              </div>
              <ArticleSidebar articles={all} query={q} />
            </div>
          )}
        </div>

        <div className="container mt-100 mt-60">
          <div className="row">
            <div className="col-12">
              <div className="rounded shadow bg position-relative overflow-hidden">
                <div className="bg-overlay"></div>

                <div className="row align-items-center p-4 py-lg-5">
                  <div className="col-lg-8">
                    <div className="section-title">
                      <h4 className="text-white title-dark">Enough Talk, Let&apos;s Build Something Together</h4>
                      <p className="text-white-50 mb-0">Get in touch and let&apos;s start a project.</p>
                    </div>
                  </div>

                  <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
                    <Link href="/contact" className="btn btn-primary">
                      Get In Touch
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}
