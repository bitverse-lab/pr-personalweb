"use client";

import { useDialogA11y } from "@/hooks/useDialogA11y";

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useDialogA11y<HTMLDivElement>(onCancel);

  return (
    <div role="presentation" className="me-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div
        ref={panelRef}
        className="me-dialog-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h6 id="confirm-dialog-title" className="mb-2">
          {title}
        </h6>
        <p className="text-muted mb-4">{message}</p>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onCancel} disabled={isPending}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={onConfirm} disabled={isPending}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
