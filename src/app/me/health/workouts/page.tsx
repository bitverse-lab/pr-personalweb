import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import HealthStat from "@/components/me/health/HealthStat";
import ExerciseLibrary from "@/components/me/health/workouts/ExerciseLibrary";
import PrBoard from "@/components/me/health/workouts/PrBoard";
import RoutineManager from "@/components/me/health/workouts/RoutineManager";
import StartWorkoutButton from "@/components/me/health/workouts/StartWorkoutButton";
import WorkoutHistory from "@/components/me/health/workouts/WorkoutHistory";
import WorkoutsTabs from "@/components/me/health/workouts/WorkoutsTabs";
import { getWorkoutsOverview } from "@/features/health/workout-actions";
import { fmtMinutes } from "@/features/health/workout-meta";
import { fmtVolume } from "@/features/health/workout-meta";

export default async function WorkoutsPage() {
  const o = await getWorkoutsOverview();

  return (
    <>
      {o.active ? (
        <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>
            <strong>{o.active.name}</strong> is in progress.
          </span>
          <Link href={`/me/health/workouts/${o.active.id}`} className="btn btn-sm btn-warning d-inline-flex align-items-center gap-1">
            Resume <FiArrowRight />
          </Link>
        </div>
      ) : (
        <div className="card rounded shadow-sm mb-4">
          <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <h6 className="mb-0">Ready to train?</h6>
              <span className="text-muted small">Start an empty workout, or pick a routine from the Routines tab.</span>
            </div>
            <StartWorkoutButton />
          </div>
        </div>
      )}

      <div className="row row-cols-2 row-cols-lg-4 g-2 mb-4">
        <HealthStat label="This week" value={o.week.target ? `${o.week.count} / ${o.week.target}` : o.week.count} hint="workouts (Mon–Sun)" />
        <HealthStat label="Volume this week" value={fmtVolume(o.week.volumeKg)} hint="completed working sets" />
        <HealthStat label="Time this week" value={fmtMinutes(o.week.minutes)} hint="training time" />
        <HealthStat label="Streak" value={`${o.streak} day${o.streak === 1 ? "" : "s"}`} hint="consecutive workout days" />
      </div>

      <WorkoutsTabs
        tabs={[
          { key: "history", label: "History", content: <WorkoutHistory workouts={o.history} /> },
          { key: "routines", label: "Routines", content: <RoutineManager routines={o.routines} exercises={o.exercises} /> },
          { key: "records", label: "Records", content: <PrBoard records={o.records} /> },
          { key: "exercises", label: "Exercises", content: <ExerciseLibrary exercises={o.exercises} /> },
        ]}
      />
    </>
  );
}
