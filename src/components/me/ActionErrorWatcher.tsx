"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { isSessionAlive } from "@/features/session/actions";
import { useToast } from "@/components/shared/ToastProvider";

/**
 * Last line of defence for Server Actions that fail by throwing instead of returning
 * `{ ok: false }` — an expired session, a database outage, a dropped connection.
 *
 * Without this the rejected promise inside a transition is simply swallowed: the button
 * stops spinning and nothing else happens, so the click looks ignored. Here every such
 * failure gets a visible explanation, and an expired session sends the owner to sign in
 * again instead of leaving them clicking a dead page.
 */
export default function ActionErrorWatcher() {
  const toast = useToast();
  const router = useRouter();
  const busy = useRef(false);
  // useToast() hands back a fresh object each render; keeping it in a ref means the
  // listener below is installed once instead of on every re-render of the workspace.
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    const onRejection = async (event: PromiseRejectionEvent) => {
      // React logs its own handled rejections too; ignore anything already dealt with.
      if (event.defaultPrevented) return;
      if (busy.current) return;
      busy.current = true;
      // Keep the failure out of the browser's default "Uncaught (in promise)" noise.
      event.preventDefault();

      try {
        const alive = await isSessionAlive().catch(() => null);
        if (alive === false) {
          toastRef.current.error("Your session has expired. Please sign in again.", {
            action: { label: "Sign in", onClick: () => router.push("/login") },
            durationMs: 15000,
          });
          return;
        }
        toastRef.current.error(alive === null ? "You appear to be offline. Your change was not saved." : "That did not go through. Please try again.", {
          action: { label: "Reload", onClick: () => router.refresh() },
          durationMs: 10000,
        });
      } finally {
        // Let the next genuine failure through, but never queue a burst of identical toasts.
        setTimeout(() => {
          busy.current = false;
        }, 2000);
      }
    };

    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, [router]);

  return null;
}
