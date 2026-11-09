import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ArticleListSkeleton from "@/components/shared/ArticleListSkeleton";
import CoverBlock from "@/components/shared/CoverBlock";
import { getArticles, type Article } from "@/lib/data/articles";

export const metadata: Metadata = {
  title: "Writing",
  description: "Notes from building things: backend, data and machine learning, written after the work.",
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

function ArticleRow({ article }: { article: Article }) {
  return (
    <li className="log-row">
      <p className="mono-meta mb-0 log-date">{article.date}</p>
      <div>
        <Link href={`/articles/${article.slug}`} className="log-title">{article.title}</Link>
        {article.excerpt && <p className="log-excerpt">{article.excerpt}</p>}
      </div>
      <p className="mono-meta mb-0 log-time">{article.readMinutes} min</p>
    </li>
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
  const tags = Array.from(new Set(all.flatMap((a) => a.tags))).sort((a, b) => a.localeCompare(b));
  const [latest, ...rest] = articles;
  const earlier = filtered ? [] : rest.slice(0, 3);
  const archive = filtered ? articles : rest.slice(3);

  return (
    <main id="main-content" tabIndex={-1}>
      <section className="page-head">
        <div className="container">
          <h1 className="page-head-title">Notes from building things.</h1>
          <p className="path-label mt-3 mb-0">~/writing · {all.length} article{all.length === 1 ? "" : "s"}</p>
          <form className="writing-search" method="get" action="/articles" role="search">
            <input type="search" name="q" className="form-control" placeholder="Search writing" defaultValue={q} aria-label="Search articles" />
            {tag && <input type="hidden" name="tag" value={tag} />}
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
          {tags.length > 0 && (
            <nav className="layer-filter" aria-label="Filter by tag">
              <Link href="/articles" className={`layer-chip ${!tag ? "layer-chip--active" : ""}`} aria-current={!tag ? "page" : undefined}>all</Link>
              {tags.map((t) => (
                <Link key={t} href={`/articles?tag=${encodeURIComponent(t)}`} className={`layer-chip ${tag.toLowerCase() === t.toLowerCase() ? "layer-chip--active" : ""}`} aria-current={tag.toLowerCase() === t.toLowerCase() ? "page" : undefined}>
                  {t.toLowerCase()}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {filtered && (
            <p className="mono-meta mb-4">
              {articles.length} result{articles.length === 1 ? "" : "s"}
              {tag && <> · tag {tag.toLowerCase()}</>}
              {needle && <> · “{q}”</>} · <Link href="/articles">clear</Link>
            </p>
          )}

          {articles.length === 0 ? (
            <div className="py-4">
              <h2 className="h5 mb-2">{filtered ? "Nothing matches that" : "No articles published yet"}</h2>
              <p className="text-muted mb-0">{filtered ? "Try another word or tag." : "Check back soon — new writing will show up here."}</p>
            </div>
          ) : (
            <>
              {!filtered && latest && (
                <div className="writing-grid">
                  <article className="writing-latest" data-latest>
                    <Link href={`/articles/${latest.slug}`} className="writing-latest-link">
                      <CoverBlock src={latest.image} title={latest.title} ratio="16/10" />
                      <p className="mono-meta mt-3 mb-1">Latest · {latest.date} · {latest.readMinutes} min</p>
                      <h2 className="writing-latest-title">{latest.title}</h2>
                      {latest.excerpt && <p className="writing-excerpt">{latest.excerpt}</p>}
                    </Link>
                  </article>
                  {earlier.length > 0 && (
                    <div className="writing-earlier">
                      <h2 className="mono-meta writing-earlier-head mb-2">Earlier</h2>
                      <ul className="list-unstyled mb-0">
                        {earlier.map((a) => (
                          <li key={a.id} className="writing-earlier-item">
                            <Link href={`/articles/${a.slug}`} className="writing-earlier-link">{a.title}</Link>
                            <p className="mono-meta mb-0 mt-1">{a.date}{a.tag ? ` · ${a.tag.toLowerCase()}` : ""}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {archive.length > 0 && (
                <div className={filtered ? "" : "mt-5 pt-3"}>
                  {!filtered && <h2 className="selected-work-title">Archive</h2>}
                  <ol className="log list-unstyled mb-0">
                    {archive.map((a) => (
                      <ArticleRow key={a.id} article={a} />
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}

          <p className="page-cta mt-5">
            Building something similar? <Link href="/contact">Get in touch →</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
