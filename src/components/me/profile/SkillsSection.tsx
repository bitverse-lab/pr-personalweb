"use client";

import { useState, useTransition } from "react";
import { FiEdit2, FiPlus, FiStar, FiTrash2 } from "react-icons/fi";
import { createSkill, deleteSkill, reorderItems, updateSkill, type ProfileData } from "@/features/profile/actions";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { MoveButtons, moveItem } from "./shared";
import DialogShell from "@/components/shared/DialogShell";

type Skill = ProfileData["skills"][number];

function SkillDialog({ item, onClose }: { item?: Skill; onClose: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [level, setLevel] = useState(item?.level ?? 80);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const data = { name, category, level };
      const result = item ? await updateSkill({ id: item.id, data }) : await createSkill(data);
      if (!result.ok) return setError(result.error);
      toast.success(item ? "Skill updated" : "Skill added");
      onClose();
    });
  };

  return (
    <DialogShell title={item ? "Edit skill" : "Add skill"} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <div className="mb-2"><label className="form-label small mb-1" htmlFor="s-name">Skill</label><input id="s-name" className="form-control" maxLength={50} value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></div>
        <div className="mb-2"><label className="form-label small mb-1" htmlFor="s-cat">Category (opt.)</label><input id="s-cat" className="form-control" maxLength={40} placeholder="e.g. Frontend" value={category} onChange={(e) => setCategory(e.target.value)} /></div>
        <div className="mb-3">
          <label className="form-label small mb-1" htmlFor="s-level">Proficiency: {level}%</label>
          <input id="s-level" type="range" min={0} max={100} step={5} className="form-range" value={level} onChange={(e) => setLevel(Number(e.target.value))} />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !name.trim()}>Save</button>
        </div>
      </form>
    </DialogShell>
  );
}

export default function SkillsSection({ items }: { items: Skill[] }) {
  const [list, setList] = useState(items);
  const [editing, setEditing] = useState<Skill | "new" | null>(null);
  const [deleting, setDeleting] = useState<Skill | null>(null);
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
      const r = await reorderItems({ kind: "skills", ids: next.map((i) => i.id) });
      if (!r.ok) toast.error(r.error);
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const it = deleting;
    startTransition(async () => {
      const r = await deleteSkill(it.id);
      setDeleting(null);
      if (!r.ok) return toast.error(r.error);
      toast.success("Skill deleted", { action: { label: "Undo", onClick: () => void createSkill({ name: it.name, category: it.category ?? "", level: it.level }).then((x) => (x.ok ? toast.success("Restored") : toast.error(x.error))) } });
    });
  };

  return (
    <div className="card rounded shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Skills</h6>
          <button type="button" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" onClick={() => setEditing("new")}><FiPlus /> Add</button>
        </div>
        {list.length === 0 ? (
          <EmptyState icon={FiStar} title="No skills yet" description="Skills show as progress bars on your public site and as a list on your CV." />
        ) : (
          <ul className="list-unstyled mb-0">
            {list.map((s, i) => (
              <li key={s.id} className="d-flex align-items-center gap-2 py-2 border-top">
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex justify-content-between small">
                    <span>{s.name}{s.category && <span className="text-muted"> · {s.category}</span>}</span>
                    <span className="text-muted">{s.level}%</span>
                  </div>
                  <div className="progress" style={{ height: 6 }} role="progressbar" aria-label={`${s.name} proficiency`} aria-valuenow={s.level} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-bar" style={{ width: `${s.level}%` }} />
                  </div>
                </div>
                <div className="text-nowrap">
                  <MoveButtons index={i} count={list.length} onMove={(d) => move(i, d)} />
                  <button type="button" className="btn btn-sm btn-outline-primary border-0" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)}><FiEdit2 /></button>
                  <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Delete ${s.name}`} onClick={() => setDeleting(s)}><FiTrash2 /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {editing && <SkillDialog item={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDialog title="Delete skill?" message={`"${deleting.name}" will be removed. You can undo right after.`} isPending={isPending} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
