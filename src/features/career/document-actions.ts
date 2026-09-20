"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/server/auth";
import { documentRepository } from "@/server/repositories/document-repository";
import { isStorageConfigured } from "@/server/storage/client";
import { mediaService } from "@/server/services/media-service";
import type { DocumentType } from "@/db/schema/media";
import type { ActionResult } from "@/types/action-result";

const typeSchema = z.enum(["cv", "cover_letter", "offer", "other"]);
const attachSchema = z.object({ applicationId: z.uuid(), mediaId: z.uuid(), type: typeSchema, note: z.string().trim().max(200).nullish() });
const updateSchema = z.object({ id: z.uuid(), type: typeSchema, note: z.string().trim().max(200).nullish() });
const idSchema = z.object({ id: z.uuid() });

export interface ApplicationDocumentDto {
  id: string;
  mediaId: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  type: DocumentType;
  note: string | null;
  createdAt: string;
}

const invalid = (e: { issues: { message: string }[] }) => ({ ok: false as const, error: e.issues[0]?.message ?? "Invalid input" });
const revalidate = (applicationId: string) => revalidatePath(`/me/career/applications/${applicationId}`);

export async function getApplicationDocuments(applicationId: string): Promise<ApplicationDocumentDto[]> {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id: applicationId });
  if (!parsed.success) return [];
  const rows = await documentRepository.listForApplication(userId, parsed.data.id);
  return rows.map(({ doc, media }) => ({
    id: doc.id,
    mediaId: media.id,
    name: media.originalName,
    sizeBytes: media.sizeBytes,
    mimeType: media.mimeType,
    type: doc.type,
    note: doc.note,
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function attachDocument(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = attachSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await documentRepository.attach(userId, { ...parsed.data, note: parsed.data.note || null });
  if (!row) return { ok: false, error: "Could not attach that file" };
  revalidate(parsed.data.applicationId);
  return { ok: true, data: { id: row.id } };
}

export async function updateDocument(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await documentRepository.update(userId, parsed.data.id, { type: parsed.data.type, note: parsed.data.note || null });
  if (!row) return { ok: false, error: "Document not found" };
  revalidate(row.applicationId);
  return { ok: true, data: { id: row.id } };
}

// Removes the link and the stored file: nothing else uses a private application document.
export async function removeDocument(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (!isStorageConfigured()) return { ok: false, error: "File storage is not configured" };
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid document" };
  const doc = await documentRepository.find(userId, parsed.data.id);
  if (!doc) return { ok: false, error: "Document not found" };
  const result = await mediaService.remove(userId, doc.mediaId); // cascades the link row
  if (!result.ok) return result;
  revalidate(doc.applicationId);
  return { ok: true, data: { id: doc.id } };
}
