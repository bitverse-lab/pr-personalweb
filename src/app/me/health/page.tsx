import Link from "next/link";
import { FiArrowRight, FiEdit3, FiTarget } from "react-icons/fi";
import HealthStat from "@/components/me/health/HealthStat";
import WeeklyBarChart from "@/components/me/health/WeeklyBarChart";
import CalorieHistoryChart from "@/components/me/health/nutrition/CalorieHistoryChart";
import DaySummary from "@/components/me/health/nutrition/DaySummary";
import WaterTracker from "@/components/me/health/nutrition/WaterTracker";
import StartWorkoutButton from "@/components/me/health/workouts/StartWorkoutButton";
import WeightChart from "@/components/me/health/weight/WeightChart";
import { getHealthDashboard } from "@/features/health/dashboard-actions";
import { fmtDate, fmtDelta } from "@/features/health/format";
import { fmtVolume } from "@/features/health/workout-meta";
import NumberFlow from "@number-flow/react";

export default async function HealthPage() {
  const d = await getHealthDashboard();
  const { day, weight, workouts, weekly } = d;
  const remaining = day.targets.calories !== null ? day.targets.calories - day.totals.calories : null;

  return (
    <>
      {!d.hasGoals && (
        <div className="alert alert-info d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>Set your goals to see targets, remaining calories and progress on this page.</span>
          <Link href="/me/health/goals" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1">
            <FiTarget /> Set goals
          </Link>
        </div>
      )}
      {workouts.active && (
        <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>
            <strong>{workouts.active.name}</strong> is in progress.
          </span>
          <Link href={`/me/health/workouts/${workouts.active.id}`} className="btn btn-sm btn-warning d-inline-flex align-items-center gap-1">
            Resume <FiArrowRight />
          </Link>
        </div>
      )}

      <div className="row row-cols-2 row-cols-lg-4 g-2 mb-4">
        <HealthStat
          label="Calories today"
          value={day.targets.calories ? <><NumberFlow value={day.totals.calories} /> / {day.targets.calories}</> : <NumberFlow value={day.totals.calories} />}
          hint={remaining === null ? "kcal eaten" : remaining >= 0 ? `${remaining} kcal remaining` : `${Math.abs(remaining)} kcal over`}
          progress={day.targets.calories ? day.totals.calories / day.targets.calories : null}
          overIsBad
        />
        <HealthStat
          label="Weight"
          value={weight.latest ? `${weight.latest.weightKg} kg` : "—"}
          hint={weight.sevenDayAverage ? `7-day avg ${weight.sevenDayAverage} kg (${fmtDelta(weight.weekDelta)} vs last week)` : "no entries this week"}
        />
        <HealthStat
          label="Workouts this week"
          value={workouts.week.target ? <><NumberFlow value={workouts.week.count} /> / {workouts.week.target}</> : <NumberFlow value={workouts.week.count} />}
          hint={`${workouts.streak}-day streak`}
          progress={workouts.week.target ? workouts.week.count / workouts.week.target : null}
        />
        <HealthStat
          label="Water today"
          value={<NumberFlow value={day.waterMl} suffix=" ml" />}
          hint={day.targets.waterMl ? `of ${day.targets.waterMl} ml` : "set a goal in Goals"}
          progress={day.targets.waterMl ? day.waterMl / day.targets.waterMl : null}
        />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-8">
          <DaySummary day={day} />
          <div className="card rounded shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Weight — last 30 days</h6>
                <Link href="/me/health/weight" className="small">Details</Link>
              </div>
              {weight.chart.length === 0 ? (
                <p className="text-muted small mb-0">Log your weight to see the trend and averages.</p>
              ) : (
                <WeightChart data={weight.chart} targetKg={weight.target?.weightKg ?? null} />
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <WaterTracker date={day.date} totalMl={day.waterMl} targetMl={day.targets.waterMl} entries={day.waterEntries} />
          <div className="card rounded shadow-sm mb-3">
            <div className="card-body">
              <h6 className="mb-3">Quick actions</h6>
              <div className="d-grid gap-2">
                <Link href="/me/health/weight" className="btn btn-outline-primary btn-sm d-inline-flex align-items-center justify-content-center gap-1">
                  <FiEdit3 /> Log weight
                </Link>
                <Link href="/me/health/nutrition" className="btn btn-outline-primary btn-sm d-inline-flex align-items-center justify-content-center gap-1">
                  <FiEdit3 /> Log a meal
                </Link>
                {workouts.active ? (
                  <Link href={`/me/health/workouts/${workouts.active.id}`} className="btn btn-primary btn-sm">Resume workout</Link>
                ) : (
                  <StartWorkoutButton className="btn btn-primary btn-sm d-inline-flex align-items-center justify-content-center gap-1" />
                )}
              </div>
            </div>
          </div>
          <div className="card rounded shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Top lifts</h6>
                <Link href="/me/health/workouts" className="small">All records</Link>
              </div>
              {workouts.records.length === 0 ? (
                <p className="text-muted small mb-0">Finish a workout with weights to see your best lifts.</p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {workouts.records.slice(0, 3).map((r) => (
                    <li key={r.exerciseId} className="d-flex justify-content-between py-1 border-top">
                      <span>{r.name}</span>
                      <span className="text-muted small">
                        {r.maxWeight ? `${r.maxWeight.weightKg} kg × ${r.maxWeight.reps}` : "—"}
                        {r.maxWeight && <span className="d-none d-md-inline"> · {fmtDate(r.maxWeight.date)}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card rounded shadow-sm h-100">
            <div className="card-body">
              <h6 className="mb-2">Calories — last 14 days</h6>
              <CalorieHistoryChart data={day.history} target={day.targets.calories} />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card rounded shadow-sm h-100">
            <div className="card-body">
              <h6 className="mb-2">Workouts per week</h6>
              <WeeklyBarChart data={weekly} dataKey="count" label="Workouts" unit="workouts" target={workouts.week.target} />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card rounded shadow-sm h-100">
            <div className="card-body">
              <h6 className="mb-2">Weekly volume</h6>
              <WeeklyBarChart data={weekly} dataKey="volumeKg" label="Volume" unit="kg" />
              <p className="text-muted small mt-2 mb-0">This week: {fmtVolume(workouts.week.volumeKg)}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
