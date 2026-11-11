import { roleBySlug } from "@/features/roles/roles";
import { cvFileRepository } from "@/server/repositories/cv-file-repository";
import { mediaRepository } from "@/server/repositories/media-repository";
import { mediaService } from "@/server/services/media-service";
import { getStorageClient } from "@/server/storage/client";
import type { ServiceResult } from "./article-service";

export interface CvFileDto {
  role: string;
  title: string;
  fileName: string;
  sizeBytes: number;
  updatedAt: string;
}

/** How long a visitor's download link stays valid. Long enough for a slow phone to start it. */
const LINK_SECONDS = 300;

export const cvFileService = {
  async list(userId: string): Promise<CvFileDto[]> {
    const rows = await cvFileRepository.list(userId);
    return rows.flatMap((r) => {
      const role = roleBySlug(r.role);
      return role ? [{ role: r.role, title: role.title, fileName: r.fileName, sizeBytes: r.sizeBytes, updatedAt: r.updatedAt.toISOString() }] : [];
    });
  },

  /** Uses an uploaded, verified PDF as the CV for a role; the file it replaces is deleted. */
  async set(userId: string, role: string, mediaId: string): Promise<ServiceResult<{ role: string }>> {
    const file = await mediaRepository.find(userId, mediaId);
    if (!file || file.status !== "ready") return { ok: false, error: "Upload not found" };
    // The type was verified from the bytes on upload (sniffMime); a DOCX is not offered to visitors.
    if (file.mimeType !== "application/pdf") return { ok: false, error: "A CV must be a PDF file" };
    const replaced = await cvFileRepository.upsert(userId, role, mediaId);
    if (replaced) await mediaService.remove(userId, replaced);
    return { ok: true, data: { role } };
  },

  async remove(userId: string, role: string): Promise<ServiceResult<{ role: string }>> {
    const mediaId = await cvFileRepository.remove(userId, role);
    if (!mediaId) return { ok: false, error: "No CV for this role" };
    await mediaService.remove(userId, mediaId);
    return { ok: true, data: { role } };
  },

  /**
   * A short-lived link to the owner's CV for a role. The files stay in the private bucket; a visitor
   * only ever gets a signed link, so a removed CV stops being downloadable when its link expires.
   */
  async signedUrl(userId: string, role: string, inline: boolean): Promise<string | null> {
    const row = (await cvFileRepository.list(userId)).find((r) => r.role === role);
    if (!row) return null;
    const name = row.fileName.toLowerCase().endsWith(".pdf") ? row.fileName : `${row.fileName}.pdf`;
    const { data, error } = await getStorageClient()
      .storage.from(row.bucket)
      .createSignedUrl(row.storageKey, LINK_SECONDS, inline ? undefined : { download: name });
    return error || !data ? null : data.signedUrl;
  },
};
