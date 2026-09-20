"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FiActivity, FiTrash2 } from "react-icons/fi";
import { deleteWorkout, restoreWorkout } from "@/features/health/workout-actions";
import { fmtDate } from "@/features/health/format";
import { fmtVolume } from "@/features/health/workout-meta";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import type { WorkoutSummary } from "@/server/services/workout-service";

export default function WorkoutHistory({ workouts }: { workouts: WorkoutSummary[] }) {
  const [target, setTarget] = useState<WorkoutSummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const confirm = () => {
    if (!target) return;
    const w = target;
    startTransition(async () => {
      const r = await deleteWorkout(w.id);
      setTarget(null);
      if (!r.ok) return toast.error(r.error);
      const snapshot = r.data;
      toast.success("Workout deleted", {
        action: { label: "Undo", onClick: () => void restoreWorkout(snapshot).then((res) => (res.ok ? toast.success("Workout restored") : toast.error(res.error))) },
      });
    });
  };

  if (workouts.length === 0) {
    return <EmptyState icon={FiActivity} title="No workouts yet" description="Start your first workout and it will show up here." />;
  }

  return (
    <>
      <ul className="list-unstyled mb-0">
        {workouts.map((w) => (
          <li key={w.id} className="d-flex align-items-center gap-2 py-2 border-top">
            <Link href={`/me/health/workouts/${w.id}`} className="flex-grow-1 text-decoration-none text-dark min-w-0">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <strong>{w.name}</strong>
                {w.status === "in_progress" && <span className="badge bg-soft-warning text-warning">In progress</span>}
                <span className="text-muted small">{fmtDate(w.date, { weekday: "short", month: "short", day: "numeric" })}</span>
              </div>
              <div className="text-muted small text-truncate">{w.exerciseNames.join(" · ") || "No exercises"}</div>
              <div className="text-muted small">
                {w.setCount} sets · {fmtVolume(w.volumeKg)}
                {w.durationMin ? ` · ${w.durationMin} min` : ""}
              </div>
            </Link>
            <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Delete ${w.name}`} onClick={() => setTarget(w)}>
              <FiTrash2 />
            </button>
          </li>
        ))}
      </ul>
      {target && (
        <ConfirmDialog title="Delete workout?" message={`"${target.name}" and all its sets will be deleted. You can undo right after.`} isPending={isPending} onConfirm={confirm} onCancel={() => setTarget(null)} />
      )}
    </>
  );
}
