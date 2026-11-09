"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface FallbackImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Rendered instead of the image when it cannot be loaded (deleted file, storage outage). */
  fallback: ReactNode;
}

// Public pages show the owner's photo from Supabase storage; when that fails, visitors should see a
// designed placeholder rather than alt text in a broken-image box.
export default function FallbackImage({ src, alt, className, fallback }: FallbackImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  // An image can fail before hydration, in which case onError never reaches React.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (failed) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Round initials badge in the template's soft-primary colours, the same footprint as the about photo. */
export function PortraitInitials({ name }: { name: string }) {
  return (
    <div
      role="img"
      aria-label={`Portrait of ${name}`}
      className="rounded-pill shadow bg-soft-primary text-primary d-flex align-items-center justify-content-center fw-bold w-100"
      style={{ aspectRatio: "1 / 1", fontSize: "clamp(3rem, 9vw, 5.5rem)" }}
    >
      {initialsOf(name)}
    </div>
  );
}
