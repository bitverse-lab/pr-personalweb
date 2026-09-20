import type { Equipment, ExerciseKind, MuscleGroup } from "@/db/schema/health";

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  legs: "Legs",
  glutes: "Glutes",
  core: "Core",
  cardio: "Cardio",
  full_body: "Full body",
};

export const MUSCLE_GROUPS = Object.keys(MUSCLE_LABEL) as MuscleGroup[];

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  machine: "Machine",
  cable: "Cable",
  bodyweight: "Bodyweight",
  other: "Other",
};

export const KIND_LABEL: Record<ExerciseKind, string> = {
  strength: "Strength (kg × reps)",
  bodyweight: "Bodyweight (reps, optional extra kg)",
  cardio: "Cardio (time + distance)",
};

export function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function fmtVolume(kg: number): string {
  return kg >= 10000 ? `${(kg / 1000).toFixed(1)} t` : `${kg.toLocaleString("en-US")} kg`;
}
