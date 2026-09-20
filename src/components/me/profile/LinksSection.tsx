"use client";

import { useState, useTransition } from "react";
import { FiEdit2, FiLink, FiPlus, FiTrash2 } from "react-icons/fi";
import { createLink, deleteLink, reorderItems, updateLink, type ProfileData } from "@/features/profile/actions";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { MoveButtons, moveItem } from "./shared";

type LinkItem = ProfileData["links"][number];

function LinkDialog({ item, onClose }: { item?: LinkItem; onClose: () => void }) {
  const panelRef = useDialogA11y<HTMLDivElement>(onClose);
  const [label, setLabel] = useState(item?.label ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const data = { label, url };
      const result = item ? await updateLink({ id: item.id, data }) : await createLink(data);
      if (!result.ok) return setError(result.error);
      toast.success(item ? "Link updated" : "Link added");
      onClose();
    });
  };

  return (
    <div role="presentation" className="me-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className="me-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="link-title" onClick={(e) => e.stopPropagation()}>
        <h6 id="link-title" className="mb-3">{item ? "Edit link" : "Add link"}</h6>
        <form onSubmit={submit}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <div className="mb-2"><label className="form-label small mb-1" htmlFor="l-label">Label</label><input id="l-label" className="form-control" maxLength={40} placeholder="e.g. LinkedIn" value={label} onChange={(e) => setLabel(e.target.value)} required autoFocus /></div>
          <div className="mb-3"><label className="form-label small mb-1" htmlFor="l-url">URL</label><input id="l-url" className="form-control" maxLength={500} placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} required /></div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !label.trim() || !url.trim()}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LinksSection({ items }: { items: LinkItem[] }) {
  const [list, setList] = useState(items);
  const [editing, setEditing] = useState<LinkItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<LinkItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const ids = JSON.stringify(items);
  const [seen, setSeen] = useState(ids);
  if (seen !== ids) {
    setSeen(ids);
    setList(items);
  }

  const move = (index: number, delta: -1 | 1) => {
    const next = moveItem(list, index, delta);
    setList(next);
    startTransition(async () => {
      const r = await reorderItems({ kind: "links", ids: next.map((i) => i.id) });
      if (!r.ok) toast.error(r.error);
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const it = deleting;
    startTransition(async () => {
      const r = await deleteLink(it.id);
      setDeleting(null);
      if (!r.ok) return toast.error(r.error);
      toast.success("Link deleted", { action: { label: "Undo", onClick: () => void createLink({ label: it.label, url: it.url }).then((x) => (x.ok ? toast.success("Restored") : toast.error(x.error))) } });
    });
  };

  return (
    <div className="card rounded shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Links</h6>
          <button type="button" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" onClick={() => setEditing("new")}><FiPlus /> Add</button>
        </div>
        {list.length === 0 ? (
          <EmptyState icon={FiLink} title="No links yet" description="Add LinkedIn, GitHub, your portfolio… They show on your CV." />
        ) : (
          <ul className="list-unstyled mb-0">
            {list.map((l, i) => (
              <li key={l.id} className="d-flex align-items-center gap-2 py-2 border-top">
                <div className="flex-grow-1 min-w-0">
                  <strong>{l.label}</strong>
                  <div className="text-muted small text-truncate">{l.url}</div>
                </div>
                <div className="text-nowrap">
                  <MoveButtons index={i} count={list.length} onMove={(d) => move(i, d)} />
                  <button type="button" className="btn btn-sm btn-outline-primary border-0" aria-label={`Edit ${l.label}`} onClick={() => setEditing(l)}><FiEdit2 /></button>
                  <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Delete ${l.label}`} onClick={() => setDeleting(l)}><FiTrash2 /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {editing && <LinkDialog item={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDialog title="Delete link?" message={`"${deleting.label}" will be removed. You can undo right after.`} isPending={isPending} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
