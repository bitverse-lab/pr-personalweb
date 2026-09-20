"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiCopy, FiDownload, FiFileText, FiImage, FiTrash2 } from "react-icons/fi";
import { deleteMedia, getDocumentDownloadUrl, getMediaReferences } from "@/features/media/actions";
import { STORAGE_SOFT_LIMIT_BYTES, formatBytes } from "@/features/media/rules";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import UploadDropzone from "./UploadDropzone";
import type { MediaDto } from "@/server/services/media-service";

type Filter = "all" | "image" | "document";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function MediaLibrary({ items, usage }: { items: MediaDto[]; usage: { bytes: number; count: number } }) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [target, setTarget] = useState<{ media: MediaDto; refs: string | null } | null>(null);
  const [isPending, startTransition] = useTransition();

  const shown = useMemo(() => items.filter((m) => filter === "all" || m.kind === filter), [items, filter]);
  const pct = Math.min(100, Math.round((usage.bytes / STORAGE_SOFT_LIMIT_BYTES) * 100));

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const download = (m: MediaDto) =>
    startTransition(async () => {
      const result = await getDocumentDownloadUrl(m.id);
      if (!result.ok) return toast.error(result.error);
      window.open(result.data.url, "_blank", "noopener");
    });

  const askDelete = (m: MediaDto) =>
    startTransition(async () => {
      const refs = await getMediaReferences(m.id);
      const parts: string[] = [];
      if (refs?.articles) parts.push(`${refs.articles} article${refs.articles === 1 ? "" : "s"}`);
      if (refs?.journal) parts.push(`${refs.journal} journal entr${refs.journal === 1 ? "y" : "ies"}`);
      if (refs?.projects) parts.push(`${refs.projects} project${refs.projects === 1 ? "" : "s"}`);
      if (refs?.profile) parts.push("your profile photo");
      if (refs?.applications) parts.push(`${refs.applications} application${refs.applications === 1 ? "" : "s"}`);
      setTarget({ media: m, refs: parts.length ? parts.join(", ") : null });
    });

  const confirmDelete = () => {
    if (!target) return;
    const m = target.media;
    startTransition(async () => {
      const result = await deleteMedia(m.id);
      setTarget(null);
      if (!result.ok) return toast.error(result.error);
      toast.success(`Deleted ${m.name}`);
      router.refresh();
    });
  };

  return (
    <>
      <div className="card rounded shadow-sm mb-3">
        <div className="card-body">
          <UploadDropzone purpose="library" accept="any" onUploaded={() => router.refresh()} />
          <div className="mt-3">
            <div className="d-flex justify-content-between small text-muted">
              <span>{usage.count} file{usage.count === 1 ? "" : "s"}</span>
              <span>{formatBytes(usage.bytes)} of 1 GB used</span>
            </div>
            <div className="progress" style={{ height: 6 }} role="progressbar" aria-label="Storage used" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-bar" style={{ width: `${Math.max(pct, usage.bytes > 0 ? 1 : 0)}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="card rounded shadow-sm">
        <div className="card-body">
          <div className="btn-group btn-group-sm mb-3" role="group" aria-label="Filter files">
            {(["all", "image", "document"] as Filter[]).map((f) => (
              <button key={f} type="button" className={`btn ${filter === f ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : f === "image" ? "Images" : "Documents"}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <EmptyState icon={FiImage} title="No files here yet" description="Upload images to use in articles and your profile, or documents for job applications." />
          ) : (
            <div className="row g-3">
              {shown.map((m) => (
                <div className="col-6 col-md-4 col-xl-3" key={m.id}>
                  <div className="border rounded h-100 bg-white overflow-hidden d-flex flex-column">
                    {m.kind === "image" && m.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt={m.name} loading="lazy" style={{ width: "100%", height: 130, objectFit: "cover" }} />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: 130 }}>
                        <FiFileText size={36} className="text-muted" aria-hidden />
                      </div>
                    )}
                    <div className="p-2 flex-grow-1">
                      <div className="small fw-semibold text-truncate" title={m.name}>{m.name}</div>
                      <div className="text-muted small">{formatBytes(m.sizeBytes)} · {fmtDate(m.createdAt)}</div>
                      {m.kind === "document" && <span className="badge bg-soft-secondary text-secondary">Private</span>}
                    </div>
                    <div className="d-flex justify-content-end gap-1 p-2 pt-0">
                      {m.url ? (
                        <button type="button" className="btn btn-sm btn-outline-primary" aria-label={`Copy link to ${m.name}`} onClick={() => copy(m.url!)}>
                          <FiCopy />
                        </button>
                      ) : (
                        <button type="button" className="btn btn-sm btn-outline-primary" aria-label={`Download ${m.name}`} disabled={isPending} onClick={() => download(m)}>
                          <FiDownload />
                        </button>
                      )}
                      <button type="button" className="btn btn-sm btn-outline-danger" aria-label={`Delete ${m.name}`} disabled={isPending} onClick={() => askDelete(m)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {target && (
        <ConfirmDialog
          title="Delete file?"
          message={
            target.refs
              ? `"${target.media.name}" is used in ${target.refs}. Deleting it will break those places. This cannot be undone.`
              : `"${target.media.name}" will be permanently deleted. This cannot be undone.`
          }
          isPending={isPending}
          onConfirm={confirmDelete}
          onCancel={() => setTarget(null)}
        />
      )}
    </>
  );
}
