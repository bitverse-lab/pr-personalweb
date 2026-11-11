"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiClock, FiPlus, FiTrash2 } from "react-icons/fi";
import {
  addExerciseToWorkout,
  addSetToExercise,
  deleteSet,
  deleteWorkout,
  finishWorkout,
  removeExerciseFromWorkout,
  restoreWorkout,
  updateSet,
  updateWorkoutMeta,
} from "@/features/health/workout-actions";
import { totalVolume } from "@/features/health/calc";
import { MAX_SESSION_MIN, fmtDuration, fmtVolume } from "@/features/health/workout-meta";
import { useToast } from "@/components/shared/ToastProvider";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ExerciseCard from "./ExerciseCard";
import ExercisePicker from "./ExercisePicker";
import RestTimer from "./RestTimer";
import type { SetPatch } from "./SetRow";
import type { ExerciseDto, LoggerData, LoggerExercise } from "@/server/services/workout-service";

const DEFAULT_REST_SECONDS = 90;

function Elapsed({ startedAt, endedAt }: { startedAt: string; endedAt: string | null }) {
  const start = new Date(startedAt).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endedAt]);
  const end = endedAt ? new Date(endedAt).getTime() : now;
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtDuration(Math.max(0, Math.floor((end - start) / 1000)))}</span>;
}

