import type { DayView } from "@/server/services/nutrition-service";

function Bar({ label, value, target, unit, color }: { label: string; value: number; target: number | null; unit: string; color: string }) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between small">
        <span>{label}</span>
        <span className="text-muted">
          {Math.round(value)}
          {target ? ` / ${target}` : ""} {unit}
        </span>
      </div>
      <div className="progress" style={{ height: 8 }} role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// Categorical palette slots: blue (protein), yellow (carbs), pink (fat) keep the three macros distinguishable.
export default function DaySummary({ day }: { day: DayView }) {
  const { totals, targets } = day;
  const remaining = targets.calories !== null ? targets.calories - totals.calories : null;

  return (
    <div className="card rounded shadow-sm mb-3">
      <div className="card-body">
        <div className="row g-4 align-items-center">
          <div className="col-md-4 text-center">
            <div className="display-6 mb-0">{totals.calories}</div>
            <div className="text-muted small">kcal eaten{targets.calories ? ` of ${targets.calories}` : ""}</div>
            {remaining !== null && (
              <div className={`small fw-semibold mt-1 ${remaining < 0 ? "text-danger" : "text-success"}`}>
                {remaining >= 0 ? `${remaining} kcal remaining` : `${Math.abs(remaining)} kcal over`}
              </div>
            )}
            {targets.calories === null && <div className="small mt-1 text-muted">Set a calorie goal in the Goals tab.</div>}
          </div>
          <div className="col-md-8">
            <Bar label="Calories" value={totals.calories} target={targets.calories} unit="kcal" color="#2a52c3" />
            <Bar label="Protein" value={totals.protein} target={targets.protein} unit="g" color="#2a78d6" />
            <Bar label="Carbs" value={totals.carbs} target={targets.carbs} unit="g" color="#eab308" />
            <Bar label="Fat" value={totals.fat} target={targets.fat} unit="g" color="#e87ba4" />
          </div>
        </div>
      </div>
    </div>
  );
}
