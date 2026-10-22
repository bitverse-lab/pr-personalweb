"use client";

import DialogShell from "@/components/shared/DialogShell";

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
  return (
    <DialogShell
      title={title}
      onClose={onCancel}
      role="alertdialog"
      footer={
        <>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onCancel} disabled={isPending}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger btn-sm d-inline-flex align-items-center gap-2" onClick={onConfirm} disabled={isPending}>
            {/* Deleting can take a moment; without this the dialog just sits there looking stuck. */}
            {isPending && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
            {isPending ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-muted mb-0">{message}</p>
    </DialogShell>
  );
}
