"use client";

import { useState, useTransition } from "react";
import { FiDownload, FiFileText, FiTrash2 } from "react-icons/fi";
import { attachDocument, removeDocument, updateDocument, type ApplicationDocumentDto } from "@/features/career/document-actions";
import { getDocumentDownloadUrl } from "@/features/media/actions";
import { formatBytes } from "@/features/media/rules";
import UploadDropzone from "@/components/me/media/UploadDropzone";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/shared/ToastProvider";
import type { DocumentType } from "@/db/schema/media";

const TYPE_LABEL: Record<DocumentType, string> = { cv: "CV / Resume", cover_letter: "Cover letter", offer: "Offer", other: "Other" };
const TYPES = Object.keys(TYPE_LABEL) as DocumentType[];
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function DocumentsCard({ applicationId, documents, storageConfigured }: { applicationId: string; documents: ApplicationDocumentDto[]; storageConfigured: boolean }) {
  const [type, setType] = useState<DocumentType>("cv");
  const [target, setTarget] = useState<ApplicationDocumentDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const attach = (mediaId: string) =>
    startTransition(async () => {
      const result = await attachDocument({ applicationId, mediaId, type });
      if (!result.ok) toast.error(result.error);
    });

  const download = (doc: ApplicationDocumentDto) =>
    startTransition(async () => {
      const result = await getDocumentDownloadUrl(doc.mediaId);
      if (!result.ok) return toast.error(result.error);
      window.open(result.data.url, "_blank", "noopener");
    });

  const changeType = (doc: ApplicationDocumentDto, next: DocumentType) =>
    startTransition(async () => {
      const result = await updateDocument({ id: doc.id, type: next, note: doc.note });
      if (!result.ok) toast.error(result.error);
    });

  const confirmDelete = () => {
    if (!target) return;
    const doc = target;
    startTransition(async () => {
      const result = await removeDocument(doc.id);
      setTarget(null);
      if (!result.ok) return toast.error(result.error);
      toast.success(`Deleted ${doc.name}`);
    });
  };

  return (
    <div className="card rounded shadow-sm mb-3">
      <div className="card-body">
        <h6 className="mb-3">Documents</h6>
        {documents.length === 0 ? (
          <p className="text-muted small">Attach the CV version you sent, your cover letter or the offer. Files are private.</p>
        ) : (
          <ul className="list-unstyled mb-3">
            {documents.map((d) => (
              <li key={d.id} className="d-flex align-items-center gap-2 py-2 border-top">
                <FiFileText className="text-muted flex-shrink-0" aria-hidden />
                <div className="flex-grow-1 min-w-0">
                  <div className="text-truncate" title={d.name}>{d.name}</div>
                  <div className="text-muted small">{formatBytes(d.sizeBytes)} · {fmtDate(d.createdAt)}</div>
                </div>
                <select className="form-select form-select-sm" style={{ width: 130 }} aria-label={`Type of ${d.name}`} value={d.type} disabled={isPending} onChange={(e) => changeType(d, e.target.value as DocumentType)}>
                  {TYPES.map((t) => (<option key={t} value={t}>{TYPE_LABEL[t]}</option>))}
                </select>
                <button type="button" className="btn btn-sm btn-outline-primary" aria-label={`Download ${d.name}`} disabled={isPending} onClick={() => download(d)}><FiDownload /></button>
                <button type="button" className="btn btn-sm btn-outline-danger" aria-label={`Delete ${d.name}`} onClick={() => setTarget(d)}><FiTrash2 /></button>
              </li>
            ))}
          </ul>
        )}

        {storageConfigured ? (
          <>
            <div className="d-flex align-items-center gap-2 mb-2">
              <label className="small text-muted mb-0" htmlFor="doc-type">Attach as</label>
              <select id="doc-type" className="form-select form-select-sm" style={{ width: 150 }} value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
                {TYPES.map((t) => (<option key={t} value={t}>{TYPE_LABEL[t]}</option>))}
              </select>
            </div>
            <UploadDropzone purpose="document" accept="document" compact label="Upload a document" onUploaded={(m) => attach(m.id)} />
          </>
        ) : (
          <p className="text-muted small mb-0">File storage is not set up yet — the Media page lists the two values to add.</p>
        )}
      </div>
      {target && <ConfirmDialog title="Delete document?" message={`"${target.name}" will be permanently deleted. This cannot be undone.`} isPending={isPending} onConfirm={confirmDelete} onCancel={() => setTarget(null)} />}
    </div>
  );
}
