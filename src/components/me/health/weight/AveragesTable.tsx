import { FiArrowDown, FiArrowUp, FiMinus } from "react-icons/fi";
import { fmtDelta } from "@/features/health/format";
import type { PeriodAverage } from "@/features/health/calc";

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted">—</span>;
  const Icon = value > 0 ? FiArrowUp : value < 0 ? FiArrowDown : FiMinus;
  return (
    <span className="d-inline-flex align-items-center gap-1 text-muted">
      <Icon aria-hidden /> {fmtDelta(value)}
    </span>
  );
}

export default function AveragesTable({ title, rows, limit }: { title: string; rows: PeriodAverage[]; limit: number }) {
  return (
    <div className="card rounded shadow-sm h-100">
      <div className="card-body">
        <h6 className="mb-3">{title}</h6>
        {rows.length === 0 ? (
          <p className="text-muted small mb-0">Log your weight to see averages.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th>Period</th>
                  <th className="text-end">Average</th>
                  <th className="text-end">Entries</th>
                  <th className="text-end">Change</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, limit).map((r) => (
                  <tr key={r.key}>
                    <td>{r.label}</td>
                    <td className="text-end fw-semibold">{r.average} kg</td>
                    <td className="text-end text-muted">{r.entries}</td>
                    <td className="text-end">
                      <Delta value={r.delta} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
