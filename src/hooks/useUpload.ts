"use client";

import { useCallback, useState } from "react";
import { confirmUpload, requestUpload } from "@/features/media/actions";
import { formatBytes, kindOfMime, maxBytesFor } from "@/features/media/rules";
import type { MediaDto } from "@/server/services/media-service";
import type { MediaPurpose } from "@/db/schema/media";

const MAX_DIMENSION = 2000;

// Big photos are downscaled in the browser first: smaller uploads, and they fit the 5 MB image limit.
async function prepareImage(file: File): Promise<File> {
  if (file.type === "image/gif" || typeof createImageBitmap === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const type = file.type === "image/png" && file.size < 1.5 * 1024 * 1024 ? "image/png" : file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));
    if (!blob || blob.size >= file.size) return file; // never make it worse
    const ext = type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + `.${ext}`, { type });
  } catch {
    return file; // fall back to the original; the server still validates it
  }
}

// PUT to the signed URL. XMLHttpRequest is used only because fetch cannot report upload progress.
function putFile(url: string, file: File, onProgress: (pct: number) => void): Promise<string | null> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300 ? null : "The upload failed. Please try again.");
    xhr.onerror = () => resolve("Network error while uploading");
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    xhr.send(body);
  });
}

export function useUpload(purpose: MediaPurpose) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (original: File): Promise<MediaDto | null> => {
      setError(null);
      const kind = kindOfMime(original.type);
      if (!kind) {
        setError("Unsupported file type. Use JPG, PNG, WebP or GIF images, or PDF/DOCX documents.");
        return null;
      }
      setUploading(true);
      setProgress(0);
      try {
        const file = kind === "image" ? await prepareImage(original) : original;
        if (file.size > maxBytesFor(kind)) {
          setError(`That file is too large (max ${formatBytes(maxBytesFor(kind))})`);
          return null;
        }
        const request = await requestUpload({ filename: file.name, mimeType: file.type, sizeBytes: file.size, purpose });
        if (!request.ok) {
          setError(request.error);
          return null;
        }
        const putError = await putFile(request.data.uploadUrl, file, setProgress);
        if (putError) {
          setError(putError);
          return null;
        }
        const confirmed = await confirmUpload(request.data.mediaId);
        if (!confirmed.ok) {
          setError(confirmed.error);
          return null;
        }
        return confirmed.data;
      } finally {
        setUploading(false);
      }
    },
    [purpose]
  );

  return { upload, uploading, progress, error, clearError: () => setError(null) };
}
