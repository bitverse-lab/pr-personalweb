import { sessionMinutes } from "@/features/health/workout-meta";
import { db } from "@/db";
import { workoutRepository, type SetValues } from "@/server/repositories/workout-repository";
import { healthProfileRepository } from "@/server/repositories/health-profile-repository";
import { addDays, currentStreak, personalRecords, totalVolume, weekStart, type ExercisePr } from "@/features/health/calc";
import { STARTER_EXERCISES } from "./seed-exercises";
import type { Equipment, ExerciseKind, MuscleGroup, WorkoutStatus } from "@/db/schema/health";

export interface ExerciseDto {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  kind: ExerciseKind;
  isCustom: boolean;
}

export interface SetDto {
  id: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
  distanceKm: number | null;
  isWarmup: boolean;
  done: boolean;
}

export interface LoggerExercise {
  exercise: ExerciseDto;
  sets: SetDto[];
  previous: { reps: number | null; weightKg: number | null; durationSec: number | null; distanceKm: number | null }[];
  prior: { maxWeight: number; bestE1rm: number } | null;
}

export interface LoggerData {
  workout: { id: string; name: string; date: string; startedAt: string; endedAt: string | null; notes: string | null; status: WorkoutStatus };
  exercises: LoggerExercise[];
}

export interface RoutineDto {
  id: string;
  name: string;
  notes: string | null;
  exercises: { exerciseId: string; name: string; targetSets: number; targetReps: number }[];
}

export interface WorkoutSummary {
  id: string;
  name: string;
  date: string;
  status: WorkoutStatus;
  durationMin: number | null;
  volumeKg: number;
  exerciseNames: string[];
  setCount: number;
}

export interface WorkoutsOverview {
  active: { id: string; name: string } | null;
  week: { count: number; target: number | null; volumeKg: number; minutes: number };
  streak: number;
  history: WorkoutSummary[];
  routines: RoutineDto[];
  exercises: ExerciseDto[];
  records: (ExercisePr & { name: string; muscleGroup: MuscleGroup })[];
}

const toExercise = (e: ExerciseDto): ExerciseDto => ({
  id: e.id,
  name: e.name,
  muscleGroup: e.muscleGroup,
  equipment: e.equipment,
  kind: e.kind,
  isCustom: e.isCustom,
});

const toSet = (s: SetDto): SetDto => ({
  id: s.id,
  setNumber: s.setNumber,
  reps: s.reps,
  weightKg: s.weightKg,
  durationSec: s.durationSec,
  distanceKm: s.distanceKm,
  isWarmup: s.isWarmup,
  done: s.done,
});

type Prev = LoggerExercise["previous"];

async function previousByExercise(userId: string, exerciseIds: string[], excludeWorkoutId?: string) {
  const history = await workoutRepository.historySets(userId, excludeWorkoutId);
  const wanted = new Set(exerciseIds);
  const latestWorkout = new Map<string, string>();
  const previous = new Map<string, Prev>();
  for (const h of history) {
    // history is newest-first, so the first workout seen per exercise is the latest one
    if (!wanted.has(h.exerciseId)) continue;
    const seen = latestWorkout.get(h.exerciseId);
    if (seen && seen !== h.workoutId) continue;
    latestWorkout.set(h.exerciseId, h.workoutId);
    previous.set(h.exerciseId, [...(previous.get(h.exerciseId) ?? []), h]);
  }
  return { previous, history };
}

// Null for unfinished or forgotten sessions (see sessionMinutes), so "time this week" stays honest.
const durationMin = sessionMinutes;

// Users whose starter exercises are known to exist: the count is checked once per server process, not per request.
const seeded = new Set<string>();

