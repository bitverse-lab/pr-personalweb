"use client";

import { useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { beatsPrior } from "@/features/health/calc";
import type { ExerciseKind } from "@/db/schema/health";
import type { LoggerExercise, SetDto } from "@/server/services/workout-service";

export type SetPatch = Partial<Pick<SetDto, "reps" | "weightKg" | "durationSec" | "distanceKm" | "isWarmup" | "done">>;

const fmt = (n: number | null) => (n === null ? "" : String(n));
const parse = (v: string): number | null => {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

function previousLabel(kind: ExerciseKind, p: LoggerExercise["previous"][number] | undefined) {
  if (!p) return "—";
  if (kind === "cardio") return `${p.durationSec ? Math.round(p.durationSec / 60) : 0} min · ${p.distanceKm ?? 0} km`;
  if (!p.reps && !p.weightKg) return "—";
  return `${p.weightKg ? `${p.weightKg} kg × ` : ""}${p.reps ?? 0}`;
}

export default function SetRow({
  set,
  label,
  kind,
  previous,
  prior,
  onChange,
  onDelete,
}: {
  set: SetDto;
  label: string;
  kind: ExerciseKind;
  previous: LoggerExercise["previous"][number] | undefined;
  prior: LoggerExercise["prior"];
  onChange: (patch: SetPatch) => void;
  onDelete: () => void;
}) {
  // Text inputs keep their own draft; values are committed on blur so typing never fights a re-render.
  const [a, setA] = useState(kind === "cardio" ? fmt(set.durationSec === null ? null : Math.round(set.durationSec / 60)) : fmt(set.weightKg));
  const [b, setB] = useState(kind === "cardio" ? fmt(set.distanceKm) : fmt(set.reps));
  const isPr = set.done && !set.isWarmup && kind !== "cardio" && beatsPrior(set.weightKg, set.reps, prior);

  const commitA = () => {
    const v = parse(a);
    if (kind === "cardio") onChange({ durationSec: v === null ? null : Math.round(v * 60) });
    else onChange({ weightKg: v });
  };
  const commitB = () => {
    const v = parse(b);
    if (kind === "cardio") onChange({ distanceKm: v });
    else onChange({ reps: v === null ? null : Math.round(v) });
  };

  return (
    <tr className={set.done ? "table-success" : undefined}>
      <td className="text-center">
        <button
          type="button"
          className={`btn btn-sm py-0 px-2 ${set.isWarmup ? "btn-warning" : "btn-outline-secondary"}`}
          aria-pressed={set.isWarmup}
          title="Toggle warm-up set"
          onClick={() => onChange({ isWarmup: !set.isWarmup })}
        >
          {set.isWarmup ? "W" : label}
        </button>
      </td>
      <td className="text-muted small text-nowrap d-none d-sm-table-cell">{previousLabel(kind, previous)}</td>
      <td>
        <input
          type="number"
          min="0"
          step={kind === "cardio" ? "1" : "0.5"}
          inputMode="decimal"
          className="form-control form-control-sm text-center"
          style={{ minWidth: 64 }}
          aria-label={kind === "cardio" ? "Minutes" : "Weight in kg"}
          value={a}
          onChange={(e) => setA(e.target.value)}
          onBlur={commitA}
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          step={kind === "cardio" ? "0.1" : "1"}
          inputMode="decimal"
          className="form-control form-control-sm text-center"
          style={{ minWidth: 64 }}
          aria-label={kind === "cardio" ? "Distance in km" : "Reps"}
          value={b}
          onChange={(e) => setB(e.target.value)}
          onBlur={commitB}
        />
      </td>
      <td className="text-center text-nowrap">
        {isPr && <span className="badge bg-warning text-dark me-1" title="Personal record">PR</span>}
        <button
          type="button"
          className={`btn btn-sm ${set.done ? "btn-success" : "btn-outline-success"}`}
          aria-pressed={set.done}
          aria-label={set.done ? "Mark set as not done" : "Mark set as done"}
          onClick={() => {
            // flush any draft before toggling so the completed set carries what is on screen
            commitA();
            commitB();
            onChange({ done: !set.done });
          }}
        >
          <FiCheck />
        </button>
      </td>
      <td className="text-end">
        <button type="button" className="btn btn-sm btn-outline-danger border-0 py-0" aria-label="Delete set" onClick={onDelete}>
          <FiX />
        </button>
      </td>
    </tr>
  );
}
