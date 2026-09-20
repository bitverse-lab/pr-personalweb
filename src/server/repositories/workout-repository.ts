import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { exercises, routineExercises, routines, workoutSets, workouts } from "@/db/schema";
import type { Equipment, ExerciseKind, MuscleGroup, WorkoutStatus } from "@/db/schema/health";

export type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  kind: ExerciseKind;
}

export interface SetValues {
  exerciseId: string;
  exerciseOrder: number;
  setNumber: number;
  reps?: number | null;
  weightKg?: number | null;
  durationSec?: number | null;
  distanceKm?: number | null;
  isWarmup?: boolean;
  done?: boolean;
}

export const workoutRepository = {
  // ---- exercises ----
  listExercises(userId: string) {
    return db.select().from(exercises).where(eq(exercises.userId, userId)).orderBy(asc(exercises.name));
  },

  findExercise(userId: string, id: string, ex: DbExecutor = db) {
    return ex.query.exercises.findFirst({ where: and(eq(exercises.id, id), eq(exercises.userId, userId)) });
  },

  countExercises(userId: string) {
    return db
      .select({ n: sql<number>`count(*)::int` })
      .from(exercises)
      .where(eq(exercises.userId, userId))
      .then((r) => r[0]?.n ?? 0);
  },

  insertExercisesIgnoreDuplicates(userId: string, rows: ExerciseInput[]) {
    return db
      .insert(exercises)
      .values(rows.map((r) => ({ userId, ...r })))
      .onConflictDoNothing()
      .then(() => undefined);
  },

  createExercise(userId: string, input: ExerciseInput) {
    return db
      .insert(exercises)
      .values({ userId, ...input, isCustom: true })
      .returning()
      .then((r) => r[0]);
  },

  updateExercise(userId: string, id: string, input: Partial<ExerciseInput>) {
    return db
      .update(exercises)
      .set(input)
      .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  deleteExercise(userId: string, id: string) {
    return db
      .delete(exercises)
      .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  // ---- routines ----
  listRoutines(userId: string) {
    return db.select().from(routines).where(eq(routines.userId, userId)).orderBy(asc(routines.name));
  },

  findRoutine(userId: string, id: string, ex: DbExecutor = db) {
    return ex.query.routines.findFirst({ where: and(eq(routines.id, id), eq(routines.userId, userId)) });
  },

  routineExercisesFor(userId: string, routineIds: string[], ex: DbExecutor = db) {
    if (routineIds.length === 0) return Promise.resolve([]);
    return ex
      .select()
      .from(routineExercises)
      .where(and(eq(routineExercises.userId, userId), inArray(routineExercises.routineId, routineIds)))
      .orderBy(asc(routineExercises.position));
  },

  insertRoutine(userId: string, name: string, notes: string | null, ex: DbExecutor = db) {
    return ex
      .insert(routines)
      .values({ userId, name, notes })
      .returning()
      .then((r) => r[0]);
  },

  updateRoutine(userId: string, id: string, name: string, notes: string | null, ex: DbExecutor = db) {
    return ex
      .update(routines)
      .set({ name, notes })
      .where(and(eq(routines.id, id), eq(routines.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  deleteRoutine(userId: string, id: string) {
    return db
      .delete(routines)
      .where(and(eq(routines.id, id), eq(routines.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  clearRoutineExercises(userId: string, routineId: string, ex: DbExecutor = db) {
    return ex
      .delete(routineExercises)
      .where(and(eq(routineExercises.routineId, routineId), eq(routineExercises.userId, userId)))
      .then(() => undefined);
  },

  insertRoutineExercises(
    userId: string,
    routineId: string,
    rows: { exerciseId: string; targetSets: number; targetReps: number }[],
    ex: DbExecutor = db
  ) {
    if (rows.length === 0) return Promise.resolve();
    return ex
      .insert(routineExercises)
      .values(rows.map((r, i) => ({ userId, routineId, position: i, ...r })))
      .then(() => undefined);
  },

  // ---- workouts ----
  insertWorkout(
    userId: string,
    values: { date: string; name: string; routineId?: string | null; startedAt?: Date; endedAt?: Date | null; notes?: string | null; status?: WorkoutStatus },
    ex: DbExecutor = db
  ) {
    return ex
      .insert(workouts)
      .values({ userId, ...values })
      .returning()
      .then((r) => r[0]);
  },

  findWorkout(userId: string, id: string, ex: DbExecutor = db) {
    return ex.query.workouts.findFirst({ where: and(eq(workouts.id, id), eq(workouts.userId, userId)) });
  },

  findActiveWorkout(userId: string) {
    return db.query.workouts.findFirst({
      where: and(eq(workouts.userId, userId), eq(workouts.status, "in_progress")),
      orderBy: [desc(workouts.startedAt)],
    });
  },

  listWorkouts(userId: string, limit = 30) {
    return db.select().from(workouts).where(eq(workouts.userId, userId)).orderBy(desc(workouts.date), desc(workouts.startedAt)).limit(limit);
  },

  workoutsInRange(userId: string, from: string, to: string) {
    return db
      .select()
      .from(workouts)
      .where(and(eq(workouts.userId, userId), eq(workouts.status, "completed"), gte(workouts.date, from), lte(workouts.date, to)));
  },

  completedDates(userId: string) {
    return db
      .selectDistinct({ date: workouts.date })
      .from(workouts)
      .where(and(eq(workouts.userId, userId), eq(workouts.status, "completed")))
      .then((r) => r.map((x) => x.date));
  },

  updateWorkout(userId: string, id: string, values: Partial<{ name: string; notes: string | null; endedAt: Date | null; status: WorkoutStatus }>) {
    return db
      .update(workouts)
      .set(values)
      .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  deleteWorkout(userId: string, id: string) {
    return db
      .delete(workouts)
      .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  // ---- sets ----
  setsForWorkouts(userId: string, workoutIds: string[]) {
    if (workoutIds.length === 0) return Promise.resolve([]);
    return db
      .select()
      .from(workoutSets)
      .where(and(eq(workoutSets.userId, userId), inArray(workoutSets.workoutId, workoutIds)))
      .orderBy(asc(workoutSets.exerciseOrder), asc(workoutSets.setNumber));
  },

  insertSets(userId: string, workoutId: string, rows: SetValues[], ex: DbExecutor = db) {
    if (rows.length === 0) return Promise.resolve([]);
    return ex
      .insert(workoutSets)
      .values(rows.map((r) => ({ userId, workoutId, ...r })))
      .returning();
  },

  updateSet(userId: string, id: string, values: Partial<Omit<SetValues, "exerciseId" | "exerciseOrder">>) {
    return db
      .update(workoutSets)
      .set(values)
      .where(and(eq(workoutSets.id, id), eq(workoutSets.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  deleteSet(userId: string, id: string) {
    return db
      .delete(workoutSets)
      .where(and(eq(workoutSets.id, id), eq(workoutSets.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  deleteExerciseSets(userId: string, workoutId: string, exerciseId: string) {
    return db
      .delete(workoutSets)
      .where(and(eq(workoutSets.userId, userId), eq(workoutSets.workoutId, workoutId), eq(workoutSets.exerciseId, exerciseId)))
      .then(() => undefined);
  },

  // Sets that are pure placeholders (nothing entered, never ticked) are dropped when a workout is finished.
  deleteEmptyUndoneSets(userId: string, workoutId: string) {
    return db
      .delete(workoutSets)
      .where(
        and(
          eq(workoutSets.userId, userId),
          eq(workoutSets.workoutId, workoutId),
          eq(workoutSets.done, false),
          sql`${workoutSets.reps} is null and ${workoutSets.weightKg} is null and ${workoutSets.durationSec} is null and ${workoutSets.distanceKm} is null`
        )
      )
      .then(() => undefined);
  },

  // Every completed, non-warm-up set from completed workouts (for PRs and "previous" hints).
  historySets(userId: string, excludeWorkoutId?: string) {
    return db
      .select({
        exerciseId: workoutSets.exerciseId,
        workoutId: workoutSets.workoutId,
        setNumber: workoutSets.setNumber,
        reps: workoutSets.reps,
        weightKg: workoutSets.weightKg,
        durationSec: workoutSets.durationSec,
        distanceKm: workoutSets.distanceKm,
        date: workouts.date,
        startedAt: workouts.startedAt,
      })
      .from(workoutSets)
      .innerJoin(workouts, eq(workouts.id, workoutSets.workoutId))
      .where(
        and(
          eq(workoutSets.userId, userId),
          eq(workoutSets.done, true),
          eq(workoutSets.isWarmup, false),
          eq(workouts.status, "completed"),
          excludeWorkoutId ? sql`${workouts.id} <> ${excludeWorkoutId}` : undefined
        )
      )
      .orderBy(desc(workouts.date), desc(workouts.startedAt), asc(workoutSets.setNumber));
  },
};
