"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FiActivity, FiTrash2 } from "react-icons/fi";
import { deleteWorkout, restoreWorkout } from "@/features/health/workout-actions";
import { fmtDate } from "@/features/health/format";
import { fmtMinutes, fmtVolume, groupByWeek } from "@/features/health/workout-meta";
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
      {/* Week by week, each with its totals, so progress reads without adding anything up. */}
      {groupByWeek(workouts).map((week) => {
        const done = week.items.filter((w) => w.status !== "in_progress");
        const volume = done.reduce((n, w) => n + w.volumeKg, 0);
        const minutes = done.reduce((n, w) => n + (w.durationMin ?? 0), 0);
        const end = new Date(`${week.weekStart}T00:00:00Z`);
        end.setUTCDate(end.getUTCDate() + 6);
        const range = `${fmtDate(week.weekStart, { month: "short", day: "numeric" })} – ${fmtDate(end.toISOString().slice(0, 10), { month: "short", day: "numeric" })}`;
        return (
          <section key={week.weekStart} className="wk-week" aria-label={`Week of ${range}`}>
            <header className="wk-week-head">
              <span className="wk-week-range">{range}</span>
              <span className="wk-week-totals">
                {done.length} {done.length === 1 ? "workout" : "workouts"} · {fmtVolume(volume)}
                {minutes ? ` · ${fmtMinutes(minutes)}` : ""}
              </span>
            </header>
            <ul className="list-unstyled mb-0">
              {week.items.map((w) => (
                <li key={w.id} className="wk-row">
                  <Link href={`/me/health/workouts/${w.id}`} className="wk-row-link">
                    <span className="wk-day">{fmtDate(w.date, { weekday: "short" })}</span>
                    <span className="wk-row-main">
                      <span className="wk-row-title">
                        <strong>{w.name}</strong>
                        {w.status === "in_progress" && <span className="badge bg-soft-warning text-warning">In progress</span>}
                      </span>
                      <span className="wk-row-sub">{w.exerciseNames.join(" · ") || "No exercises"}</span>
                    </span>
                    <span className="wk-row-stats">
                      {w.setCount} sets · {fmtVolume(w.volumeKg)}
                      {w.durationMin ? ` · ${fmtMinutes(w.durationMin)}` : w.status === "in_progress" ? "" : " · duration not recorded"}
                    </span>
                  </Link>
                  <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Delete ${w.name}`} onClick={() => setTarget(w)}>
                    <FiTrash2 />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {target && (
        <ConfirmDialog title="Delete workout?" message={`"${target.name}" and all its sets will be deleted. You can undo right after.`} isPending={isPending} onConfirm={confirm} onCancel={() => setTarget(null)} />
      )}
    </>
  );
}
