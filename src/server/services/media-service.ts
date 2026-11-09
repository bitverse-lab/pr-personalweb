import { randomUUID } from "node:crypto";
import { mediaRepository } from "@/server/repositories/media-repository";
import { ensureBucket, getStorageClient, publicObjectUrl, BUCKETS } from "@/server/storage/client";
import { extFor, kindOfMime, maxBytesFor, sanitizeName, sniffMime, formatBytes } from "@/features/media/rules";
import { mediaReferenceLabels } from "@/features/media/references";
import { reportError } from "@/lib/report-error";
import type { MediaBucket, MediaKind, MediaPurpose } from "@/db/schema/media";
import type { ServiceResult } from "./article-service";

export interface MediaDto {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: MediaKind;
  purpose: MediaPurpose;
  bucket: MediaBucket;
  url: string | null; // permanent URL for public images; documents use signed links
  createdAt: string;
}

type Row = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  kind: MediaKind;
  purpose: MediaPurpose;
  bucket: MediaBucket;
  storageKey: string;
  createdAt: Date;
};

export const toMediaDto = (r: Row): MediaDto => ({
  id: r.id,
  name: r.originalName,
  mimeType: r.mimeType,
  sizeBytes: r.sizeBytes,
  kind: r.kind,
  purpose: r.purpose,
  bucket: r.bucket,
  url: publicObjectUrl(r.bucket, r.storageKey),
  createdAt: r.createdAt.toISOString(),
});

export interface UploadRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  purpose: MediaPurpose;
}

const PENDING_TTL_MS = 60 * 60 * 1000;

async function removeObject(bucket: MediaBucket, key: string) {
  // Best effort: an orphaned object is harmless, a dangling row would not be. Failures are logged, not thrown.
  try {
    const { error } = await getStorageClient().storage.from(bucket).remove([key]);
    if (error) reportError("storage-cleanup", error);
  } catch (e) {
    reportError("storage-cleanup", e);
  }
}

export const mediaService = {
  // Step 1: validate what the client claims and hand back a one-time signed URL for a server-chosen key.
  async requestUpload(userId: string, req: UploadRequest): Promise<ServiceResult<{ mediaId: string; uploadUrl: string }>> {
    const kind = kindOfMime(req.mimeType);
    if (!kind) return { ok: false, error: "Unsupported file type. Use JPG, PNG, WebP or GIF images, or PDF/DOCX documents." };
    if (req.purpose === "document" && kind !== "document") return { ok: false, error: "Documents must be PDF or DOCX files" };
    if (req.purpose !== "document" && req.purpose !== "library" && kind !== "image") return { ok: false, error: "Only images can be used here" };
    if (req.sizeBytes <= 0) return { ok: false, error: "The file is empty" };
    if (req.sizeBytes > maxBytesFor(kind)) return { ok: false, error: `That file is too large (max ${formatBytes(maxBytesFor(kind))})` };

    const bucket: MediaBucket = kind === "image" ? "public-media" : "private-docs";
    const now = new Date();
    const key = `${userId}/${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extFor(req.mimeType)}`;

    await ensureBucket(bucket);
    const { data, error } = await getStorageClient().storage.from(bucket).createSignedUploadUrl(key);
    if (error || !data) return { ok: false, error: "Could not start the upload. Please try again." };

    const row = await mediaRepository.insertPending(userId, {
      bucket,
      storageKey: key,
      originalName: sanitizeName(req.filename),
      mimeType: req.mimeType,
      sizeBytes: req.sizeBytes,
      kind,
      purpose: req.purpose,
    });
    return { ok: true, data: { mediaId: row.id, uploadUrl: data.signedUrl } };
  },

  // Step 2: read the stored bytes back and verify them before the file is ever used anywhere.
  async confirmUpload(userId: string, mediaId: string): Promise<ServiceResult<MediaDto>> {
    const row = await mediaRepository.find(userId, mediaId);
    if (!row) return { ok: false, error: "Upload not found" };
    if (row.status === "ready") return { ok: true, data: toMediaDto(row) };

    const reject = async (error: string): Promise<ServiceResult<MediaDto>> => {
      await removeObject(row.bucket, row.storageKey);
      await mediaRepository.deleteById(row.id);
      return { ok: false, error };
    };

    const { data: blob, error } = await getStorageClient().storage.from(row.bucket).download(row.storageKey);
    if (error || !blob) return reject("The file did not finish uploading");
    const bytes = new Uint8Array(await blob.arrayBuffer());

    const sniffed = sniffMime(bytes);
    const kind = sniffed ? kindOfMime(sniffed) : null;
    if (!sniffed || kind !== row.kind) return reject("The file content does not match a supported type");
    if (bytes.byteLength > maxBytesFor(row.kind)) return reject(`That file is too large (max ${formatBytes(maxBytesFor(row.kind))})`);
    if (bytes.byteLength > BUCKETS[row.bucket].maxBytes) return reject("That file is too large");

    const ready = await mediaRepository.markReady(userId, row.id, { mimeType: sniffed, sizeBytes: bytes.byteLength });
    return ready ? { ok: true, data: toMediaDto(ready) } : { ok: false, error: "Upload not found" };
  },

  async list(userId: string, kind?: MediaKind) {
    // opportunistic cleanup of uploads that never got confirmed
    const stale = await mediaRepository.stalePending(new Date(Date.now() - PENDING_TTL_MS));
    for (const s of stale) {
      await removeObject(s.bucket, s.storageKey);
      await mediaRepository.deleteById(s.id);
    }
    const rows = await mediaRepository.list(userId, kind);
    return rows.map(toMediaDto);
  },

  usage: (userId: string) => mediaRepository.usage(userId),

  async references(userId: string, id: string) {
    const row = await mediaRepository.find(userId, id);
    if (!row) return null;
    return mediaRepository.references(userId, row);
  },

  async remove(userId: string, id: string): Promise<ServiceResult<{ id: string }>> {
    const row = await mediaRepository.find(userId, id);
    if (!row) return { ok: false, error: "File not found" };
    const references = mediaReferenceLabels(await mediaRepository.references(userId, row));
    if (references.length > 0) {
      return { ok: false, error: `Cannot delete this file while it is used in ${references.join(", ")}. Remove it from those items first.` };
    }
    await mediaRepository.delete(userId, id);
    await removeObject(row.bucket, row.storageKey);
    return { ok: true, data: { id } };
  },

  // Short-lived link for private documents; there is no permanent public URL for them.
  async signedDownloadUrl(userId: string, id: string): Promise<ServiceResult<{ url: string }>> {
    const row = await mediaRepository.find(userId, id);
    if (!row || row.status !== "ready") return { ok: false, error: "File not found" };
    const { data, error } = await getStorageClient().storage.from(row.bucket).createSignedUrl(row.storageKey, 60, { download: row.originalName });
    if (error || !data) return { ok: false, error: "Could not create a download link" };
    return { ok: true, data: { url: data.signedUrl } };
  },
};
