"use client";

import { useMemo, useState, useTransition } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { createExercise, deleteExercise, updateExercise } from "@/features/health/workout-actions";
import { EQUIPMENT_LABEL, KIND_LABEL, MUSCLE_GROUPS, MUSCLE_LABEL } from "@/features/health/workout-meta";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/shared/ToastProvider";
import type { ExerciseDto } from "@/server/services/workout-service";
import type { Equipment, ExerciseKind, MuscleGroup } from "@/db/schema/health";
import DialogShell from "@/components/shared/DialogShell";

function ExerciseFormDialog({ exercise, onClose }: { exercise?: ExerciseDto; onClose: () => void }) {
  const [name, setName] = useState(exercise?.name ?? "");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(exercise?.muscleGroup ?? "chest");
  const [equipment, setEquipment] = useState<Equipment>(exercise?.equipment ?? "barbell");
  const [kind, setKind] = useState<ExerciseKind>(exercise?.kind ?? "strength");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const data = { name, muscleGroup, equipment, kind };
      const result = exercise ? await updateExercise({ id: exercise.id, data }) : await createExercise(data);
      if (!result.ok) return setError(result.error);
      toast.success(exercise ? "Exercise updated" : "Exercise added");
      onClose();
    });
  };

  return (
    <DialogShell title={exercise ? "Edit exercise" : "New exercise"} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <div className="mb-2">
          <label className="form-label small mb-1" htmlFor="ex-name">Name</label>
          <input id="ex-name" className="form-control" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="row g-2 mb-2">
          <div className="col-6">
            <label className="form-label small mb-1" htmlFor="ex-muscle">Muscle group</label>
            <select id="ex-muscle" className="form-select" value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}>
              {MUSCLE_GROUPS.map((g) => (<option key={g} value={g}>{MUSCLE_LABEL[g]}</option>))}
            </select>
          </div>
          <div className="col-6">
            <label className="form-label small mb-1" htmlFor="ex-equipment">Equipment</label>
            <select id="ex-equipment" className="form-select" value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
              {(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map((g) => (<option key={g} value={g}>{EQUIPMENT_LABEL[g]}</option>))}
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label small mb-1" htmlFor="ex-kind">How it is logged</label>
          <select id="ex-kind" className="form-select" value={kind} onChange={(e) => setKind(e.target.value as ExerciseKind)}>
            {(Object.keys(KIND_LABEL) as ExerciseKind[]).map((k) => (<option key={k} value={k}>{KIND_LABEL[k]}</option>))}
          </select>
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !name.trim()}>Save</button>
        </div>
      </form>
    </DialogShell>
  );
}

export default function ExerciseLibrary({ exercises }: { exercises: ExerciseDto[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "all">("all");
  const [editing, setEditing] = useState<ExerciseDto | "new" | null>(null);
  const [deleting, setDeleting] = useState<ExerciseDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => (group === "all" || e.muscleGroup === group) && (!q || e.name.toLowerCase().includes(q)));
  }, [exercises, query, group]);

  const confirm = () => {
    if (!deleting) return;
    const ex = deleting;
    startTransition(async () => {
      const result = await deleteExercise(ex.id);
      setDeleting(null);
      if (!result.ok) return toast.error(result.error);
      toast.success(`Deleted ${ex.name}`);
    });
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h6 className="mb-0">Exercise library <span className="text-muted small">({exercises.length})</span></h6>
        <div className="d-flex gap-2">
          <input className="form-control form-control-sm" style={{ width: 200 }} placeholder="Search…" aria-label="Search exercises" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="button" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" onClick={() => setEditing("new")}>
            <FiPlus /> New exercise
          </button>
        </div>
      </div>
      <div className="d-flex gap-1 flex-wrap mb-3">
        {(["all", ...MUSCLE_GROUPS] as const).map((g) => (
          <button key={g} type="button" className={`btn btn-sm ${group === g ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setGroup(g)}>
            {g === "all" ? "All" : MUSCLE_LABEL[g]}
          </button>
        ))}
      </div>
      <div className="table-responsive" style={{ maxHeight: 460, overflowY: "auto" }}>
        <table className="table table-sm align-middle mb-0">
          <tbody>
            {list.map((e) => (
              <tr key={e.id}>
                <td>{e.name}{e.isCustom && <span className="badge bg-soft-primary text-primary ms-2">Custom</span>}</td>
                <td className="text-muted small">{MUSCLE_LABEL[e.muscleGroup]}</td>
                <td className="text-muted small d-none d-md-table-cell">{EQUIPMENT_LABEL[e.equipment]}</td>
                <td className="text-end text-nowrap">
                  <button type="button" className="btn btn-sm btn-outline-primary border-0" aria-label={`Edit ${e.name}`} onClick={() => setEditing(e)}><FiEdit2 /></button>
                  <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Delete ${e.name}`} onClick={() => setDeleting(e)}><FiTrash2 /></button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (<tr><td className="text-muted small py-3">No exercises found.</td></tr>)}
          </tbody>
        </table>
      </div>
      {editing && <ExerciseFormDialog exercise={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete exercise?"
          message={`"${deleting.name}" will be removed from the library, and every set you logged with it — including past workouts and records — will be deleted too. This cannot be undone.`}
          isPending={isPending}
          onConfirm={confirm}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
