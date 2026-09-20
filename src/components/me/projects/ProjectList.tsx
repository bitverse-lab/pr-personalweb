"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FiArchive, FiArrowDown, FiArrowUp, FiExternalLink, FiFolder, FiRotateCcw, FiStar, FiTrash2 } from "react-icons/fi";
import { deleteProject, reorderProjects, restoreProject, setProjectFeatured, setProjectStatus } from "@/features/projects/actions";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import ArticleStatusBadge from "@/components/me/content/ArticleStatusBadge";
import type { ProjectListItem } from "@/server/services/project-service";

export default function ProjectList({ items, filtered }: { items: ProjectListItem[]; filtered: boolean }) {
  const [list, setList] = useState(items);
  const [target, setTarget] = useState<ProjectListItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  // follow the server after revalidation
  const key = JSON.stringify(items);
  const [seen, setSeen] = useState(key);
  if (seen !== key) {
    setSeen(key);
    setList(items);
  }

  const move = (index: number, delta: -1 | 1) => {
    const j = index + delta;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[index], next[j]] = [next[j], next[index]];
    setList(next);
    startTransition(async () => {
      const r = await reorderProjects({ ids: next.map((p) => p.id) });
      if (!r.ok) toast.error(r.error);
    });
  };

  const toggleFeatured = (p: ProjectListItem) =>
    startTransition(async () => {
      const r = await setProjectFeatured({ id: p.id, featured: !p.featured });
      if (!r.ok) toast.error(r.error);
    });

  const changeStatus = (p: ProjectListItem, status: "draft" | "archived") =>
    startTransition(async () => {
      const r = await setProjectStatus({ id: p.id, status });
      if (!r.ok) return toast.error(r.error);
      toast.success(status === "archived" ? "Project archived" : "Moved back to drafts");
    });

  const confirmDelete = () => {
    if (!target) return;
    const p = target;
    startTransition(async () => {
      const r = await deleteProject(p.id);
      setTarget(null);
      if (!r.ok) return toast.error(r.error);
      const snapshot = r.data;
      toast.success("Project deleted", { action: { label: "Undo", onClick: () => void restoreProject(snapshot).then((x) => (x.ok ? toast.success("Project restored") : toast.error(x.error))) } });
    });
  };

  if (list.length === 0) {
    return (
      <EmptyState
        icon={FiFolder}
        title={filtered ? "No projects match" : "No projects yet"}
        description={filtered ? "Try a different filter or search term." : "Add your first project — it stays private until you publish it."}
      />
    );
  }

  return (
    <>
      <ul className="list-unstyled mb-0">
        {list.map((p, i) => (
          <li key={p.id} className="d-flex align-items-center gap-3 py-3 border-top">
            <Link href={`/me/projects/${p.id}`} className="flex-shrink-0" aria-label={`Edit ${p.title || "untitled project"}`}>
              {p.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverUrl} alt="" style={{ width: 84, height: 60, objectFit: "cover", borderRadius: 6 }} />
              ) : (
                <div className="bg-light d-flex align-items-center justify-content-center" style={{ width: 84, height: 60, borderRadius: 6 }}>
                  <FiFolder className="text-muted" aria-hidden />
                </div>
              )}
            </Link>
            <Link href={`/me/projects/${p.id}`} className="flex-grow-1 text-decoration-none text-dark min-w-0">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <strong className="text-truncate">{p.title || "Untitled project"}</strong>
                <ArticleStatusBadge status={p.status} />
                {p.category && <span className="badge bg-light text-dark">{p.category}</span>}
              </div>
              {p.summary && <div className="text-muted small text-truncate">{p.summary}</div>}
              {p.technologies.length > 0 && <div className="text-muted small text-truncate">{p.technologies.join(" · ")}</div>}
            </Link>
            <div className="text-nowrap">
              <button type="button" className="btn btn-sm border-0 p-1" aria-label={p.featured ? `Unfeature ${p.title}` : `Feature ${p.title}`} aria-pressed={p.featured} title="Feature on home page" disabled={isPending} onClick={() => toggleFeatured(p)}>
                <FiStar className={p.featured ? "text-warning" : "text-muted"} fill={p.featured ? "currentColor" : "none"} />
              </button>
              {!filtered && (
                <>
                  <button type="button" className="btn btn-sm border-0 p-1" aria-label="Move up" disabled={i === 0 || isPending} onClick={() => move(i, -1)}><FiArrowUp /></button>
                  <button type="button" className="btn btn-sm border-0 p-1" aria-label="Move down" disabled={i === list.length - 1 || isPending} onClick={() => move(i, 1)}><FiArrowDown /></button>
                </>
              )}
              {p.status === "published" && (
                <Link href={`/projects/${p.slug}`} target="_blank" className="btn btn-sm btn-outline-primary border-0" aria-label={`View ${p.title} on the site`}><FiExternalLink /></Link>
              )}
              {p.status === "archived" ? (
                <button type="button" className="btn btn-sm btn-outline-primary border-0" aria-label={`Restore ${p.title} to drafts`} disabled={isPending} onClick={() => changeStatus(p, "draft")}><FiRotateCcw /></button>
              ) : (
                <button type="button" className="btn btn-sm btn-outline-secondary border-0" aria-label={`Archive ${p.title}`} disabled={isPending} onClick={() => changeStatus(p, "archived")}><FiArchive /></button>
              )}
              <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Delete ${p.title}`} onClick={() => setTarget(p)}><FiTrash2 /></button>
            </div>
          </li>
        ))}
      </ul>
      {target && (
        <ConfirmDialog
          title="Delete project?"
          message={`"${target.title || "Untitled project"}" will be deleted${target.status === "published" ? " and removed from your public site" : ""}. You can undo right after.`}
          isPending={isPending}
          onConfirm={confirmDelete}
          onCancel={() => setTarget(null)}
        />
      )}
    </>
  );
}
