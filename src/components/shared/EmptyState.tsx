import Link from "next/link";
import type { IconType } from "react-icons";

export interface EmptyStateProps {
  icon: IconType;
  title: string;
  description?: string;
  actionLabel?: string;
  /** Where the action goes. Use this or `onAction`, not both. */
  actionHref?: string;
  /** An action that happens in place (clearing a filter, opening a dialog) rather than navigating. */
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={`text-center py-4 ${className ?? ""}`}>
      <div
        className="bg-light text-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
        style={{ width: 56, height: 56 }}
      >
        <Icon size={22} aria-hidden />
      </div>
      <p className="h6 mb-1">{title}</p>
      {description && <p className="text-muted small mb-3">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-sm btn-soft-primary">
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionHref && onAction && (
        <button type="button" className="btn btn-sm btn-soft-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
