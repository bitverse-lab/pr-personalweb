"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Stack of open dialogs so only the topmost one reacts to Escape/Tab (confirm dialogs open above forms).
const openDialogs: symbol[] = [];

export function useDialogA11y<T extends HTMLElement>(onClose: () => void) {
  const panelRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const id = Symbol("dialog");
    openDialogs.push(id);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    // A dialog can name its starting field with data-autofocus (e.g. a search box); otherwise the first focusable.
    (panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    // Stop the page behind the dialog from scrolling once the panel reaches its end,
    // which on a phone otherwise carries the reader away from the dialog they are filling in.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (openDialogs[openDialogs.length - 1] !== id) return;
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const index = openDialogs.indexOf(id);
      if (index >= 0) openDialogs.splice(index, 1);
      // Only the last dialog to close hands scrolling back to the page (a confirm can sit above a form).
      if (openDialogs.length === 0) document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return panelRef;
}
