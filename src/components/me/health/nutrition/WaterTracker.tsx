"use client";

import { useTransition } from "react";
import { FiDroplet, FiRotateCcw } from "react-icons/fi";
import { addWater, deleteWater } from "@/features/health/nutrition-actions";
import { useToast } from "@/components/shared/ToastProvider";

const AMOUNTS = [200, 250, 500];

export default function WaterTracker({
  date,
  totalMl,
  targetMl,
  entries,
}: {
  date: string;
  totalMl: number;
  targetMl: number | null;
  entries: { id: string; amountMl: number }[];
}) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const pct = targetMl ? Math.min(100, Math.round((totalMl / targetMl) * 100)) : 0;

  const add = (amountMl: number) =>
    startTransition(async () => {
      const result = await addWater({ date, amountMl });
      if (!result.ok) toast.error(result.error);
    });

  const undo = () => {
    const last = entries[entries.length - 1];
    if (!last) return;
    startTransition(async () => {
      const result = await deleteWater(last.id);
      if (!result.ok) toast.error(result.error);
    });
  };

  return (
    <div className="card rounded shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <h6 className="mb-0 d-inline-flex align-items-center gap-2">
            <FiDroplet className="text-primary" /> Water
          </h6>
          <span className="text-muted small">
            {totalMl} ml{targetMl ? ` of ${targetMl} ml` : ""}
          </span>
        </div>
        <div className="progress mb-3" style={{ height: 8 }} role="progressbar" aria-label="Water" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-bar" style={{ width: `${pct}%`, background: "#2a78d6" }} />
        </div>
        <div className="d-flex flex-wrap gap-2">
          {AMOUNTS.map((a) => (
            <button key={a} type="button" className="btn btn-sm btn-outline-primary" disabled={isPending} onClick={() => add(a)}>
              +{a} ml
            </button>
          ))}
          <button type="button" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 ms-auto" disabled={isPending || entries.length === 0} onClick={undo}>
            <FiRotateCcw /> Undo last
          </button>
        </div>
      </div>
    </div>
  );
}
