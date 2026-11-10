"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FiArchive, FiExternalLink, FiFileText, FiRotateCcw, FiTrash2 } from "react-icons/fi";
import { deleteArticle, restoreArticle, setArticleStatus } from "@/features/content/article-actions";
import { readingMinutes } from "@/features/content/richtext";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import ArticleStatusBadge from "./ArticleStatusBadge";
import type { ArticleListItem } from "@/server/services/article-service";
import AnimatedList from "@/components/shared/AnimatedList";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function ArticleList({ items, filtered }: { items: ArticleListItem[]; filtered: boolean }) {
  const [target, setTarget] = useState<ArticleListItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const confirmDelete = () => {
    if (!target) return;
    const article = target;
    startTransition(async () => {
      const result = await deleteArticle(article.id);
      setTarget(null);
      if (!result.ok) return toast.error(result.error);
      const snapshot = result.data;
      toast.success("Article deleted", {
        action: { label: "Undo", onClick: () => void restoreArticle(snapshot).then((r) => (r.ok ? toast.success("Article restored") : toast.error(r.error))) },
      });
    });
  };

  const changeStatus = (article: ArticleListItem, status: "draft" | "archived") =>
    startTransition(async () => {
      const result = await setArticleStatus({ id: article.id, status });
      if (!result.ok) return toast.error(result.error);
      toast.success(status === "archived" ? "Article archived" : "Moved back to drafts");
    });

  if (items.length === 0) {
    return (
      <EmptyState
        icon={FiFileText}
        title={filtered ? "No articles match" : "No articles yet"}
        description={filtered ? "Try a different filter or search term." : "Start a draft — it stays private until you publish it."}
      />
    );
  }

  return (
    <>
      <AnimatedList as="ul" className="list-unstyled mb-0">
        {items.map((a) => (
          <li key={a.id} className="d-flex align-items-center gap-2 py-3 border-top">
            {a.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.coverUrl} alt="" className="art-row-cover d-none d-sm-block" loading="lazy" />
            ) : (
              <span className="art-row-cover d-none d-sm-flex align-items-center justify-content-center text-primary" aria-hidden>
                <FiFileText />
              </span>
            )}
            <Link href={`/me/articles/${a.id}`} className="flex-grow-1 text-decoration-none text-dark min-w-0">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <strong className="text-truncate">{a.title || "Untitled"}</strong>
                <ArticleStatusBadge status={a.status} />
              </div>
              {a.excerpt && <div className="text-muted small text-truncate">{a.excerpt}</div>}
              <div className="text-muted small">
                {a.status === "published" && a.publishedAt ? `Published ${fmt(a.publishedAt)}` : `Edited ${fmt(a.updatedAt)}`}
                {" · "}
                {a.wordCount} words · {readingMinutes(a.wordCount)} min read
                {a.tags.map((t) => (
                  <span key={t} className="task-tag ms-2">#{t.toLowerCase()}</span>
                ))}
              </div>
            </Link>
            <div className="text-nowrap">
              {a.status === "published" && (
                <Link href={`/articles/${a.slug}`} target="_blank" className="btn btn-sm btn-outline-primary border-0" aria-label={`View ${a.title} on the site`}>
                  <FiExternalLink />
                </Link>
              )}
              {a.status === "archived" ? (
                <button type="button" className="btn btn-sm btn-outline-primary border-0" aria-label={`Restore ${a.title} to drafts`} disabled={isPending} onClick={() => changeStatus(a, "draft")}>
                  <FiRotateCcw />
                </button>
              ) : (
                <button type="button" className="btn btn-sm btn-outline-secondary border-0" aria-label={`Archive ${a.title}`} disabled={isPending} onClick={() => changeStatus(a, "archived")}>
                  <FiArchive />
                </button>
              )}
              <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Delete ${a.title}`} onClick={() => setTarget(a)}>
                <FiTrash2 />
              </button>
            </div>
          </li>
        ))}
      </AnimatedList>
      {target && (
        <ConfirmDialog
          title="Delete article?"
          message={`"${target.title || "Untitled"}" will be deleted${target.status === "published" ? " and removed from your public site" : ""}. You can undo right after.`}
          isPending={isPending}
          onConfirm={confirmDelete}
          onCancel={() => setTarget(null)}
        />
      )}
    </>
  );
}
