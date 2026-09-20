import { FiAward } from "react-icons/fi";
import EmptyState from "@/components/shared/EmptyState";
import { fmtDate } from "@/features/health/format";
import { MUSCLE_LABEL } from "@/features/health/workout-meta";
import type { WorkoutsOverview } from "@/server/services/workout-service";

export default function PrBoard({ records }: { records: WorkoutsOverview["records"] }) {
  if (records.length === 0) {
    return <EmptyState icon={FiAward} title="No records yet" description="Finish a workout with weight and reps and your best lifts appear here." />;
  }
  return (
    <>
      <h6 className="mb-3">Personal records</h6>
      <div className="table-responsive">
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr className="text-muted small">
              <th>Exercise</th>
              <th className="text-end">Heaviest</th>
              <th className="text-end">Est. 1RM</th>
              <th className="text-end d-none d-md-table-cell">Best set volume</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.exerciseId}>
                <td>
                  {r.name}
                  <div className="text-muted small">{MUSCLE_LABEL[r.muscleGroup]}</div>
                </td>
                <td className="text-end">
                  {r.maxWeight ? (
                    <>
                      <strong>{r.maxWeight.weightKg} kg</strong> × {r.maxWeight.reps}
                      <div className="text-muted small">{fmtDate(r.maxWeight.date, { month: "short", day: "numeric", year: "numeric" })}</div>
                    </>
                  ) : "—"}
                </td>
                <td className="text-end">{r.bestE1rm ? <strong>{r.bestE1rm.value} kg</strong> : "—"}</td>
                <td className="text-end d-none d-md-table-cell">{r.bestVolume ? `${r.bestVolume.volume} kg` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted small mt-2 mb-0">Estimated 1RM uses the Epley formula: weight × (1 + reps / 30).</p>
    </>
  );
}
