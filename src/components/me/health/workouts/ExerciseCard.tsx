"use client";

import { FiPlus, FiTrash2 } from "react-icons/fi";
import { EQUIPMENT_LABEL, MUSCLE_LABEL } from "@/features/health/workout-meta";
import { totalVolume } from "@/features/health/calc";
import SetRow, { type SetPatch } from "./SetRow";
import type { LoggerExercise } from "@/server/services/workout-service";

export default function ExerciseCard({
  item,
  onSetChange,
  onSetDelete,
  onAddSet,
  onRemove,
}: {
  item: LoggerExercise;
  onSetChange: (setId: string, patch: SetPatch) => void;
  onSetDelete: (setId: string) => void;
  onAddSet: () => void;
  onRemove: () => void;
}) {
  const { exercise, sets, previous, prior } = item;
  const cardio = exercise.kind === "cardio";
  const volume = totalVolume(sets);
  let working = 0;
  const workingIndex = new Map<string, number>();
  for (const s of sets) if (!s.isWarmup) workingIndex.set(s.id, ++working);

  return (
    <div className="card rounded shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="mb-0">{exercise.name}</h6>
            <span className="text-muted small">
              {MUSCLE_LABEL[exercise.muscleGroup]} · {EQUIPMENT_LABEL[exercise.equipment]}
              {!cardio && volume > 0 && ` · ${volume.toLocaleString("en-US")} kg volume`}
            </span>
          </div>
          <button type="button" className="btn btn-sm btn-outline-danger border-0" aria-label={`Remove ${exercise.name}`} onClick={onRemove}>
            <FiTrash2 />
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-2">
            <thead>
              <tr className="text-muted small text-center">
                <th style={{ width: 44 }}>Set</th>
                <th className="d-none d-sm-table-cell">Previous</th>
                <th>{cardio ? "Min" : exercise.kind === "bodyweight" ? "+ kg" : "kg"}</th>
                <th>{cardio ? "km" : "Reps"}</th>
                <th style={{ width: 90 }}>Done</th>
                <th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {sets.map((set, i) => (
                <SetRow
                  key={set.id}
                  set={set}
                  label={String(workingIndex.get(set.id) ?? i + 1)}
                  kind={exercise.kind}
                  previous={previous[workingIndex.get(set.id) ? (workingIndex.get(set.id) as number) - 1 : -1]}
                  prior={prior}
                  onChange={(patch) => onSetChange(set.id, patch)}
                  onDelete={() => onSetDelete(set.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1" onClick={onAddSet}>
          <FiPlus /> Add set
        </button>
      </div>
    </div>
  );
}
