import type { ActivityLevel, GoalType, Sex } from "@/db/schema/health";

// ---------- date helpers (date-only "YYYY-MM-DD" strings, timezone-free arithmetic) ----------

function parts(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return { y, m, day };
}

export function addDays(d: string, n: number): string {
  const { y, m, day } = parts(d);
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
}

/** Monday of the week containing d. */
export function weekStart(d: string): string {
  const { y, m, day } = parts(d);
  const dow = new Date(Date.UTC(y, m - 1, day)).getUTCDay(); // 0 = Sunday
  return addDays(d, -((dow + 6) % 7));
}

export function monthKey(d: string): string {
  return d.slice(0, 7);
}

export function daysBetween(a: string, b: string): number {
  const pa = parts(a);
  const pb = parts(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.day) - Date.UTC(pa.y, pa.m - 1, pa.day)) / 86400000);
}

export const round1 = (n: number) => Math.round(n * 10) / 10;

// ---------- body ----------

export function calcBmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return round1(weightKg / (m * m));
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function ageFromBirthDate(birthDate: string, today: string): number {
  const b = parts(birthDate);
  const t = parts(today);
  let age = t.y - b.y;
  if (t.m < b.m || (t.m === b.m && t.day < b.day)) age--;
  return age;
}

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job, little exercise)",
  light: "Light (1–3 workouts / week)",
  moderate: "Moderate (3–5 workouts / week)",
  active: "Active (6–7 workouts / week)",
  very_active: "Very active (physical job + training)",
};

/** Mifflin–St Jeor. */
export function calcBmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function calcTdee(bmr: number, level: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_FACTOR[level]);
}

export interface Suggestion {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Calorie target from TDEE and goal (~7700 kcal per kg), with protein 1.8 g/kg and fat 25%. */
export function suggestTargets(
  tdee: number,
  weightKg: number,
  goal: GoalType,
  weeklyRateKg: number | null
): Suggestion {
  const rate = Math.abs(weeklyRateKg ?? 0.5);
  const delta = goal === "maintain" ? 0 : Math.round((rate * 7700) / 7) * (goal === "lose" ? -1 : 1);
  const calories = Math.max(1200, tdee + delta);
  const proteinG = Math.round(weightKg * 1.8);
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  return { calories, proteinG, carbsG, fatG };
}

// ---------- weight averages ----------

export interface WeightPoint {
  date: string;
  weightKg: number;
}

export interface PeriodAverage {
  key: string; // week Monday date or YYYY-MM
  label: string;
  average: number;
  entries: number;
  delta: number | null; // vs the previous period listed after this one (older)
}

function averageBy(points: WeightPoint[], keyOf: (d: string) => string, labelOf: (k: string) => string): PeriodAverage[] {
  const groups = new Map<string, number[]>();
  for (const p of points) {
    const k = keyOf(p.date);
    groups.set(k, [...(groups.get(k) ?? []), p.weightKg]);
  }
  const rows = Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // newest first
    .map(([key, values]) => ({
      key,
      label: labelOf(key),
      average: round1(values.reduce((s: number, v: number) => s + v, 0) / values.length),
      entries: values.length,
      delta: null as number | null,
    }));
  for (let i = 0; i < rows.length - 1; i++) rows[i].delta = round1(rows[i].average - rows[i + 1].average);
  return rows;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function weeklyAverages(points: WeightPoint[]): PeriodAverage[] {
  return averageBy(points, weekStart, (k) => {
    const { m, day } = parts(k);
    const end = parts(addDays(k, 6));
    return `${MONTHS[m - 1]} ${day} – ${MONTHS[end.m - 1]} ${end.day}`;
  });
}

export function monthlyAverages(points: WeightPoint[]): PeriodAverage[] {
  return averageBy(points, monthKey, (k) => {
    const [y, m] = k.split("-").map(Number);
    return `${MONTHS[m - 1]} ${y}`;
  });
}

/** Trailing moving average over the last `windowDays` calendar days for every logged date. */
export function movingAverage(points: WeightPoint[], windowDays = 7): Map<string, number> {
  const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : 1));
  const out = new Map<string, number>();
  for (const p of sorted) {
    const from = addDays(p.date, -(windowDays - 1));
    const window = sorted.filter((q) => q.date >= from && q.date <= p.date);
    out.set(p.date, round1(window.reduce((s, q) => s + q.weightKg, 0) / window.length));
  }
  return out;
}

