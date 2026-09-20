"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { healthProfileRepository } from "@/server/repositories/health-profile-repository";
import { saveProfileSchema } from "./schema";
import type { ActionResult } from "@/types/action-result";

export async function getHealthProfile() {
  const userId = await requireUserId();
  return (await healthProfileRepository.find(userId)) ?? null;
}

export async function saveHealthProfile(input: unknown): Promise<ActionResult<{ ok: true }>> {
  const userId = await requireUserId();
  const parsed = saveProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const v = parsed.data;
  await healthProfileRepository.upsert(userId, {
    heightCm: v.heightCm ?? null,
    sex: v.sex ?? null,
    birthDate: v.birthDate ?? null,
    activityLevel: v.activityLevel,
    goalType: v.goalType,
    targetWeightKg: v.targetWeightKg ?? null,
    weeklyRateKg: v.weeklyRateKg ?? null,
    dailyCalories: v.dailyCalories ?? null,
    proteinG: v.proteinG ?? null,
    carbsG: v.carbsG ?? null,
    fatG: v.fatG ?? null,
    waterMl: v.waterMl ?? null,
    weeklyWorkoutTarget: v.weeklyWorkoutTarget ?? null,
  });
  revalidatePath("/me/health", "layout");
  revalidatePath("/me");
  return { ok: true, data: { ok: true } };
}
