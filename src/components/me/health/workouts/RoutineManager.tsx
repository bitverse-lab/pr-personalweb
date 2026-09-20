"use client";

import { useState, useTransition } from "react";
import { FiArrowDown, FiArrowUp, FiEdit2, FiList, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { deleteRoutine, saveRoutine } from "@/features/health/workout-actions";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import ExercisePicker from "./ExercisePicker";
import StartWorkoutButton from "./StartWorkoutButton";
import type { ExerciseDto, RoutineDto } from "@/server/services/workout-service";

interface Row {
  exerciseId: string;
  name: string;
  targetSets: string;
  targetReps: string;
}

function RoutineDialog({ routine, exercises, onClose }: { routine?: RoutineDto; exercises: ExerciseDto[]; onClose: () => void }) {
  const panelRef = useDialogA11y<HTMLDivElement>(onClose);
  const [name, setName] = useState(routine?.name ?? "");
  const [notes, setNotes] = useState(routine?.notes ?? "");
  const [rows, setRows] = useState<Row[]>(
    routine?.exercises.map((e) => ({ exerciseId: e.exerciseId, name: e.name, targetSets: String(e.targetSets), targetReps: String(e.targetReps) })) ?? []
  );
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const move = (i: number, d: -1 | 1) =>
    setRows((cur) => {
      const j = i + d;
      if (j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveRoutine({
        id: routine?.id,
        name,
        notes,
        exercises: rows.map((r) => ({ exerciseId: r.exerciseId, targetSets: r.targetSets, targetReps: r.targetReps })),
      });
      if (!result.ok) return setError(result.error);
      toast.success(routine ? "Routine updated" : "Routine created");
      onClose();
    });
  };

  return (
    <div role="presentation" className="me-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className="me-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="routine-title" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <h6 id="routine-title" className="mb-3">{routine ? "Edit routine" : "New routine"}</h6>
        <form onSubmit={submit}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <div className="mb-2">
            <label className="form-label small mb-1" htmlFor="r-name">Name</label>
            <input id="r-name" className="form-control" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Push day" required />
          </div>
          <div className="mb-3">
            <label className="form-label small mb-1" htmlFor="r-notes">Notes (opt.)</label>
            <input id="r-notes" className="form-control" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="small text-muted mb-1">Exercises</div>
          {rows.length === 0 && <p className="text-muted small">No exercises yet.</p>}
          {rows.map((r, i) => (
            <div key={r.exerciseId} className="d-flex align-items-center gap-2 py-1 border-top">
              <div className="flex-grow-1 text-truncate">{r.name}</div>
              <input type="number" min="1" max="20" className="form-control form-control-sm text-center" style={{ width: 58 }} aria-label={`Sets for ${r.name}`} value={r.targetSets} onChange={(e) => setRows((c) => c.map((x, k) => (k === i ? { ...x, targetSets: e.target.value } : x)))} />
              <span className="text-muted small">×</span>
              <input type="number" min="1" max="200" className="form-control form-control-sm text-center" style={{ width: 58 }} aria-label={`Reps for ${r.name}`} value={r.targetReps} onChange={(e) => setRows((c) => c.map((x, k) => (k === i ? { ...x, targetReps: e.target.value } : x)))} />
              <button type="button" className="btn btn-sm border-0 p-1" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><FiArrowUp /></button>
              <button type="button" className="btn btn-sm border-0 p-1" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)}><FiArrowDown /></button>
              <button type="button" className="btn btn-sm border-0 p-1 text-danger" aria-label={`Remove ${r.name}`} onClick={() => setRows((c) => c.filter((_, k) => k !== i))}><FiX /></button>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 mt-2" onClick={() => setPicking(true)}>
            <FiPlus /> Add exercise
          </button>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !name.trim() || rows.length === 0}>Save</button>
          </div>
        </form>
        {picking && (
          <ExercisePicker
            exercises={exercises}
            excludeIds={rows.map((r) => r.exerciseId)}
            onClose={() => setPicking(false)}
            onPick={(ex) => {
              setRows((c) => [...c, { exerciseId: ex.id, name: ex.name, targetSets: "3", targetReps: ex.kind === "cardio" ? "1" : "10" }]);
              setPicking(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function RoutineManager({ routines, exercises }: { routines: RoutineDto[]; exercises: ExerciseDto[] }) {
  const [editing, setEditing] = useState<RoutineDto | "new" | null>(null);
  const [deleting, setDeleting] = useState<RoutineDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const confirm = () => {
    if (!deleting) return;
    const r = deleting;
    startTransition(async () => {
      const result = await deleteRoutine(r.id);
      setDeleting(null);
      if (!result.ok) return toast.error(result.error);
      toast.success(`Deleted ${r.name}`, {
        action: {
          label: "Undo",
          onClick: () =>
            void saveRoutine({ name: r.name, notes: r.notes, exercises: r.exercises.map((e) => ({ exerciseId: e.exerciseId, targetSets: e.targetSets, targetReps: e.targetReps })) }).then((res) =>
              res.ok ? toast.success("Routine restored") : toast.error(res.error)
            ),
        },
      });
    });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Routines</h6>
        <button type="button" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" onClick={() => setEditing("new")}>
          <FiPlus /> New routine
        </button>
      </div>
      {routines.length === 0 ? (
        <EmptyState icon={FiList} title="No routines yet" description="Save a template like “Push day” and start it in one tap, with sets and reps prefilled." />
      ) : (
        <div className="row g-3">
          {routines.map((r) => (
            <div className="col-md-6" key={r.id}>
              <div className="border rounded p-3 h-100 bg-white">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-0">{r.name}</h6>
                    {r.notes && <div className="text-muted small">{r.notes}</div>}
                  </div>
                  <div className="text-nowrap">
                    <button type="button" className="btn btn-sm btn-outline-primary border-0" aria-label={`Edit ${r.name}`} onClick={() => setEditing(r)}><FiEdit2 /></button>
                    <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Delete ${r.name}`} onClick={() => setDeleting(r)}><FiTrash2 /></button>
                  </div>
                </div>
                <ul className="small text-muted ps-3 my-2">
                  {r.exercises.map((e) => (
                    <li key={e.exerciseId}>{e.name} — {e.targetSets} × {e.targetReps}</li>
                  ))}
                </ul>
                <StartWorkoutButton routineId={r.id} label="Start" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" />
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && <RoutineDialog routine={editing === "new" ? undefined : editing} exercises={exercises} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDialog title="Delete routine?" message={`"${deleting.name}" will be deleted. Past workouts stay. You can undo right after.`} isPending={isPending} onConfirm={confirm} onCancel={() => setDeleting(null)} />}
    </>
  );
}
