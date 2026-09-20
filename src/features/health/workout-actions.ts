"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { workoutRepository } from "@/server/repositories/workout-repository";
import { workoutService, type ExerciseDto, type SetDto } from "@/server/services/workout-service";
import { todayInUserTz } from "@/lib/timezone";
import {
  exerciseSchema,
  finishWorkoutSchema,
  idSchema,
  restoreWorkoutSchema,
  saveRoutineSchema,
  startWorkoutSchema,
  updateExerciseSchema,
  updateSetSchema,
  updateWorkoutSchema,
  workoutExerciseSchema,
} from "./schema";
import type { ActionResult } from "@/types/action-result";

function revalidateWorkouts() {
  revalidatePath("/me/health", "layout");
  revalidatePath("/me");
}

const invalid = (e: { issues: { message: string }[] }) => ({ ok: false as const, error: e.issues[0]?.message ?? "Invalid input" });

// ---- queries ----

export async function getWorkoutsOverview() {
  const userId = await requireUserId();
  await workoutService.ensureSeeded(userId);
  return workoutService.overview(userId, await todayInUserTz());
}

export async function getWorkoutLogger(id: string) {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return null;
  await workoutService.ensureSeeded(userId);
  return workoutService.logger(userId, parsed.data.id);
}

export async function getExerciseList(): Promise<ExerciseDto[]> {
  const userId = await requireUserId();
  await workoutService.ensureSeeded(userId);
  const rows = await workoutRepository.listExercises(userId);
  return rows.map((e) => ({ id: e.id, name: e.name, muscleGroup: e.muscleGroup, equipment: e.equipment, kind: e.kind, isCustom: e.isCustom }));
}

// ---- workouts ----

export async function startWorkout(input: unknown): Promise<ActionResult<{ id: string; resumed: boolean }>> {
  const userId = await requireUserId();
  const parsed = startWorkoutSchema.safeParse(input ?? {});
  if (!parsed.success) return invalid(parsed.error);
  await workoutService.ensureSeeded(userId);
  const result = await workoutService.start(userId, { ...parsed.data, date: await todayInUserTz() });
  if (!result) return { ok: false, error: "Routine not found" };
  revalidateWorkouts();
  return { ok: true, data: result };
}

export async function updateWorkoutMeta(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = updateWorkoutSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...rest } = parsed.data;
  const row = await workoutRepository.updateWorkout(userId, id, {
    ...(rest.name ? { name: rest.name } : {}),
    ...(rest.notes !== undefined ? { notes: rest.notes || null } : {}),
  });
  if (!row) return { ok: false, error: "Workout not found" };
  return { ok: true, data: { id: row.id } };
}

export async function finishWorkout(input: unknown): Promise<ActionResult<{ volumeKg: number; sets: number; minutes: number | null }>> {
  const userId = await requireUserId();
  const parsed = finishWorkoutSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const result = await workoutService.finish(userId, parsed.data.id, parsed.data.notes);
  if (!result) return { ok: false, error: "Workout not found" };
  revalidateWorkouts();
  return { ok: true, data: { volumeKg: result.volumeKg, sets: result.sets, minutes: result.minutes } };
}

export async function deleteWorkout(id: string) {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false as const, error: "Invalid workout" };
  const snapshot = await workoutService.snapshot(userId, parsed.data.id);
  if (!snapshot) return { ok: false as const, error: "Workout not found" };
  await workoutRepository.deleteWorkout(userId, parsed.data.id);
  revalidateWorkouts();
  return { ok: true as const, data: snapshot };
}

export async function restoreWorkout(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = restoreWorkoutSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const workout = await workoutService.restore(userId, parsed.data);
  revalidateWorkouts();
  return { ok: true, data: { id: workout.id } };
}

// ---- sets & exercises inside a workout (no revalidation: the logger owns its state while open) ----

export async function addExerciseToWorkout(input: unknown): Promise<ActionResult<{ sets: SetDto[] }>> {
  const userId = await requireUserId();
  const parsed = workoutExerciseSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const result = await workoutService.addExercise(userId, parsed.data.workoutId, parsed.data.exerciseId);
  if (!result) return { ok: false, error: "Workout or exercise not found" };
  if (result.duplicate) return { ok: false, error: "That exercise is already in this workout" };
  return { ok: true, data: { sets: result.sets } };
}

export async function addSetToExercise(input: unknown): Promise<ActionResult<{ set: SetDto }>> {
  const userId = await requireUserId();
  const parsed = workoutExerciseSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const set = await workoutService.addSet(userId, parsed.data.workoutId, parsed.data.exerciseId);
  if (!set) return { ok: false, error: "Exercise not found in this workout" };
  return { ok: true, data: { set } };
}

export async function updateSet(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = updateSetSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...values } = parsed.data;
  const clean = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined));
  const row = await workoutRepository.updateSet(userId, id, clean);
  if (!row) return { ok: false, error: "Set not found" };
  return { ok: true, data: { id: row.id } };
}

export async function deleteSet(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid set" };
  const row = await workoutRepository.deleteSet(userId, parsed.data.id);
  if (!row) return { ok: false, error: "Set not found" };
  return { ok: true, data: { id: row.id } };
}

export async function removeExerciseFromWorkout(input: unknown): Promise<ActionResult<{ ok: true }>> {
  const userId = await requireUserId();
  const parsed = workoutExerciseSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await workoutRepository.deleteExerciseSets(userId, parsed.data.workoutId, parsed.data.exerciseId);
  return { ok: true, data: { ok: true } };
}

// ---- routines ----

export async function saveRoutine(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = saveRoutineSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const routine = await workoutService.saveRoutine(userId, parsed.data);
  if (!routine) return { ok: false, error: "Routine or exercise not found" };
  revalidateWorkouts();
  return { ok: true, data: { id: routine.id } };
}

export async function deleteRoutine(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid routine" };
  const row = await workoutRepository.deleteRoutine(userId, parsed.data.id);
  if (!row) return { ok: false, error: "Routine not found" };
  revalidateWorkouts();
  return { ok: true, data: { id: row.id } };
}

// ---- exercise library ----

export async function createExercise(input: unknown): Promise<ActionResult<ExerciseDto>> {
  const userId = await requireUserId();
  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const e = await workoutRepository.createExercise(userId, parsed.data);
    revalidateWorkouts();
    return { ok: true, data: { id: e.id, name: e.name, muscleGroup: e.muscleGroup, equipment: e.equipment, kind: e.kind, isCustom: e.isCustom } };
  } catch {
    return { ok: false, error: "An exercise with that name already exists" };
  }
}

export async function updateExercise(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = updateExerciseSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const e = await workoutRepository.updateExercise(userId, parsed.data.id, parsed.data.data);
    if (!e) return { ok: false, error: "Exercise not found" };
    revalidateWorkouts();
    return { ok: true, data: { id: e.id } };
  } catch {
    return { ok: false, error: "An exercise with that name already exists" };
  }
}

export async function deleteExercise(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid exercise" };
  const row = await workoutRepository.deleteExercise(userId, parsed.data.id);
  if (!row) return { ok: false, error: "Exercise not found" };
  revalidateWorkouts();
  return { ok: true, data: { id: row.id } };
}
