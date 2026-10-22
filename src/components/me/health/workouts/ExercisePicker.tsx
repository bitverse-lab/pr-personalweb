"use client";

import { useMemo, useState } from "react";
import { EQUIPMENT_LABEL, MUSCLE_GROUPS, MUSCLE_LABEL } from "@/features/health/workout-meta";
import type { ExerciseDto } from "@/server/services/workout-service";
import type { MuscleGroup } from "@/db/schema/health";
import DialogShell from "@/components/shared/DialogShell";

export default function ExercisePicker({
  exercises,
  excludeIds = [],
  title = "Add exercise",
  onPick,
  onClose,
}: {
  exercises: ExerciseDto[];
  excludeIds?: string[];
  title?: string;
  onPick: (exercise: ExerciseDto) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "all">("all");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter(
      (e) => !excludeIds.includes(e.id) && (group === "all" || e.muscleGroup === group) && (!q || e.name.toLowerCase().includes(q))
    );
  }, [exercises, excludeIds, query, group]);

  return (
    <DialogShell title={title} onClose={onClose} maxWidth={520}>
      <input className="form-control mb-2" placeholder="Search exercises…" aria-label="Search exercises" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
      <div className="d-flex gap-1 flex-wrap mb-2">
        {(["all", ...MUSCLE_GROUPS] as const).map((g) => (
          <button key={g} type="button" className={`btn btn-sm ${group === g ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setGroup(g)}>
            {g === "all" ? "All" : MUSCLE_LABEL[g]}
          </button>
        ))}
      </div>
      <div className="list-group" style={{ maxHeight: 340, overflowY: "auto" }}>
        {list.length === 0 && <div className="text-muted small p-3">No exercises match.</div>}
        {list.map((e) => (
          <button key={e.id} type="button" className="list-group-item list-group-item-action d-flex justify-content-between" onClick={() => onPick(e)}>
            <span>{e.name}</span>
            <span className="text-muted small">{MUSCLE_LABEL[e.muscleGroup]} · {EQUIPMENT_LABEL[e.equipment]}</span>
          </button>
        ))}
      </div>
      <div className="d-flex justify-content-end mt-3">
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose}>Close</button>
      </div>
    </DialogShell>
  );
}
