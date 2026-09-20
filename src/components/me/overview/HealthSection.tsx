import Link from "next/link";
import { FiArrowRight, FiHeart } from "react-icons/fi";
import EmptyState from "@/components/shared/EmptyState";

export interface HealthSummary {
  caloriesToday: number;
  calorieTarget: number | null;
  waterMl: number;
  waterTarget: number | null;
  latestWeightKg: number | null;
  sevenDayAverageKg: number | null;
  weekWorkouts: number;
  weekWorkoutTarget: number | null;
  activeWorkout: { id: string; name: string } | null;
}

function Bar({ value, target, color }: { value: number; target: number | null; color: string }) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="progress" style={{ height: 6 }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-bar" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function HealthSection({ summary }: { summary?: HealthSummary }) {
  const empty =
    !summary ||
    (summary.caloriesToday === 0 && summary.waterMl === 0 && summary.latestWeightKg === null && summary.weekWorkouts === 0 && !summary.activeWorkout);

  return (
    <div className="card rounded shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="card-title mb-0">Health</h6>
          <Link href="/me/health" className="small d-inline-flex align-items-center gap-1">
            Open <FiArrowRight />
          </Link>
        </div>
        {empty || !summary ? (
          <EmptyState
            icon={FiHeart}
            title="Nothing logged today"
            description="Log a meal, your weight or a workout to see today's health snapshot here."
            actionLabel="Open Health"
            actionHref="/me/health"
          />
        ) : (
          <>
            {summary.activeWorkout && (
              <Link href={`/me/health/workouts/${summary.activeWorkout.id}`} className="alert alert-warning py-2 small d-block text-decoration-none">
                <strong>{summary.activeWorkout.name}</strong> in progress — resume
              </Link>
            )}
            <div className="mb-3">
              <div className="d-flex justify-content-between small">
                <span>Calories</span>
                <span className="text-muted">
                  {summary.caloriesToday}
                  {summary.calorieTarget ? ` / ${summary.calorieTarget}` : ""} kcal
                </span>
              </div>
              <Bar value={summary.caloriesToday} target={summary.calorieTarget} color="#2a52c3" />
            </div>
            <div className="mb-3">
              <div className="d-flex justify-content-between small">
                <span>Water</span>
                <span className="text-muted">
                  {summary.waterMl}
                  {summary.waterTarget ? ` / ${summary.waterTarget}` : ""} ml
                </span>
              </div>
              <Bar value={summary.waterMl} target={summary.waterTarget} color="#2a78d6" />
            </div>
            <ul className="list-unstyled mb-0">
              <li className="d-flex justify-content-between border-top py-2">
                <span>Weight</span>
                <span className="text-muted small">
                  {summary.latestWeightKg !== null ? `${summary.latestWeightKg} kg` : "—"}
                  {summary.sevenDayAverageKg !== null && ` · 7-day avg ${summary.sevenDayAverageKg} kg`}
                </span>
              </li>
              <li className="d-flex justify-content-between border-top py-2">
                <span>Workouts this week</span>
                <span className="text-muted small">
                  {summary.weekWorkouts}
                  {summary.weekWorkoutTarget ? ` / ${summary.weekWorkoutTarget}` : ""}
                </span>
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
