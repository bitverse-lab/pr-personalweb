"use client";

import { useToastStack } from "./ToastProvider";

export default function ToastStack() {
  const { toasts, removeToast } = useToastStack();

  if (toasts.length === 0) return null;

  return (
    <div className="me-toast-stack">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`alert ${toast.kind === "success" ? "alert-success" : "alert-danger"} shadow-sm me-toast d-flex align-items-center justify-content-between`}
          // A confirmation can wait for a pause in speech; a failure should interrupt.
          role={toast.kind === "success" ? "status" : "alert"}
        >
          <span>{toast.message}</span>
          <span className="d-flex align-items-center">
            {toast.action && (
              <button
                type="button"
                className="btn btn-link btn-sm p-0 ms-3 fw-semibold"
                onClick={() => {
                  toast.action?.onClick();
                  removeToast(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              className="btn-close ms-3"
              aria-label="Dismiss"
              onClick={() => removeToast(toast.id)}
            />
          </span>
        </div>
      ))}
    </div>
  );
}
