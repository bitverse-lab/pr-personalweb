"use client";

import { useState, useTransition } from "react";
import { FiTrash2 } from "react-icons/fi";
import { deleteWeight, logWeight } from "@/features/health/weight-actions";
import { fmtDate } from "@/features/health/format";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/shared/ToastProvider";
import type { WeightEntryDto } from "@/server/services/weight-service";

export default function WeightEntryList({ entries }: { entries: WeightEntryDto[] }) {
  const [target, setTarget] = useState<WeightEntryDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const confirmDelete = () => {
    if (!target) return;
    const entry = target;
    startTransition(async () => {
      const result = await deleteWeight(entry.id);
      setTarget(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Entry deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            void logWeight({ date: entry.date, weightKg: entry.weightKg, bodyFatPct: entry.bodyFatPct ?? "", note: entry.note ?? "" }).then(
              (r) => (r.ok ? toast.success("Entry restored") : toast.error(r.error))
            );
          },
        },
      });
    });
  };

  return (
    <>
      <div className="table-responsive">
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr className="text-muted small">
              <th>Date</th>
              <th className="text-end">Weight</th>
              <th className="text-end">Body fat</th>
              <th>Note</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{fmtDate(e.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</td>
                <td className="text-end fw-semibold">{e.weightKg} kg</td>
                <td className="text-end text-muted">{e.bodyFatPct ? `${e.bodyFatPct}%` : "—"}</td>
                <td className="text-muted small">{e.note}</td>
                <td className="text-end">
                  <button type="button" className="btn btn-sm btn-outline-danger border-0" onClick={() => setTarget(e)} aria-label={`Delete entry ${e.date}`}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {target && (
        <ConfirmDialog
          title="Delete entry?"
          message={`${target.weightKg} kg on ${fmtDate(target.date)} will be deleted. You can undo right after.`}
          isPending={isPending}
          onConfirm={confirmDelete}
          onCancel={() => setTarget(null)}
        />
      )}
    </>
  );
}
