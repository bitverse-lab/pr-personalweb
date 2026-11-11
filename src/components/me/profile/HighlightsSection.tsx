"use client";

import { useState, useTransition } from "react";
import { FiAward, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { createHighlight, deleteHighlight, reorderItems, updateHighlight, type ProfileData } from "@/features/profile/actions";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DialogShell from "@/components/shared/DialogShell";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { MoveButtons, moveItem } from "./shared";
import { trValue } from "@/components/me/LangTabs";

type Highlight = ProfileData["highlights"][number];

function HighlightDialog({ item, onClose }: { item?: Highlight; onClose: () => void }) {
  const [metric, setMetric] = useState(item?.metric ?? "");
  const [value, setValue] = useState(item?.value ?? "");
  const [note, setNote] = useState(item?.note ?? "");
  // One short field: the Indonesian sits right under the English instead of behind a tab.
  const [noteId, setNoteId] = useState(trValue(item?.translations.id?.note));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const data = { metric, value, note, translations: { id: { note: noteId } } };
      const result = item ? await updateHighlight({ id: item.id, data }) : await createHighlight(data);
      if (!result.ok) return setError(result.error);
      toast.success(item ? "Highlight updated" : "Highlight added");
      onClose();
    });
  };

  return (
    <DialogShell title={item ? "Edit highlight" : "Add highlight"} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <div className="mb-2">
          <label className="form-label small mb-1" htmlFor="h-metric">Key</label>
          <input id="h-metric" className="form-control font-mono" maxLength={40} placeholder="gpa" value={metric} onChange={(e) => setMetric(e.target.value.toLowerCase().replace(/\s+/g, "_"))} required autoFocus aria-describedby="h-metric-help" />
          <div id="h-metric-help" className="form-text">Shown like a column name in your home page console, e.g. gpa, ip_rights, team_led.</div>
        </div>
        <div className="mb-2">
          <label className="form-label small mb-1" htmlFor="h-value">Value</label>
          <input id="h-value" className="form-control" maxLength={60} placeholder="3.92 /4.00" value={value} onChange={(e) => setValue(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label small mb-1" htmlFor="h-note">What it means (opt.)</label>
          <input id="h-note" className="form-control" maxLength={140} placeholder="Summa Cum Laude, Telkom University" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label small mb-1" htmlFor="h-note-id">What it means, in Indonesian (opt.)</label>
          <input id="h-note-id" lang="id" className="form-control" maxLength={140} placeholder={note} value={noteId} onChange={(e) => setNoteId(e.target.value)} aria-describedby="h-note-id-help" />
          <div id="h-note-id-help" className="form-text">Shown on the Indonesian CV (/id/cv). Empty shows the English.</div>
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !metric.trim() || !value.trim()}>Save</button>
        </div>
      </form>
    </DialogShell>
  );
}

export default function HighlightsSection({ items }: { items: Highlight[] }) {
  const [list, setList] = useState(items);
  const [editing, setEditing] = useState<Highlight | "new" | null>(null);
  const [deleting, setDeleting] = useState<Highlight | null>(null);
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
      const r = await reorderItems({ kind: "highlights", ids: next.map((i) => i.id) });
      if (!r.ok) toast.error(r.error);
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const it = deleting;
    startTransition(async () => {
      const r = await deleteHighlight(it.id);
      setDeleting(null);
      if (!r.ok) return toast.error(r.error);
      toast.success("Highlight deleted", { action: { label: "Undo", onClick: () => void createHighlight({ metric: it.metric, value: it.value, note: it.note ?? "", translations: it.translations }).then((x) => (x.ok ? toast.success("Restored") : toast.error(x.error))) } });
    });
  };

  return (
    <div className="card rounded shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Highlights</h6>
          <button type="button" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" onClick={() => setEditing("new")}><FiPlus /> Add</button>
        </div>
        {list.length === 0 ? (
          <EmptyState icon={FiAward} title="No highlights yet" description="Your strongest proof points, e.g. GPA, registered IP, publications. They are the first thing visitors see on your home page, and appear on your CV." />
        ) : (
          <ul className="list-unstyled mb-0">
            {list.map((h, i) => (
              <li key={h.id} className="d-flex align-items-center gap-2 py-2 border-top">
                <div className="flex-grow-1 min-w-0 small">
                  <span className="font-mono text-muted me-2">{h.metric}</span>
                  <strong>{h.value}</strong>
                  {h.note && <span className="text-muted"> · {h.note}</span>}
                </div>
                <div className="text-nowrap">
                  <MoveButtons index={i} count={list.length} onMove={(d) => move(i, d)} />
                  <button type="button" className="btn btn-sm btn-outline-primary border-0" aria-label={`Edit ${h.metric}`} onClick={() => setEditing(h)}><FiEdit2 /></button>
                  <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Delete ${h.metric}`} onClick={() => setDeleting(h)}><FiTrash2 /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {editing && <HighlightDialog item={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDialog title="Delete highlight?" message={`"${deleting.metric}" will be removed. You can undo right after.`} isPending={isPending} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
