"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { weightRepository } from "@/server/repositories/weight-repository";
import { weightService, type WeightEntryDto } from "@/server/services/weight-service";
import { todayInUserTz } from "@/lib/timezone";
import {
  logWeightSchema,
  weightIdSchema,
  weightRangeSchema,
  logMeasurementSchema,
} from "./schema";
import type { ActionResult } from "@/types/action-result";

function revalidateHealth() {
  revalidatePath("/me/health", "layout");
  revalidatePath("/me");
}

export async function getWeightOverview(range?: string) {
  const userId = await requireUserId();
  const parsed = weightRangeSchema.catch("90d").parse(range);
  return weightService.overview(userId, parsed, await todayInUserTz());
}

export async function logWeight(input: unknown): Promise<ActionResult<WeightEntryDto>> {
  const userId = await requireUserId();
  const parsed = logWeightSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const row = await weightRepository.upsert(userId, parsed.data);
  revalidateHealth();
  return { ok: true, data: { id: row.id, date: row.date, weightKg: row.weightKg, bodyFatPct: row.bodyFatPct, note: row.note } };
}

export async function deleteWeight(id: string): Promise<ActionResult<WeightEntryDto>> {
  const userId = await requireUserId();
  const parsed = weightIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid entry" };
  const row = await weightRepository.delete(parsed.data.id, userId);
  if (!row) return { ok: false, error: "Entry not found" };
  revalidateHealth();
  return { ok: true, data: { id: row.id, date: row.date, weightKg: row.weightKg, bodyFatPct: row.bodyFatPct, note: row.note } };
}

// --- Body measurements ---

export async function getMeasurements() {
  const userId = await requireUserId();
  return weightRepository.listMeasurements(userId);
}

export async function logMeasurement(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = logMeasurementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const row = await weightRepository.upsertMeasurement(userId, parsed.data);
  revalidateHealth();
  return { ok: true, data: { id: row.id } };
}

export async function deleteMeasurement(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = weightIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid entry" };
  const row = await weightRepository.deleteMeasurement(parsed.data.id, userId);
  if (!row) return { ok: false, error: "Entry not found" };
  revalidateHealth();
  return { ok: true, data: { id: row.id } };
}
