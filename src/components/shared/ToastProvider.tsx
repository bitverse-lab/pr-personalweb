"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastKind = "success" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  action?: ToastAction;
  durationMs?: number;
}

export interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (kind: ToastKind, message: string, options?: ToastOptions) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;
const ACTION_DISMISS_MS = 8000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (kind: ToastKind, message: string, options?: ToastOptions) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, kind, message, action: options?.action }]);
      const duration = options?.durationMs ?? (options?.action ? ACTION_DISMISS_MS : AUTO_DISMISS_MS);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return {
    success: (message: string, options?: ToastOptions) => context.addToast("success", message, options),
    error: (message: string, options?: ToastOptions) => context.addToast("error", message, options),
  };
}

export function useToastStack() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastStack must be used within a ToastProvider");
  }
  return context;
}
