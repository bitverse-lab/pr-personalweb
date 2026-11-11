"use client";

import { useRef, useState, useTransition } from "react";
import { FiExternalLink, FiTrash2, FiUpload } from "react-icons/fi";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/shared/ToastProvider";
import { removeCvFile, setCvFile } from "@/features/cv/actions";
import { formatBytes } from "@/features/media/rules";
import { ROLES } from "@/features/roles/roles";
import { useUpload } from "@/hooks/useUpload";
import type { CvFileDto } from "@/server/services/cv-file-service";

const updated = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * One PDF per kind of job. Visitors download it from /cv, and from /for/<role> they get the one for
 * that role directly. Files stay private in storage; the site hands out short-lived links.
 */
export default function CvFilesSection({ files }: { files: CvFileDto[] }) {
  const { upload, uploading, progress, error, clearError } = useUpload("document");
  const [target, setTarget] = useState<string | null>(null);
  const [removing, setRemoving] = useState<CvFileDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const byRole = new Map(files.map((f) => [f.role, f]));

  const pick = (role: string) => {
    clearError();
    setTarget(role);
    input.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // picking the same file again still fires
    if (!file || !target) return;
    if (file.type !== "application/pdf") return toast.error("A CV must be a PDF file");
    const media = await upload(file);
    if (!media) return;
    startTransition(async () => {
      const r = await setCvFile({ role: target, mediaId: media.id });
      if (!r.ok) return toast.error(r.error);
      toast.success("CV saved");
      setTarget(null);
    });
  };

  const confirmRemove = () => {
    if (!removing) return;
    const role = removing.role;
    startTransition(async () => {
      const r = await removeCvFile({ role });
      setRemoving(null);
      if (!r.ok) return toast.error(r.error);
      toast.success("CV removed");
    });
  };

  return (
    <div className="card rounded shadow-sm">
      <div className="card-body">
        <h6 className="mb-1">CV files</h6>
        <p className="text-muted small mb-3">
          Upload a PDF for each kind of job you apply for. Visitors download them on <code>/cv</code>, and a <code>/for/&lt;role&gt;</code> link
          gives the matching one. Anyone can download these, so leave out what should stay private, such as your phone number or home address.
        </p>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <input ref={input} type="file" accept="application/pdf" className="d-none" onChange={onFile} aria-hidden tabIndex={-1} />
        <ul className="list-unstyled mb-0">
          {ROLES.map((r) => {
            const f = byRole.get(r.slug);
            const busy = (uploading || isPending) && target === r.slug;
            return (
              <li key={r.slug} className="d-flex flex-wrap align-items-center gap-2 py-2 border-top">
                <div className="flex-grow-1 min-w-0">
                  <strong>{r.title}</strong>
                  <div className="text-muted small text-truncate">
                    {f ? `${f.fileName} · ${formatBytes(f.sizeBytes)} · updated ${updated(f.updatedAt)}` : <>No CV · <code>/for/{r.slug}</code></>}
                  </div>
                </div>
                <div className="text-nowrap d-flex gap-1">
                  {busy ? (
                    <span className="small text-muted" role="status">{uploading ? `Uploading ${progress}%` : "Saving…"}</span>
                  ) : (
                    <>
                      {f && (
                        <a className="btn btn-sm btn-outline-primary border-0" href={`/cv/download/${r.slug}?view=1`} target="_blank" rel="noopener noreferrer" aria-label={`View the ${r.title} CV`}>
                          <FiExternalLink />
                        </a>
                      )}
                      <button type="button" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1" onClick={() => pick(r.slug)} disabled={uploading || isPending}>
                        <FiUpload aria-hidden /> {f ? "Replace" : "Upload PDF"}
                      </button>
                      {f && (
                        <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Remove the ${r.title} CV`} onClick={() => setRemoving(f)} disabled={uploading || isPending}>
                          <FiTrash2 />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {removing && (
        <ConfirmDialog
          title="Remove CV?"
          message={`The ${removing.title} CV (${removing.fileName}) will be deleted, and visitors can no longer download it.`}
          confirmLabel="Remove"
          isPending={isPending}
          onConfirm={confirmRemove}
          onCancel={() => setRemoving(null)}
        />
      )}
    </div>
  );
}