export default function WorkoutLogger({ data, allExercises }: { data: LoggerData; allExercises: ExerciseDto[] }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const { workout } = data;
  const live = workout.status === "in_progress";

  const [exercises, setExercises] = useState<LoggerExercise[]>(data.exercises);
  const [name, setName] = useState(workout.name);
  const [notes, setNotes] = useState(workout.notes ?? "");
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);

  const allSets = useMemo(() => exercises.flatMap((e) => e.sets), [exercises]);
  const volume = totalVolume(allSets);
  const doneSets = allSets.filter((s) => s.done).length;

  const patchSet = (exerciseId: string, setId: string, patch: SetPatch) => {
    const before = exercises;
    setExercises((cur) =>
      cur.map((e) => (e.exercise.id === exerciseId ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) } : e))
    );
    if (patch.done && live) setRestEndsAt(Date.now() + DEFAULT_REST_SECONDS * 1000);
    if (patch.done === false) setRestEndsAt(null);
    void updateSet({ id: setId, ...patch }).then((r) => {
      if (!r.ok) {
        toast.error(r.error);
        setExercises(before);
      }
    });
  };

  const removeSet = (exerciseId: string, setId: string) => {
    const before = exercises;
    setExercises((cur) => cur.map((e) => (e.exercise.id === exerciseId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e)));
    void deleteSet(setId).then((r) => {
      if (!r.ok) {
        toast.error(r.error);
        setExercises(before);
      }
    });
  };

  const addSet = (exerciseId: string) =>
    startTransition(async () => {
      const r = await addSetToExercise({ workoutId: workout.id, exerciseId });
      if (!r.ok) return toast.error(r.error);
      setExercises((cur) => cur.map((e) => (e.exercise.id === exerciseId ? { ...e, sets: [...e.sets, r.data.set] } : e)));
    });

  const removeExercise = (exerciseId: string) => {
    const before = exercises;
    setExercises((cur) => cur.filter((e) => e.exercise.id !== exerciseId));
    void removeExerciseFromWorkout({ workoutId: workout.id, exerciseId }).then((r) => {
      if (!r.ok) {
        toast.error(r.error);
        setExercises(before);
      }
    });
  };

  const pickExercise = (exercise: ExerciseDto) => {
    setPicking(false);
    startTransition(async () => {
      const r = await addExerciseToWorkout({ workoutId: workout.id, exerciseId: exercise.id });
      if (!r.ok) return toast.error(r.error);
      // history hints for a freshly added exercise arrive on the next page load; sets are already prefilled
      setExercises((cur) => [...cur, { exercise, sets: r.data.sets, previous: [], prior: null }]);
    });
  };

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed) return setName(workout.name);
    if (trimmed !== workout.name) void updateWorkoutMeta({ id: workout.id, name: trimmed });
  };

  const saveNotes = () => {
    if (notes !== (workout.notes ?? "")) void updateWorkoutMeta({ id: workout.id, notes });
  };

  // Left open by mistake: more than six hours since it started. Checked after mount so the server
  // and browser render the same HTML.
  const [stale, setStale] = useState(false);
  const [lastedMin, setLastedMin] = useState(60);
  useEffect(() => {
    if (live) setStale(Date.now() - new Date(workout.startedAt).getTime() > MAX_SESSION_MIN * 60_000);
  }, [live, workout.startedAt]);

  const finish = () =>
    startTransition(async () => {
      const r = await finishWorkout({ id: workout.id, notes, ...(stale ? { durationMin: lastedMin } : {}) });
      if (!r.ok) return toast.error(r.error);
      toast.success(`Workout saved — ${r.data.sets} sets, ${fmtVolume(r.data.volumeKg)}${r.data.minutes ? `, ${r.data.minutes} min` : ""}`);
      router.push("/me/health/workouts");
    });

  const discard = () =>
    startTransition(async () => {
      const r = await deleteWorkout(workout.id);
      setConfirmDelete(false);
      if (!r.ok) return toast.error(r.error);
      const snapshot = r.data;
      toast.success("Workout deleted", {
        action: { label: "Undo", onClick: () => void restoreWorkout(snapshot).then((res) => (res.ok ? toast.success("Workout restored") : toast.error(res.error))) },
      });
      router.push("/me/health/workouts");
    });

  return (
    <>
      <Link href="/me/health/workouts" className="text-muted small d-inline-flex align-items-center gap-1 mb-2">
        <FiArrowLeft /> All workouts
      </Link>

      {stale && (
        <div className="alert alert-warning d-flex flex-wrap align-items-center gap-2 mb-3" role="status">
          <span className="me-auto">
            Open since{" "}
            {new Date(workout.startedAt).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })} — probably left running. How long did it last?
          </span>
          <label className="visually-hidden" htmlFor="wk-lasted">Minutes</label>
          <div className="input-group input-group-sm" style={{ width: 130 }}>
            <input id="wk-lasted" type="number" min={1} max={MAX_SESSION_MIN} className="form-control" value={lastedMin} onChange={(e) => setLastedMin(Math.min(MAX_SESSION_MIN, Math.max(1, Number(e.target.value) || 1)))} />
            <span className="input-group-text">min</span>
          </div>
          <button type="button" className="btn btn-sm btn-success" disabled={isPending || allSets.length === 0} onClick={finish}>
            Finish with this time
          </button>
        </div>
      )}

      <div className="card rounded shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="flex-grow-1" style={{ minWidth: 200 }}>
              <input className="form-control form-control-lg border-0 px-0 fw-semibold" aria-label="Workout name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} />
              <span className="text-muted small">
                {new Date(`${workout.date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })}
                {!live && " · completed"}
              </span>
            </div>
            <div className="d-flex gap-4 text-center">
              <div>
                <div className="h5 mb-0 d-inline-flex align-items-center gap-1"><FiClock /> <Elapsed startedAt={workout.startedAt} endedAt={workout.endedAt} /></div>
                <div className="text-muted small">Time</div>
              </div>
              <div>
                <div className="h5 mb-0">{fmtVolume(volume)}</div>
                <div className="text-muted small">Volume</div>
              </div>
              <div>
                <div className="h5 mb-0">{doneSets}/{allSets.length}</div>
                <div className="text-muted small">Sets done</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {exercises.length === 0 && (
        <div className="card rounded shadow-sm mb-3">
          <div className="card-body text-center text-muted py-4">No exercises yet — add your first one below.</div>
        </div>
      )}

      {exercises.map((item) => (
        <ExerciseCard
          key={item.exercise.id}
          item={item}
          onSetChange={(setId, patch) => patchSet(item.exercise.id, setId, patch)}
          onSetDelete={(setId) => removeSet(item.exercise.id, setId)}
          onAddSet={() => addSet(item.exercise.id)}
          onRemove={() => removeExercise(item.exercise.id)}
        />
      ))}

      <button type="button" className="btn btn-outline-primary w-100 mb-3 d-inline-flex align-items-center justify-content-center gap-1" onClick={() => setPicking(true)}>
        <FiPlus /> Add exercise
      </button>

      <div className="card rounded shadow-sm mb-3">
        <div className="card-body">
          <label className="form-label small mb-1" htmlFor="workout-notes">Notes</label>
          <textarea id="workout-notes" className="form-control" rows={2} maxLength={2000} placeholder="How did it feel?" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} />
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 justify-content-between mb-5">
        <button type="button" className="btn btn-outline-danger d-inline-flex align-items-center gap-1" onClick={() => setConfirmDelete(true)}>
          <FiTrash2 /> {live ? "Discard workout" : "Delete workout"}
        </button>
        {live ? (
          <button type="button" className="btn btn-success d-inline-flex align-items-center gap-1" disabled={isPending || allSets.length === 0} onClick={finish}>
            <FiCheckCircle /> Finish workout
          </button>
        ) : (
          <Link href="/me/health/workouts" className="btn btn-primary">Done</Link>
        )}
      </div>

      {picking && <ExercisePicker exercises={allExercises} excludeIds={exercises.map((e) => e.exercise.id)} onPick={pickExercise} onClose={() => setPicking(false)} />}
      {confirmDelete && (
        <ConfirmDialog
          title={live ? "Discard this workout?" : "Delete this workout?"}
          message="All its sets will be removed. You can undo right after."
          confirmLabel={live ? "Discard" : "Delete"}
          isPending={isPending}
          onConfirm={discard}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {restEndsAt !== null && <RestTimer endsAt={restEndsAt} onChange={setRestEndsAt} onDismiss={() => setRestEndsAt(null)} />}
    </>
  );
}
