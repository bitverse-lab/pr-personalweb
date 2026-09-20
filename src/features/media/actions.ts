"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/server/auth";
import { isStorageConfigured, StorageNotConfiguredError } from "@/server/storage/client";
import { mediaService, type MediaDto } from "@/server/services/media-service";
import type { ActionResult } from "@/types/action-result";

const requestSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
  purpose: z.enum(["editor", "cover", "profile", "document", "library"]),
});
const idSchema = z.object({ id: z.uuid() });

const notConfigured = { ok: false as const, error: new StorageNotConfiguredError().message };

export async function getStorageStatus() {
  await requireUserId();
  return { configured: isStorageConfigured() };
}

export async function requestUpload(input: unknown): Promise<ActionResult<{ mediaId: string; uploadUrl: string }>> {
  const userId = await requireUserId();
  if (!isStorageConfigured()) return notConfigured;
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid file" };
  return mediaService.requestUpload(userId, parsed.data);
}

export async function confirmUpload(id: string): Promise<ActionResult<MediaDto>> {
  const userId = await requireUserId();
  if (!isStorageConfigured()) return notConfigured;
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid upload" };
  const result = await mediaService.confirmUpload(userId, parsed.data.id);
  if (result.ok) revalidatePath("/me/media");
  return result;
}

export async function listMedia(kind?: "image" | "document"): Promise<MediaDto[]> {
  const userId = await requireUserId();
  if (!isStorageConfigured()) return [];
  return mediaService.list(userId, kind);
}

export async function getMediaReferences(id: string) {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return null;
  return mediaService.references(userId, parsed.data.id);
}

export async function deleteMedia(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (!isStorageConfigured()) return notConfigured;
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid file" };
  const result = await mediaService.remove(userId, parsed.data.id);
  if (result.ok) {
    revalidatePath("/me/media");
    revalidatePath("/me/career", "layout");
  }
  return result;
}

export async function getDocumentDownloadUrl(id: string): Promise<ActionResult<{ url: string }>> {
  const userId = await requireUserId();
  if (!isStorageConfigured()) return notConfigured;
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid file" };
  return mediaService.signedDownloadUrl(userId, parsed.data.id);
}

export async function getMediaUsage() {
  const userId = await requireUserId();
  return mediaService.usage(userId);
}
