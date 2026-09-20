"use client";

import { useEffect, useState } from "react";
import { listMedia } from "@/features/media/actions";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import type { MediaDto } from "@/server/services/media-service";

// Pick already-uploaded images from the media library.
export default function MediaPickerDialog({
  excludeIds = [],
  onPick,
  onClose,
}: {
  excludeIds?: string[];
  onPick: (media: MediaDto) => void;
  onClose: () => void;
}) {
  const panelRef = useDialogA11y<HTMLDivElement>(onClose);
  const [items, setItems] = useState<MediaDto[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listMedia("image").then((rows) => !cancelled && setItems(rows.filter((r) => r.url)));
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = (items ?? []).filter((m) => !excludeIds.includes(m.id));

  return (
    <div role="presentation" className="me-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className="me-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="picker-media-title" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <h6 id="picker-media-title" className="mb-3">Choose from your media library</h6>
        {items === null ? (
          <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" role="status" /></div>
        ) : shown.length === 0 ? (
          <p className="text-muted small">No other images yet. Upload some first, or add them in Media.</p>
        ) : (
          <div className="row g-2" style={{ maxHeight: 380, overflowY: "auto" }}>
            {shown.map((m) => (
              <div className="col-4 col-md-3" key={m.id}>
                <button type="button" className="btn p-0 border rounded overflow-hidden w-100" aria-label={`Use ${m.name}`} title={m.name} onClick={() => onPick(m)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url!} alt={m.name} loading="lazy" style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="d-flex justify-content-end mt-3">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
