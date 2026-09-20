import Link from "next/link";
import type { IconType } from "react-icons";

export interface EmptyStateProps {
  icon: IconType;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div className={`text-center py-4 ${className ?? ""}`}>
      <div
        className="bg-light text-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
        style={{ width: 56, height: 56 }}
      >
        <Icon size={22} />
      </div>
      <h6 className="mb-1">{title}</h6>
      {description && <p className="text-muted small mb-3">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-sm btn-soft-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
