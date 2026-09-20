"use client";

import { useState } from "react";
import { FiArrowLeft, FiArrowRight, FiImage, FiStar, FiTrash2 } from "react-icons/fi";
import UploadDropzone from "@/components/me/media/UploadDropzone";
import MediaPickerDialog from "@/components/me/media/MediaPickerDialog";

export interface GalleryEntry {
  mediaId: string;
  url: string;
  caption: string;
}

export default function GalleryEditor({
  items,
  coverMediaId,
  onChange,
  onCoverChange,
}: {
  items: GalleryEntry[];
  coverMediaId: string | null;
  onChange: (items: GalleryEntry[]) => void;
  onCoverChange: (mediaId: string | null) => void;
}) {
  const [picking, setPicking] = useState(false);
  const effectiveCover = coverMediaId && items.some((i) => i.mediaId === coverMediaId) ? coverMediaId : (items[0]?.mediaId ?? null);

  const add = (mediaId: string, url: string) => {
    if (items.some((i) => i.mediaId === mediaId)) return;
    onChange([...items, { mediaId, url, caption: "" }]);
  };

  const move = (index: number, delta: -1 | 1) => {
    const j = index + delta;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  const remove = (mediaId: string) => {
    onChange(items.filter((i) => i.mediaId !== mediaId));
    if (coverMediaId === mediaId) onCoverChange(null);
  };

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-muted small">No images yet. The first image becomes the cover unless you pick another.</p>
      ) : (
        <div className="row g-2 mb-3">
          {items.map((item, i) => {
            const isCover = item.mediaId === effectiveCover;
            return (
              <div className="col-6 col-md-4" key={item.mediaId}>
                <div className={`border rounded overflow-hidden bg-white h-100 ${isCover ? "border-primary" : ""}`} style={isCover ? { borderWidth: 2 } : undefined}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.caption || `Project image ${i + 1}`} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                  <div className="p-2">
                    <input
                      className="form-control form-control-sm mb-1"
                      placeholder="Caption (optional)"
                      aria-label={`Caption for image ${i + 1}`}
                      maxLength={160}
                      value={item.caption}
                      onChange={(e) => onChange(items.map((x) => (x.mediaId === item.mediaId ? { ...x, caption: e.target.value } : x)))}
                    />
                    <div className="d-flex justify-content-between align-items-center">
                      <button type="button" className={`btn btn-sm ${isCover ? "btn-primary" : "btn-outline-secondary"}`} aria-pressed={isCover} onClick={() => onCoverChange(item.mediaId)}>
                        <FiStar className="me-1" aria-hidden />{isCover ? "Cover" : "Set cover"}
                      </button>
                      <span className="text-nowrap">
                        <button type="button" className="btn btn-sm border-0 p-1" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)}><FiArrowLeft /></button>
                        <button type="button" className="btn btn-sm border-0 p-1" aria-label="Move later" disabled={i === items.length - 1} onClick={() => move(i, 1)}><FiArrowRight /></button>
                        <button type="button" className="btn btn-sm border-0 p-1 text-danger" aria-label="Remove image" onClick={() => remove(item.mediaId)}><FiTrash2 /></button>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <UploadDropzone purpose="library" accept="image" compact label="Upload images" onUploaded={(m) => m.url && add(m.id, m.url)} />
      <button type="button" className="btn btn-sm btn-link px-0 mt-1 d-inline-flex align-items-center gap-1" onClick={() => setPicking(true)}>
        <FiImage aria-hidden /> Choose from media library
      </button>
      {picking && (
        <MediaPickerDialog
          excludeIds={items.map((i) => i.mediaId)}
          onClose={() => setPicking(false)}
          onPick={(m) => {
            if (m.url) add(m.id, m.url);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
