import FallbackImage from "@/components/shared/FallbackImage";

interface CoverBlockProps {
  src: string | null;
  title: string;
  className?: string;
  ratio?: "16/9" | "16/10";
  /** Smaller title for compact cards. */
  compact?: boolean;
  /** Shared-element style (lib/view-transition) so the cover morphs into the detail page's image. */
  vtStyle?: React.CSSProperties;
}

// A cover without an image is set in type rather than filled with a stock photo: the title on the
// soft-primary surface, so a missing cover still looks deliberate.
export default function CoverBlock({ src, title, className = "", ratio = "16/10", compact = false, vtStyle }: CoverBlockProps) {
  const typeset = (
    <div className={`cover-block cover-block--type ${compact ? "cover-block--compact" : ""}`} aria-hidden="true">
      <span>{title}</span>
    </div>
  );
  return (
    <div className={`cover-block-frame ${className}`} style={{ aspectRatio: ratio, ...vtStyle }}>
      {src ? <FallbackImage src={src} alt="" className="cover-block cover-block--img" fallback={typeset} /> : typeset}
    </div>
  );
}
