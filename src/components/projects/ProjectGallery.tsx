"use client";

import { useEffect, useState } from "react";
import DialogShell from "@/components/shared/DialogShell";
import { useDict } from "@/lib/i18n/context";

export interface GalleryImage {
  url: string;
  caption: string | null;
}

/**
 * The first image large, the rest as a sideways strip, any of them opening full size in a
 * dialog. Stacking every image in full pushed the write-up several screens down.
 */
export default function ProjectGallery({ images, name, vtIndex, vtStyle }: { images: GalleryImage[]; name: string; vtIndex: number; vtStyle: React.CSSProperties }) {
  const t = useDict().project;
  const [open, setOpen] = useState<number | null>(null);
  const alt = (i: number) => images[i].caption || t.image(name, i + 1);
  const step = (d: number) => setOpen((i) => (i === null ? i : (i + d + images.length) % images.length));
  const [first, ...rest] = images;
  const isOpen = open !== null;

  // Arrow keys move through the images wherever focus sits inside the dialog.
  useEffect(() => {
    if (!isOpen || images.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `step` only reads images.length
  }, [isOpen, images.length]);

  return (
    <>
      <figure className="mb-0" style={vtIndex === 0 ? vtStyle : undefined}>
        <button type="button" className="gallery-main" onClick={() => setOpen(0)} aria-label={t.openImage(1)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={first.url} loading="eager" decoding="async" className="rounded" alt={alt(0)} />
        </button>
        {first.caption && <figcaption className="mono-meta mt-2">{first.caption}</figcaption>}
      </figure>

      {rest.length > 0 && (
        <ul className="gallery-strip list-unstyled" aria-label={t.galleryAria}>
          {rest.map((image, k) => (
            <li key={image.url} style={vtIndex === k + 1 ? vtStyle : undefined}>
              <button type="button" className="gallery-thumb" onClick={() => setOpen(k + 1)} aria-label={t.openImage(k + 2)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} loading="lazy" decoding="async" alt={alt(k + 1)} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open !== null && (
        <DialogShell
          title={alt(open)}
          description={images.length > 1 ? `${open + 1} / ${images.length}` : undefined}
          onClose={() => setOpen(null)}
          maxWidth={1100}
          className="gallery-dialog"
          footer={
            images.length > 1 && (
              <>
                <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => step(-1)}>← {t.prevImage}</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => step(1)}>{t.nextImage} →</button>
              </>
            )
          }
        >
          <div className="gallery-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[open].url} decoding="async" className="rounded" alt={alt(open)} />
          </div>
        </DialogShell>
      )}
    </>
  );
}
