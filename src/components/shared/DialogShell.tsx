"use client";

import { useId } from "react";
import { useDialogA11y } from "@/hooks/useDialogA11y";

export interface DialogShellProps {
  /** Heading shown at the top of the panel and announced as the dialog's name. */
  title: string;
  /** Optional line under the heading explaining what the dialog is for. */
  description?: string;
  onClose: () => void;
  /** Panel width in pixels; the default suits a short form. */
  maxWidth?: number;
  /** "alertdialog" for a destructive confirmation, so assistive tech interrupts rather than waits. */
  role?: "dialog" | "alertdialog";
  /** Footer row, right-aligned (usually Cancel + the primary action). */
  footer?: React.ReactNode;
  /** Extra class on the panel, for a dialog with its own look (e.g. the public terminal). */
  className?: string;
  children: React.ReactNode;
}

/**
 * The single dialog frame used across the workspace: backdrop, focus trap, Escape to close,
 * scroll lock and a labelled panel. Only the contents differ between dialogs, so each one
 * describes what it asks for and nothing about how a modal behaves.
 */
export default function DialogShell({ title, description, onClose, maxWidth = 480, role = "dialog", footer, className, children }: DialogShellProps) {
  const panelRef = useDialogA11y<HTMLDivElement>(onClose);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div role="presentation" className="me-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className={className ? `me-dialog-panel ${className}` : "me-dialog-panel"}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div>
            <h2 id={titleId} className="h6 mb-0">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-muted small mb-0 mt-1">
                {description}
              </p>
            )}
          </div>
          <button type="button" className="btn-close flex-shrink-0" aria-label="Close dialog" onClick={onClose} />
        </div>

        {children}

        {footer && <div className="d-flex justify-content-end flex-wrap gap-2 mt-4">{footer}</div>}
      </div>
    </div>
  );
}
