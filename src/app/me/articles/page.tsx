import Link from "next/link";
import ArticleList from "@/components/me/content/ArticleList";
import NewArticleButton from "@/components/me/content/NewArticleButton";
import MePageHeader from "@/components/me/MePageHeader";
import { getMyArticles } from "@/features/content/article-actions";

const TABS = [
  { value: "", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default async function MyArticlesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "", q = "" } = await searchParams;
  const { items, counts } = await getMyArticles({ status: status || undefined, q: q || undefined });
  const total = Object.values(counts).reduce((s, n) => s + (n ?? 0), 0);
  const href = (value: string) => `/me/articles?${new URLSearchParams({ ...(value ? { status: value } : {}), ...(q ? { q } : {}) }).toString()}`;

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
        <MePageHeader title="Articles" description="Draft, edit, and publish your writing. Only published articles appear on your public site." />
        <NewArticleButton />
      </div>

      <div className="card rounded shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div className="btn-group btn-group-sm" role="group" aria-label="Filter by status">
              {TABS.map((t) => (
                <Link key={t.value} href={href(t.value)} className={`btn ${status === t.value ? "btn-primary" : "btn-outline-primary"}`} aria-current={status === t.value ? "true" : undefined}>
                  {t.label}
                  <span className="ms-1 opacity-75">{t.value ? counts[t.value as "draft" | "published" | "archived"] ?? 0 : total}</span>
                </Link>
              ))}
            </div>
            <form action="/me/articles" className="d-flex gap-2" role="search">
              {status && <input type="hidden" name="status" value={status} />}
              <input name="q" className="form-control form-control-sm" style={{ width: 220 }} placeholder="Search articles…" aria-label="Search articles" defaultValue={q} />
              <button className="btn btn-sm btn-outline-primary" type="submit">Search</button>
            </form>
          </div>
          <ArticleList items={items} filtered={!!status || !!q} />
        </div>
      </div>
    </div>
  );
}
