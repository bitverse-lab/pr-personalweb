import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ArticleListSkeleton from "@/components/shared/ArticleListSkeleton";
import CoverBlock from "@/components/shared/CoverBlock";
import { getArticles, type Article } from "@/lib/data/articles";
import { vt } from "@/lib/view-transition";
import { dict, type Dict } from "@/lib/i18n/dict";
import { languages, localize, type Locale } from "@/lib/i18n/locale";
import { localizeArticle } from "@/lib/i18n/content";

export function articlesMetadata(locale: Locale): Metadata {
  const t = dict(locale).meta;
  return { title: t.writingTitle, description: t.writingDescription, alternates: { canonical: localize(locale, "/articles"), languages: languages("/articles") } };
}

type ArticlesPageProps = { searchParams: Promise<{ q?: string; tag?: string }>; locale: Locale };

export function ArticlesPage({ searchParams, locale }: ArticlesPageProps) {
  return (
    <>
      <PersonalNavbar />
      <Suspense fallback={<ArticleListSkeleton />}>
        <ArticlesContent searchParams={searchParams} locale={locale} />
      </Suspense>
      <SmallFooter />
    </>
  );
}

function ArticleRow({ article, locale, t }: { article: Article; locale: Locale; t: Dict["writing"] }) {
  return (
    <li className="log-row">
      <p className="mono-meta mb-0 log-date">{article.date}</p>
      <div>
        <Link href={localize(locale, `/articles/${article.slug}`)} className="log-title">{article.title}</Link>
        {article.excerpt && <p className="log-excerpt">{article.excerpt}</p>}
      </div>
      <p className="mono-meta mb-0 log-time">{article.readMinutes} {t.min}</p>
    </li>
  );
}

async function ArticlesContent({ searchParams, locale }: ArticlesPageProps) {
  const t = dict(locale).writing;
  const base = localize(locale, "/articles");
  const { q = "", tag = "" } = await searchParams;
  const all = (await getArticles()).map((a) => localizeArticle(a, locale));

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
          <h1 className="page-head-title">{t.pageTitle}</h1>
          <p className="path-label mt-3 mb-0">~/writing · {t.articles(all.length)}</p>
          <form className="writing-search" method="get" action={base} role="search">
            <input type="search" name="q" className="form-control" placeholder={t.searchPlaceholder} defaultValue={q} aria-label={t.searchAria} />
            {tag && <input type="hidden" name="tag" value={tag} />}
            <button type="submit" className="btn btn-primary">{t.search}</button>
          </form>
          {tags.length > 0 && (
            <nav className="layer-filter" aria-label={t.filterAria}>
              <Link href={base} className={`layer-chip ${!tag ? "layer-chip--active" : ""}`} aria-current={!tag ? "page" : undefined}>{t.allChip}</Link>
              {tags.map((tg) => (
                <Link key={tg} href={`${base}?tag=${encodeURIComponent(tg)}`} className={`layer-chip ${tag.toLowerCase() === tg.toLowerCase() ? "layer-chip--active" : ""}`} aria-current={tag.toLowerCase() === tg.toLowerCase() ? "page" : undefined}>
                  {tg.toLowerCase()}
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
              {t.results(articles.length)}
              {tag && <> · {t.tag} {tag.toLowerCase()}</>}
              {needle && <> · “{q}”</>} · <Link href={base}>{t.clear}</Link>
            </p>
          )}

          {articles.length === 0 ? (
            <div className="py-4">
              <h2 className="h5 mb-2">{filtered ? t.noMatch : t.empty}</h2>
              <p className="text-muted mb-0">{filtered ? t.noMatchBody : t.emptyBody}</p>
            </div>
          ) : (
            <>
              {!filtered && latest && (
                <div className="writing-grid">
                  <article className="writing-latest" data-latest>
                    <Link href={localize(locale, `/articles/${latest.slug}`)} className="writing-latest-link" data-vt>
                      <CoverBlock src={latest.image} title={latest.title} ratio="16/10" vtStyle={vt("acover", latest.slug)} />
                      <p className="mono-meta mt-3 mb-1">{t.latest} · {latest.date} · {latest.readMinutes} {t.min}</p>
                      <h2 className="writing-latest-title" style={vt("atitle", latest.slug)}>{latest.title}</h2>
                      {latest.excerpt && <p className="writing-excerpt">{latest.excerpt}</p>}
                    </Link>
                  </article>
                  {earlier.length > 0 && (
                    <div className="writing-earlier">
                      <h2 className="mono-meta writing-earlier-head mb-2">{t.earlier}</h2>
                      <ul className="list-unstyled mb-0">
                        {earlier.map((a) => (
                          <li key={a.id} className="writing-earlier-item">
                            <Link href={localize(locale, `/articles/${a.slug}`)} className="writing-earlier-link" data-vt style={vt("atitle", a.slug)}>{a.title}</Link>
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
                  {!filtered && <h2 className="selected-work-title">{t.archive}</h2>}
                  <ol className="log list-unstyled mb-0">
                    {archive.map((a) => (
                      <ArticleRow key={a.id} article={a} locale={locale} t={t} />
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}

          <p className="page-cta mt-5">
            {t.cta} <Link href={localize(locale, "/contact")}>{t.ctaLink}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
