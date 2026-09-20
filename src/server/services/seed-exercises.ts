import type { Equipment, ExerciseKind, MuscleGroup } from "@/db/schema/health";

export interface SeedExercise {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  kind?: ExerciseKind;
}

const s = (name: string, muscleGroup: MuscleGroup, equipment: Equipment, kind: ExerciseKind = "strength"): SeedExercise => ({
  name,
  muscleGroup,
  equipment,
  kind,
});

export const STARTER_EXERCISES: SeedExercise[] = [
  // chest
  s("Barbell Bench Press", "chest", "barbell"),
  s("Incline Barbell Bench Press", "chest", "barbell"),
  s("Dumbbell Bench Press", "chest", "dumbbell"),
  s("Incline Dumbbell Press", "chest", "dumbbell"),
  s("Dumbbell Fly", "chest", "dumbbell"),
  s("Cable Crossover", "chest", "cable"),
  s("Chest Press Machine", "chest", "machine"),
  s("Push-up", "chest", "bodyweight", "bodyweight"),
  s("Dips", "chest", "bodyweight", "bodyweight"),
  // back
  s("Deadlift", "back", "barbell"),
  s("Barbell Row", "back", "barbell"),
  s("Pull-up", "back", "bodyweight", "bodyweight"),
  s("Chin-up", "back", "bodyweight", "bodyweight"),
  s("Lat Pulldown", "back", "cable"),
  s("Seated Cable Row", "back", "cable"),
  s("One-arm Dumbbell Row", "back", "dumbbell"),
  s("T-Bar Row", "back", "barbell"),
  s("Face Pull", "back", "cable"),
  // shoulders
  s("Overhead Press", "shoulders", "barbell"),
  s("Dumbbell Shoulder Press", "shoulders", "dumbbell"),
  s("Lateral Raise", "shoulders", "dumbbell"),
  s("Front Raise", "shoulders", "dumbbell"),
  s("Rear Delt Fly", "shoulders", "dumbbell"),
  s("Arnold Press", "shoulders", "dumbbell"),
  s("Shoulder Press Machine", "shoulders", "machine"),
  s("Barbell Shrug", "shoulders", "barbell"),
  // biceps
  s("Barbell Curl", "biceps", "barbell"),
  s("Dumbbell Curl", "biceps", "dumbbell"),
  s("Hammer Curl", "biceps", "dumbbell"),
  s("Preacher Curl", "biceps", "machine"),
  s("Cable Curl", "biceps", "cable"),
  // triceps
  s("Close-grip Bench Press", "triceps", "barbell"),
  s("Triceps Pushdown", "triceps", "cable"),
  s("Skull Crusher", "triceps", "barbell"),
  s("Overhead Triceps Extension", "triceps", "dumbbell"),
  s("Bench Dip", "triceps", "bodyweight", "bodyweight"),
  // legs
  s("Barbell Squat", "legs", "barbell"),
  s("Front Squat", "legs", "barbell"),
  s("Leg Press", "legs", "machine"),
  s("Romanian Deadlift", "legs", "barbell"),
  s("Walking Lunge", "legs", "dumbbell"),
  s("Bulgarian Split Squat", "legs", "dumbbell"),
  s("Leg Extension", "legs", "machine"),
  s("Leg Curl", "legs", "machine"),
  s("Standing Calf Raise", "legs", "machine"),
  s("Goblet Squat", "legs", "dumbbell"),
  s("Bodyweight Squat", "legs", "bodyweight", "bodyweight"),
  // glutes
  s("Hip Thrust", "glutes", "barbell"),
  s("Glute Bridge", "glutes", "bodyweight", "bodyweight"),
  s("Cable Kickback", "glutes", "cable"),
  // core
  s("Plank", "core", "bodyweight", "bodyweight"),
  s("Crunch", "core", "bodyweight", "bodyweight"),
  s("Hanging Leg Raise", "core", "bodyweight", "bodyweight"),
  s("Cable Crunch", "core", "cable"),
  s("Russian Twist", "core", "bodyweight", "bodyweight"),
  s("Ab Wheel Rollout", "core", "other", "bodyweight"),
  // cardio
  s("Treadmill Run", "cardio", "machine", "cardio"),
  s("Outdoor Run", "cardio", "other", "cardio"),
  s("Cycling", "cardio", "machine", "cardio"),
  s("Rowing Machine", "cardio", "machine", "cardio"),
  s("Jump Rope", "cardio", "other", "cardio"),
  s("Elliptical", "cardio", "machine", "cardio"),
  s("Swimming", "cardio", "other", "cardio"),
  s("Walking", "cardio", "other", "cardio"),
  // full body
  s("Burpee", "full_body", "bodyweight", "bodyweight"),
  s("Kettlebell Swing", "full_body", "other"),
  s("Clean and Press", "full_body", "barbell"),
];
