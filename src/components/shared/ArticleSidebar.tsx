import Link from "next/link";
import { FiRss } from "react-icons/fi";
import type { Article } from "@/lib/data/articles";

export default function ArticleSidebar({ articles, query = "" }: { articles: Article[]; query?: string }) {
  const recent = articles.slice(0, 3);
  const tags = Array.from(new Set(articles.flatMap((a) => a.tags))).sort((a, b) => a.localeCompare(b));

  return (
    <div className="col-lg-4 col-md-6 mt-4 pt-2">
      <div className="card bg-white p-4 rounded shadow sticky-bar">
        <div className="widget">
          <h6 className="widget-title font-weight-bold pt-2 pb-2 bg-light rounded text-center">Search</h6>
          <div id="search2" className="widget-search mt-4 mb-0">
            <form role="search" method="get" action="/articles" id="searchform2" className="searchform">
              <div>
                <input type="text" className="border rounded" name="q" id="s2" placeholder="Search Keywords..." defaultValue={query} />
                <input type="submit" id="searchsubmit2" value="Search" />
              </div>
            </form>
          </div>
        </div>

        <div className="widget mt-4 pt-2 text-center">
          <h6 className="widget-title font-weight-bold pt-2 pb-2 bg-light rounded">Follow</h6>
          <a href="/feed.xml" className="btn btn-sm btn-outline-primary mt-3 d-inline-flex align-items-center gap-1">
            <FiRss aria-hidden /> RSS feed
          </a>
        </div>

        {recent.length > 0 && (
          <div className="widget mt-4 pt-2">
            <h6 className="widget-title font-weight-bold pt-2 pb-2 bg-light rounded text-center">Recent Post</h6>
            <div className="mt-4">
              {recent.map((article) => (
                <div className="d-flex align-items-center mt-3" key={article.id}>
                  {article.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img loading="lazy" decoding="async" src={article.image} className="avatar avatar-small rounded" style={{ width: "auto" }} alt="" />
                  )}
                  <div className="flex-1 ms-3">
                    <Link href={`/articles/${article.slug}`} className="d-block widget-post-title text-dark">
                      {article.title}
                    </Link>
                    <span className="text-muted">{article.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="widget mt-4 pt-2 text-center">
            <h6 className="widget-title font-weight-bold pt-2 pb-2 bg-light rounded">Tags Cloud</h6>
            <div className="tagcloud mt-4">
              {tags.map((tag) => (
                <Link href={`/articles?tag=${encodeURIComponent(tag)}`} className="rounded" key={tag}>
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
