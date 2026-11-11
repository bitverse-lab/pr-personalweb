"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ROLES } from "@/features/roles/roles";
import { revalidateSiteData } from "@/lib/data/site-cache";
import { requireUserId } from "@/server/auth";
import { cvFileService, type CvFileDto } from "@/server/services/cv-file-service";
import { isStorageConfigured, StorageNotConfiguredError } from "@/server/storage/client";
import type { ActionResult } from "@/types/action-result";

const roleSchema = z.enum(ROLES.map((r) => r.slug) as [string, ...string[]], { error: "Unknown role" });
const setSchema = z.object({ role: roleSchema, mediaId: z.uuid() });
const removeSchema = z.object({ role: roleSchema });

function revalidateCv() {
  revalidateSiteData();
  revalidatePath("/me/settings/profile");
  revalidatePath("/me/media");
}

export async function listMyCvFiles(): Promise<CvFileDto[]> {
  const userId = await requireUserId();
  return cvFileService.list(userId);
}

export async function setCvFile(input: unknown): Promise<ActionResult<{ role: string }>> {
  const userId = await requireUserId();
  if (!isStorageConfigured()) return { ok: false, error: new StorageNotConfiguredError().message };
  const parsed = setSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const result = await cvFileService.set(userId, parsed.data.role, parsed.data.mediaId);
  if (result.ok) revalidateCv();
  return result;
}

export async function removeCvFile(input: unknown): Promise<ActionResult<{ role: string }>> {
  const userId = await requireUserId();
  if (!isStorageConfigured()) return { ok: false, error: new StorageNotConfiguredError().message };
  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const result = await cvFileService.remove(userId, parsed.data.role);
  if (result.ok) revalidateCv();
  return result;
}
