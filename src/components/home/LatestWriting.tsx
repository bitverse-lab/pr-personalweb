import Link from "next/link";
import CoverBlock from "@/components/shared/CoverBlock";
import type { Article } from "@/lib/data/articles";
import { vt } from "@/lib/view-transition";

/** Articles option B in miniature: the newest piece large, the next two as an "Earlier" list. */
export default function LatestWriting({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  const [latest, ...earlier] = articles;
  return (
    <section className="section latest-writing" aria-labelledby="writing-title">
      <div className="container">
        <h2 id="writing-title" className="selected-work-title">Latest writing</h2>
        <div className="writing-grid">
          <article className="writing-latest">
            <Link href={`/articles/${latest.slug}`} className="writing-latest-link" data-vt>
              <CoverBlock src={latest.image} title={latest.title} ratio="16/10" vtStyle={vt("acover", latest.slug)} />
              <p className="mono-meta mt-3 mb-1">Latest · {latest.date} · {latest.readMinutes} min</p>
              <h3 className="writing-latest-title" style={vt("atitle", latest.slug)}>{latest.title}</h3>
              {latest.excerpt && <p className="writing-excerpt">{latest.excerpt}</p>}
            </Link>
          </article>
          {earlier.length > 0 && (
            <div className="writing-earlier">
              <p className="mono-meta mb-2">Earlier</p>
              <ul className="list-unstyled mb-0">
                {earlier.map((a) => (
                  <li key={a.id} className="writing-earlier-item">
                    <Link href={`/articles/${a.slug}`} className="writing-earlier-link" data-vt style={vt("atitle", a.slug)}>{a.title}</Link>
                    <p className="mono-meta mb-0 mt-1">{a.date}{a.tag ? ` · ${a.tag.toLowerCase()}` : ""}</p>
                  </li>
                ))}
              </ul>
              <Link href="/articles" className="writing-all">All writing <span className="link-arrow" aria-hidden="true">→</span></Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
