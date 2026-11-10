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

// A gym session longer than this was almost certainly left open and finished later; counting its
// clock time would report weeks of "training". Such sessions have no known duration.
export const MAX_SESSION_MIN = 6 * 60;

/** Minutes between start and end, or null when unfinished or implausibly long (a forgotten session). */
export function sessionMinutes(start: Date, end: Date | null): number | null {
  if (!end) return null;
  const minutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  return minutes > MAX_SESSION_MIN ? null : minutes;
}

/** 45 → "45 min", 65 → "1 h 5 min", 120 → "2 h". */
export function fmtMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Monday of the week containing a "YYYY-MM-DD" date (training weeks run Mon-Sun). */
export function weekStartOf(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  return t.toISOString().slice(0, 10);
}

/** Groups dated items into Mon-Sun weeks, newest week first, keeping each week's item order. */
export function groupByWeek<T extends { date: string }>(items: T[]): { weekStart: string; items: T[] }[] {
  const weeks = new Map<string, T[]>();
  for (const item of items) {
    const key = weekStartOf(item.date);
    weeks.set(key, [...(weeks.get(key) ?? []), item]);
  }
  return Array.from(weeks, ([weekStart, list]) => ({ weekStart, items: list })).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}
