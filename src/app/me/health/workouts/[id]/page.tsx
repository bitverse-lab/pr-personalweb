import { notFound } from "next/navigation";
import WorkoutLogger from "@/components/me/health/workouts/WorkoutLogger";
import { getExerciseList, getWorkoutLogger } from "@/features/health/workout-actions";

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, exercises] = await Promise.all([getWorkoutLogger(id), getExerciseList()]);
  if (!data) notFound();
  return <WorkoutLogger key={data.workout.id} data={data} allExercises={exercises} />;
}
