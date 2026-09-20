"use client";

import { useRef, useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { useUpload } from "@/hooks/useUpload";
import { useToast } from "@/components/shared/ToastProvider";
import type { MediaDto } from "@/server/services/media-service";
import type { MediaPurpose } from "@/db/schema/media";

const ACCEPT = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  document: "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  any: "image/jpeg,image/png,image/webp,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const HINT = {
  image: "JPG, PNG, WebP or GIF · up to 5 MB",
  document: "PDF or DOCX · up to 10 MB",
  any: "Images up to 5 MB, PDF/DOCX up to 10 MB",
};

export default function UploadDropzone({
  purpose,
  accept = "image",
  onUploaded,
  compact = false,
  label,
}: {
  purpose: MediaPurpose;
  accept?: "image" | "document" | "any";
  onUploaded: (media: MediaDto) => void;
  compact?: boolean;
  label?: string;
}) {
  const { upload, uploading, progress, error, clearError } = useUpload(purpose);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const media = await upload(file);
      if (media) {
        toast.success(`Uploaded ${media.name}`);
        onUploaded(media);
      }
    }
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={label ?? "Upload a file"}
        className={`border rounded text-center ${dragging ? "border-primary bg-soft-primary" : "bg-light"} ${compact ? "p-3" : "p-4"}`}
        style={{ borderStyle: "dashed", cursor: uploading ? "progress" : "pointer" }}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !uploading && (e.preventDefault(), inputRef.current?.click())}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!uploading) void handleFiles(e.dataTransfer.files);
        }}
      >
        <FiUploadCloud size={compact ? 20 : 28} className="text-primary mb-1" aria-hidden />
        <div className="small fw-semibold">{uploading ? `Uploading… ${progress}%` : (label ?? "Drop a file here or click to browse")}</div>
        <div className="text-muted small">{HINT[accept]}</div>
        {uploading && (
          <div className="progress mt-2 mx-auto" style={{ height: 6, maxWidth: 240 }} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple={accept !== "document" && purpose === "library"}
          accept={ACCEPT[accept]}
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <div className="alert alert-danger py-2 small mt-2 mb-0 d-flex justify-content-between align-items-center" role="alert">
          <span>{error}</span>
          <button type="button" className="btn-close btn-sm" aria-label="Dismiss" onClick={clearError} />
        </div>
      )}
    </div>
  );
}
