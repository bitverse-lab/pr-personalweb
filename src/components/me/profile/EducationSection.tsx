"use client";

import { useState, useTransition } from "react";
import { FiBookOpen, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { createEducation, deleteEducation, reorderItems, updateEducation, type ProfileData } from "@/features/profile/actions";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { MoveButtons, fmtMonth, monthToDate, monthValue, moveItem } from "./shared";

type Education = ProfileData["educations"][number];

function EducationDialog({ item, onClose }: { item?: Education; onClose: () => void }) {
  const panelRef = useDialogA11y<HTMLDivElement>(onClose);
  const [f, setF] = useState({
    school: item?.school ?? "",
    degree: item?.degree ?? "",
    field: item?.field ?? "",
    start: monthValue(item?.startDate ?? null),
    end: monthValue(item?.endDate ?? null),
    description: item?.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((c) => ({ ...c, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const data = { school: f.school, degree: f.degree, field: f.field, startDate: monthToDate(f.start), endDate: monthToDate(f.end), description: f.description };
    startTransition(async () => {
      const result = item ? await updateEducation({ id: item.id, data }) : await createEducation(data);
      if (!result.ok) return setError(result.error);
      toast.success(item ? "Education updated" : "Education added");
      onClose();
    });
  };

  return (
    <div role="presentation" className="me-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className="me-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="edu-title" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <h6 id="edu-title" className="mb-3">{item ? "Edit education" : "Add education"}</h6>
        <form onSubmit={submit}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <div className="row g-2">
            <div className="col-12"><label className="form-label small mb-1" htmlFor="e-school">School</label><input id="e-school" className="form-control" maxLength={120} value={f.school} onChange={set("school")} required /></div>
            <div className="col-md-6"><label className="form-label small mb-1" htmlFor="e-degree">Degree</label><input id="e-degree" className="form-control" maxLength={100} value={f.degree} onChange={set("degree")} /></div>
            <div className="col-md-6"><label className="form-label small mb-1" htmlFor="e-field">Field of study</label><input id="e-field" className="form-control" maxLength={100} value={f.field} onChange={set("field")} /></div>
            <div className="col-md-6"><label className="form-label small mb-1" htmlFor="e-start">Start</label><input id="e-start" type="month" className="form-control" value={f.start} onChange={set("start")} /></div>
            <div className="col-md-6"><label className="form-label small mb-1" htmlFor="e-end">End (or expected)</label><input id="e-end" type="month" className="form-control" value={f.end} onChange={set("end")} /></div>
            <div className="col-12"><label className="form-label small mb-1" htmlFor="e-desc">Notes</label><textarea id="e-desc" className="form-control" rows={3} maxLength={600} value={f.description} onChange={set("description")} /></div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EducationSection({ items }: { items: Education[] }) {
  const [list, setList] = useState(items);
  const [editing, setEditing] = useState<Education | "new" | null>(null);
  const [deleting, setDeleting] = useState<Education | null>(null);
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
      const r = await reorderItems({ kind: "educations", ids: next.map((i) => i.id) });
      if (!r.ok) toast.error(r.error);
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const it = deleting;
    startTransition(async () => {
      const r = await deleteEducation(it.id);
      setDeleting(null);
      if (!r.ok) return toast.error(r.error);
      toast.success("Education deleted", {
        action: { label: "Undo", onClick: () => void createEducation({ school: it.school, degree: it.degree ?? "", field: it.field ?? "", startDate: it.startDate ?? "", endDate: it.endDate ?? "", description: it.description ?? "" }).then((x) => (x.ok ? toast.success("Restored") : toast.error(x.error))) },
      });
    });
  };

  return (
    <div className="card rounded shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Education</h6>
          <button type="button" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" onClick={() => setEditing("new")}><FiPlus /> Add</button>
        </div>
        {list.length === 0 ? (
          <EmptyState icon={FiBookOpen} title="No education yet" description="Add schools, degrees or courses to show on your CV." />
        ) : (
          <ul className="list-unstyled mb-0">
            {list.map((e, i) => (
              <li key={e.id} className="d-flex align-items-start gap-2 py-3 border-top">
                <div className="flex-grow-1 min-w-0">
                  <strong>{e.school}</strong>
                  <div className="text-muted small">{[e.degree, e.field].filter(Boolean).join(", ")}</div>
                  {(e.startDate || e.endDate) && <div className="text-muted small">{fmtMonth(e.startDate)}{e.startDate && e.endDate ? " – " : ""}{fmtMonth(e.endDate)}</div>}
                </div>
                <div className="text-nowrap">
                  <MoveButtons index={i} count={list.length} onMove={(d) => move(i, d)} />
                  <button type="button" className="btn btn-sm btn-outline-primary border-0" aria-label={`Edit ${e.school}`} onClick={() => setEditing(e)}><FiEdit2 /></button>
                  <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Delete ${e.school}`} onClick={() => setDeleting(e)}><FiTrash2 /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {editing && <EducationDialog item={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDialog title="Delete education?" message={`"${deleting.school}" will be removed from your CV. You can undo right after.`} isPending={isPending} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