export const workoutService = {
  async ensureSeeded(userId: string) {
    if (seeded.has(userId)) return;
    if ((await workoutRepository.countExercises(userId)) > 0) return void seeded.add(userId);
    await workoutRepository.insertExercisesIgnoreDuplicates(
      userId,
      STARTER_EXERCISES.map((e) => ({ name: e.name, muscleGroup: e.muscleGroup, equipment: e.equipment, kind: e.kind ?? "strength" }))
    );
  },

  async overview(userId: string, today: string): Promise<WorkoutsOverview> {
    const monday = weekStart(today);
    const [active, profile, exerciseRows, routineRows, workoutRows, completedDates, weekRows] = await Promise.all([
      workoutRepository.findActiveWorkout(userId),
      healthProfileRepository.find(userId),
      workoutRepository.listExercises(userId),
      workoutRepository.listRoutines(userId),
      workoutRepository.listWorkouts(userId, 25),
      workoutRepository.completedDates(userId),
      workoutRepository.workoutsInRange(userId, monday, addDays(monday, 6)),
    ]);
    const exercises = exerciseRows.map(toExercise);
    const nameOf = new Map(exercises.map((e) => [e.id, e.name]));

    const ids = Array.from(new Set([...workoutRows.map((w) => w.id), ...weekRows.map((w) => w.id)]));
    const [sets, routineExercises, history] = await Promise.all([
      workoutRepository.setsForWorkouts(userId, ids),
      workoutRepository.routineExercisesFor(userId, routineRows.map((r) => r.id)),
      workoutRepository.historySets(userId),
    ]);

    const summarize = (w: (typeof workoutRows)[number]): WorkoutSummary => {
      const own = sets.filter((s) => s.workoutId === w.id);
      const names: string[] = [];
      for (const s of own) {
        const n = nameOf.get(s.exerciseId);
        if (n && !names.includes(n)) names.push(n);
      }
      return {
        id: w.id,
        name: w.name,
        date: w.date,
        status: w.status,
        durationMin: durationMin(w.startedAt, w.endedAt),
        volumeKg: totalVolume(own),
        exerciseNames: names,
        setCount: own.filter((s) => s.done).length,
      };
    };

    const weekSummaries = weekRows.map(summarize);
    const records = Array.from(personalRecords(history).values())
      .map((pr) => {
        const ex = exercises.find((e) => e.id === pr.exerciseId);
        return ex ? { ...pr, name: ex.name, muscleGroup: ex.muscleGroup } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => (b.bestE1rm?.value ?? 0) - (a.bestE1rm?.value ?? 0));

    return {
      active: active ? { id: active.id, name: active.name } : null,
      week: {
        count: weekRows.length,
        target: profile?.weeklyWorkoutTarget ?? null,
        volumeKg: weekSummaries.reduce((s, w) => s + w.volumeKg, 0),
        minutes: weekSummaries.reduce((s, w) => s + (w.durationMin ?? 0), 0),
      },
      streak: currentStreak(completedDates, today),
      history: workoutRows.map(summarize),
      routines: routineRows.map((r) => ({
        id: r.id,
        name: r.name,
        notes: r.notes,
        exercises: routineExercises
          .filter((re) => re.routineId === r.id)
          .map((re) => ({ exerciseId: re.exerciseId, name: nameOf.get(re.exerciseId) ?? "Unknown", targetSets: re.targetSets, targetReps: re.targetReps })),
      })),
      exercises,
      records,
    };
  },

  // Completed workouts and volume per calendar week (Mon–Sun) for the last `weeks` weeks, oldest first.
  async weeklyTrend(userId: string, today: string, weeks = 8) {
    const firstMonday = addDays(weekStart(today), -7 * (weeks - 1));
    const rows = await workoutRepository.workoutsInRange(userId, firstMonday, addDays(weekStart(today), 6));
    const sets = await workoutRepository.setsForWorkouts(userId, rows.map((w) => w.id));
    return Array.from({ length: weeks }, (_, i) => {
      const start = addDays(firstMonday, i * 7);
      const end = addDays(start, 6);
      const inWeek = rows.filter((w) => w.date >= start && w.date <= end);
      const ids = new Set(inWeek.map((w) => w.id));
      return { weekStart: start, count: inWeek.length, volumeKg: totalVolume(sets.filter((s) => ids.has(s.workoutId))) };
    });
  },

  // One workout in progress at a time: starting again resumes it.
  async start(userId: string, input: { date: string; name?: string; routineId?: string }) {
    const active = await workoutRepository.findActiveWorkout(userId);
    if (active) return { id: active.id, resumed: true };

    return db.transaction(async (tx) => {
      const routine = input.routineId ? await workoutRepository.findRoutine(userId, input.routineId, tx) : null;
      if (input.routineId && !routine) return null;
      const workout = await workoutRepository.insertWorkout(
        userId,
        { date: input.date, name: input.name?.trim() || routine?.name || "Workout", routineId: routine?.id ?? null },
        tx
      );
      if (routine) {
        const rows = await workoutRepository.routineExercisesFor(userId, [routine.id], tx);
        const { previous } = await previousByExercise(userId, rows.map((r) => r.exerciseId));
        const sets: SetValues[] = [];
        rows.forEach((r, order) => {
          const prev = previous.get(r.exerciseId) ?? [];
          for (let i = 0; i < r.targetSets; i++) {
            const p = prev[i] ?? prev[prev.length - 1];
            sets.push({
              exerciseId: r.exerciseId,
              exerciseOrder: order,
              setNumber: i + 1,
              reps: p?.reps ?? r.targetReps,
              weightKg: p?.weightKg ?? null,
              durationSec: p?.durationSec ?? null,
              distanceKm: p?.distanceKm ?? null,
            });
          }
        });
        await workoutRepository.insertSets(userId, workout.id, sets, tx);
      }
      return { id: workout.id, resumed: false };
    });
  },

  async logger(userId: string, id: string): Promise<LoggerData | null> {
    const workout = await workoutRepository.findWorkout(userId, id);
    if (!workout) return null;
    const [sets, exerciseRows] = await Promise.all([workoutRepository.setsForWorkouts(userId, [id]), workoutRepository.listExercises(userId)]);
    const byId = new Map(exerciseRows.map((e) => [e.id, e]));

    const order: string[] = [];
    for (const s of sets) if (!order.includes(s.exerciseId)) order.push(s.exerciseId);
    const { previous, history } = await previousByExercise(userId, order, id);
    const records = personalRecords(history);

    const exercises: LoggerExercise[] = [];
    for (const exerciseId of order) {
      const ex = byId.get(exerciseId);
      if (!ex) continue;
      const pr = records.get(exerciseId);
      exercises.push({
        exercise: toExercise(ex),
        sets: sets.filter((s) => s.exerciseId === exerciseId).map(toSet),
        previous: (previous.get(exerciseId) ?? []).map((p) => ({ reps: p.reps, weightKg: p.weightKg, durationSec: p.durationSec, distanceKm: p.distanceKm })),
        prior: pr && pr.maxWeight && pr.bestE1rm ? { maxWeight: pr.maxWeight.weightKg, bestE1rm: pr.bestE1rm.value } : null,
      });
    }

    return {
      workout: {
        id: workout.id,
        name: workout.name,
        date: workout.date,
        startedAt: workout.startedAt.toISOString(),
        endedAt: workout.endedAt ? workout.endedAt.toISOString() : null,
        notes: workout.notes,
        status: workout.status,
      },
      exercises,
    };
  },

  // Adds an exercise at the end, prefilled from the last time it was done.
  async addExercise(userId: string, workoutId: string, exerciseId: string) {
    const [workout, exercise] = await Promise.all([workoutRepository.findWorkout(userId, workoutId), workoutRepository.findExercise(userId, exerciseId)]);
    if (!workout || !exercise) return null;
    const existing = await workoutRepository.setsForWorkouts(userId, [workoutId]);
    if (existing.some((s) => s.exerciseId === exerciseId)) return { duplicate: true as const };
    const order = existing.reduce((m, s) => Math.max(m, s.exerciseOrder), -1) + 1;
    const { previous } = await previousByExercise(userId, [exerciseId], workoutId);
    const prev = previous.get(exerciseId) ?? [];
    const count = exercise.kind === "cardio" ? 1 : Math.max(prev.length, 3);
    const rows: SetValues[] = Array.from({ length: count }, (_, i) => {
      const p = prev[i] ?? prev[prev.length - 1];
      return { exerciseId, exerciseOrder: order, setNumber: i + 1, reps: p?.reps ?? null, weightKg: p?.weightKg ?? null, durationSec: p?.durationSec ?? null, distanceKm: p?.distanceKm ?? null };
    });
    const inserted = await workoutRepository.insertSets(userId, workoutId, rows);
    return { duplicate: false as const, sets: inserted.map(toSet) };
  },

  async addSet(userId: string, workoutId: string, exerciseId: string) {
    const workout = await workoutRepository.findWorkout(userId, workoutId);
    if (!workout) return null;
    const existing = (await workoutRepository.setsForWorkouts(userId, [workoutId])).filter((s) => s.exerciseId === exerciseId);
    if (existing.length === 0) return null;
    const last = existing[existing.length - 1];
    const [row] = await workoutRepository.insertSets(userId, workoutId, [
      {
        exerciseId,
        exerciseOrder: last.exerciseOrder,
        setNumber: last.setNumber + 1,
        reps: last.reps,
        weightKg: last.weightKg,
        durationSec: last.durationSec,
        distanceKm: last.distanceKm,
      },
    ]);
    return toSet(row);
  },

  async finish(userId: string, id: string, notes?: string | null) {
    const workout = await workoutRepository.findWorkout(userId, id);
    if (!workout) return null;
    await workoutRepository.deleteEmptyUndoneSets(userId, id);
    const updated = await workoutRepository.updateWorkout(userId, id, {
      status: "completed",
      endedAt: workout.endedAt ?? new Date(),
      ...(notes !== undefined ? { notes: notes || null } : {}),
    });
    const sets = await workoutRepository.setsForWorkouts(userId, [id]);
    return { workout: updated, volumeKg: totalVolume(sets), sets: sets.filter((s) => s.done).length, minutes: durationMin(workout.startedAt, updated?.endedAt ?? new Date()) };
  },

  // Everything needed to bring a deleted workout back with Undo.
  async snapshot(userId: string, id: string) {
    const workout = await workoutRepository.findWorkout(userId, id);
    if (!workout) return null;
    const sets = await workoutRepository.setsForWorkouts(userId, [id]);
    return {
      date: workout.date,
      name: workout.name,
      notes: workout.notes,
      routineId: workout.routineId,
      status: workout.status,
      startedAt: workout.startedAt.toISOString(),
      endedAt: workout.endedAt ? workout.endedAt.toISOString() : null,
      sets: sets.map((s) => ({
        exerciseId: s.exerciseId,
        exerciseOrder: s.exerciseOrder,
        setNumber: s.setNumber,
        reps: s.reps,
        weightKg: s.weightKg,
        durationSec: s.durationSec,
        distanceKm: s.distanceKm,
        isWarmup: s.isWarmup,
        done: s.done,
      })),
    };
  },

  async restore(
    userId: string,
    snap: {
      date: string;
      name: string;
      notes: string | null;
      routineId: string | null;
      status: WorkoutStatus;
      startedAt: string;
      endedAt: string | null;
      sets: (SetValues & { exerciseId: string })[];
    }
  ) {
    return db.transaction(async (tx) => {
      const routine = snap.routineId ? await workoutRepository.findRoutine(userId, snap.routineId, tx) : null;
      const workout = await workoutRepository.insertWorkout(
        userId,
        {
          date: snap.date,
          name: snap.name,
          notes: snap.notes,
          routineId: routine?.id ?? null,
          status: snap.status,
          startedAt: new Date(snap.startedAt),
          endedAt: snap.endedAt ? new Date(snap.endedAt) : null,
        },
        tx
      );
      // only re-attach exercises that still exist and belong to the user
      const valid: SetValues[] = [];
      for (const s of snap.sets) {
        if (await workoutRepository.findExercise(userId, s.exerciseId, tx)) valid.push(s);
      }
      await workoutRepository.insertSets(userId, workout.id, valid, tx);
      return workout;
    });
  },

  async saveRoutine(
    userId: string,
    input: { id?: string; name: string; notes?: string | null; exercises: { exerciseId: string; targetSets: number; targetReps: number }[] }
  ) {
    return db.transaction(async (tx) => {
      for (const e of input.exercises) {
        if (!(await workoutRepository.findExercise(userId, e.exerciseId, tx))) return null;
      }
      let routine;
      if (input.id) {
        routine = await workoutRepository.updateRoutine(userId, input.id, input.name, input.notes ?? null, tx);
        if (!routine) return null;
        await workoutRepository.clearRoutineExercises(userId, routine.id, tx);
      } else {
        routine = await workoutRepository.insertRoutine(userId, input.name, input.notes ?? null, tx);
      }
      await workoutRepository.insertRoutineExercises(userId, routine.id, input.exercises, tx);
      return routine;
    });
  },
};