/** Share of the way from start to target (0–100, clamped). */
export function goalProgress(startKg: number, currentKg: number, targetKg: number): number | null {
  const total = targetKg - startKg;
  if (total === 0) return null;
  return Math.max(0, Math.min(100, Math.round(((currentKg - startKg) / total) * 100)));
}

// ---------- workouts ----------

export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return round1(weightKg);
  return round1(weightKg * (1 + reps / 30)); // Epley
}

export interface SetLike {
  reps: number | null;
  weightKg: number | null;
  isWarmup: boolean;
  done: boolean;
}

export function setVolume(s: SetLike): number {
  if (s.isWarmup || !s.done) return 0;
  return (s.reps ?? 0) * (s.weightKg ?? 0);
}

export function totalVolume(sets: SetLike[]): number {
  return Math.round(sets.reduce((sum, s) => sum + setVolume(s), 0));
}

/** Consecutive days ending today (or yesterday, if today has nothing yet) that contain an entry. */
export function currentStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

// ---------- nutrition ----------

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function sumMacros(items: Macros[]): Macros {
  const total = items.reduce(
    (t, i) => ({ calories: t.calories + i.calories, protein: t.protein + i.protein, carbs: t.carbs + i.carbs, fat: t.fat + i.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return { calories: Math.round(total.calories), protein: round1(total.protein), carbs: round1(total.carbs), fat: round1(total.fat) };
}

// ---------- personal records ----------

export interface HistorySet {
  exerciseId: string;
  reps: number | null;
  weightKg: number | null;
  date: string;
}

export interface ExercisePr {
  exerciseId: string;
  maxWeight: { weightKg: number; reps: number; date: string } | null;
  bestE1rm: { value: number; weightKg: number; reps: number; date: string } | null;
  bestVolume: { volume: number; weightKg: number; reps: number; date: string } | null;
}

export function personalRecords(sets: HistorySet[]): Map<string, ExercisePr> {
  const out = new Map<string, ExercisePr>();
  for (const s of sets) {
    const reps = s.reps ?? 0;
    const weight = s.weightKg ?? 0;
    if (reps <= 0 || weight <= 0) continue;
    const pr = out.get(s.exerciseId) ?? { exerciseId: s.exerciseId, maxWeight: null, bestE1rm: null, bestVolume: null };
    if (!pr.maxWeight || weight > pr.maxWeight.weightKg) pr.maxWeight = { weightKg: weight, reps, date: s.date };
    const e1 = estimate1RM(weight, reps);
    if (!pr.bestE1rm || e1 > pr.bestE1rm.value) pr.bestE1rm = { value: e1, weightKg: weight, reps, date: s.date };
    const vol = Math.round(weight * reps);
    if (!pr.bestVolume || vol > pr.bestVolume.volume) pr.bestVolume = { volume: vol, weightKg: weight, reps, date: s.date };
    out.set(s.exerciseId, pr);
  }
  return out;
}

/** A set is a PR when it beats every earlier heaviest weight or estimated 1RM (needs some history). */
export function beatsPrior(weightKg: number | null, reps: number | null, prior: { maxWeight: number; bestE1rm: number } | null): boolean {
  if (!prior || prior.maxWeight <= 0) return false;
  const w = weightKg ?? 0;
  const r = reps ?? 0;
  if (w <= 0 || r <= 0) return false;
  return w > prior.maxWeight || estimate1RM(w, r) > prior.bestE1rm;
}
