"use client";

import { useState, useTransition } from "react";
import { FiBriefcase, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { createExperience, deleteExperience, reorderItems, updateExperience, type ProfileData } from "@/features/profile/actions";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { MoveButtons, fmtMonth, monthToDate, monthValue, moveItem } from "./shared";
import DialogShell from "@/components/shared/DialogShell";
import LangTabs, { trValue, type EditLang } from "@/components/me/LangTabs";
import { coverage } from "@/features/content/translations";

type Experience = ProfileData["experiences"][number];

function ExperienceDialog({ item, onClose }: { item?: Experience; onClose: () => void }) {
  const [f, setF] = useState({
    company: item?.company ?? "",
    role: item?.role ?? "",
    location: item?.location ?? "",
    start: monthValue(item?.startDate ?? null),
    end: monthValue(item?.endDate ?? null),
    current: item ? item.endDate === null : false,
    description: item?.description ?? "",
    achievements: (item?.achievements ?? []).join("\n"),
    idRole: trValue(item?.translations.id?.role),
    idDescription: trValue(item?.translations.id?.description),
    idAchievements: (item?.translations.id?.achievements ?? []).join("\n"),
  });
  const [lang, setLang] = useState<EditLang>("en");
  const lines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);
  const cov = coverage({ id: { role: f.idRole, description: f.idDescription, achievements: lines(f.idAchievements) } }, ["role", "description", "achievements"]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((c) => ({ ...c, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const data = {
      company: f.company,
      role: f.role,
      location: f.location,
      startDate: monthToDate(f.start),
      endDate: f.current ? null : monthToDate(f.end),
      description: f.description,
      achievements: lines(f.achievements),
      translations: { id: { role: f.idRole, description: f.idDescription, achievements: lines(f.idAchievements) } },
    };
    startTransition(async () => {
      const result = item ? await updateExperience({ id: item.id, data }) : await createExperience(data);
      if (!result.ok) return setError(result.error);
      toast.success(item ? "Experience updated" : "Experience added");
      onClose();
    });
  };

  return (
    <DialogShell title={item ? "Edit experience" : "Add experience"} onClose={onClose} maxWidth={560}>
      <form onSubmit={submit}>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <LangTabs value={lang} onChange={setLang} done={cov.done} total={cov.total} />
        {lang === "id" ? (
          <div className="row g-2">
            <div className="col-12"><label className="form-label small mb-1" htmlFor="x-role-id">Role (Indonesian)</label><input id="x-role-id" lang="id" className="form-control" maxLength={100} placeholder={f.role} value={f.idRole} onChange={set("idRole")} /></div>
            <div className="col-12"><label className="form-label small mb-1" htmlFor="x-desc-id">Description (Indonesian)</label><textarea id="x-desc-id" lang="id" className="form-control" rows={3} maxLength={1000} placeholder={f.description} value={f.idDescription} onChange={set("idDescription")} /></div>
            <div className="col-12"><label className="form-label small mb-1" htmlFor="x-ach-id">Achievements, one per line (Indonesian)</label><textarea id="x-ach-id" lang="id" className="form-control" rows={4} placeholder={f.achievements} value={f.idAchievements} onChange={set("idAchievements")} /></div>
          </div>
        ) : (
        <div className="row g-2">
          <div className="col-md-6"><label className="form-label small mb-1" htmlFor="x-company">Company</label><input id="x-company" className="form-control" maxLength={100} value={f.company} onChange={set("company")} required /></div>
          <div className="col-md-6"><label className="form-label small mb-1" htmlFor="x-role">Role</label><input id="x-role" className="form-control" maxLength={100} value={f.role} onChange={set("role")} required /></div>
          <div className="col-md-4"><label className="form-label small mb-1" htmlFor="x-loc">Location</label><input id="x-loc" className="form-control" maxLength={80} value={f.location} onChange={set("location")} /></div>
          <div className="col-md-4"><label className="form-label small mb-1" htmlFor="x-start">Start</label><input id="x-start" type="month" className="form-control" value={f.start} onChange={set("start")} required /></div>
          <div className="col-md-4"><label className="form-label small mb-1" htmlFor="x-end">End</label><input id="x-end" type="month" className="form-control" value={f.end} onChange={set("end")} disabled={f.current} required={!f.current} /></div>
          <div className="col-12">
            <div className="form-check">
              <input id="x-current" type="checkbox" className="form-check-input" checked={f.current} onChange={(e) => setF((c) => ({ ...c, current: e.target.checked }))} />
              <label className="form-check-label small" htmlFor="x-current">I currently work here</label>
            </div>
          </div>
          <div className="col-12"><label className="form-label small mb-1" htmlFor="x-desc">Description</label><textarea id="x-desc" className="form-control" rows={3} maxLength={1000} value={f.description} onChange={set("description")} /></div>
          <div className="col-12"><label className="form-label small mb-1" htmlFor="x-ach">Achievements (one per line)</label><textarea id="x-ach" className="form-control" rows={4} value={f.achievements} onChange={set("achievements")} placeholder={"Reduced page load time by 40%\nLed a team of 4 engineers"} /></div>
        </div>
        )}
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>Save</button>
        </div>
      </form>
    </DialogShell>
  );
}

export default function ExperienceSection({ items }: { items: Experience[] }) {
  const [list, setList] = useState(items);
  const [editing, setEditing] = useState<Experience | "new" | null>(null);
  const [deleting, setDeleting] = useState<Experience | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  // keep local order in sync after revalidation
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
      const r = await reorderItems({ kind: "experiences", ids: next.map((i) => i.id) });
      if (!r.ok) toast.error(r.error);
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const it = deleting;
    startTransition(async () => {
      const r = await deleteExperience(it.id);
      setDeleting(null);
      if (!r.ok) return toast.error(r.error);
      toast.success("Experience deleted", {
        action: { label: "Undo", onClick: () => void createExperience({ company: it.company, role: it.role, location: it.location ?? "", startDate: it.startDate, endDate: it.endDate, description: it.description ?? "", achievements: it.achievements, translations: it.translations }).then((x) => (x.ok ? toast.success("Restored") : toast.error(x.error))) },
      });
    });
  };

  return (
    <div className="card rounded shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Work experience</h6>
          <button type="button" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" onClick={() => setEditing("new")}><FiPlus /> Add</button>
        </div>
        {list.length === 0 ? (
          <EmptyState icon={FiBriefcase} title="No experience yet" description="Add your roles — newest first. They appear on your CV, About and home page." />
        ) : (
          <ul className="list-unstyled mb-0">
            {list.map((e, i) => (
              <li key={e.id} className="d-flex align-items-start gap-2 py-3 border-top">
                <div className="flex-grow-1 min-w-0">
                  <strong>{e.role}</strong> <span className="text-muted">at {e.company}</span>
                  <div className="text-muted small">{fmtMonth(e.startDate)} – {e.endDate ? fmtMonth(e.endDate) : "Present"}{e.location && ` · ${e.location}`}</div>
                  {e.achievements.length > 0 && <div className="text-muted small">{e.achievements.length} achievement{e.achievements.length === 1 ? "" : "s"}</div>}
                </div>
                <div className="text-nowrap">
                  <MoveButtons index={i} count={list.length} onMove={(d) => move(i, d)} />
                  <button type="button" className="btn btn-sm btn-outline-primary border-0" aria-label={`Edit ${e.role}`} onClick={() => setEditing(e)}><FiEdit2 /></button>
                  <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Delete ${e.role}`} onClick={() => setDeleting(e)}><FiTrash2 /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {editing && <ExperienceDialog item={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDialog title="Delete experience?" message={`"${deleting.role}" at ${deleting.company} will be removed from your CV. You can undo right after.`} isPending={isPending} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
