import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export interface MePageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export default function MePageHeader({ title, description, backHref, backLabel }: MePageHeaderProps) {
  return (
    <div className="mb-4">
      {backHref && (
        <Link href={backHref} className="text-muted small d-inline-flex align-items-center gap-1 mb-2">
          <FiArrowLeft /> {backLabel ?? "Back"}
        </Link>
      )}
      <h1 className="h4 mb-1">{title}</h1>
      {description && <p className="text-muted mb-0">{description}</p>}
    </div>
  );
}
