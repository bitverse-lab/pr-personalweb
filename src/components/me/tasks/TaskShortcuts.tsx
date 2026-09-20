"use client";

import { useEffect } from "react";

export default function TaskShortcuts() {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
        return;
      }
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;

      if (event.key === "n") {
        event.preventDefault();
        document.getElementById("task-quick-capture-title")?.focus();
      } else if (event.key === "/") {
        event.preventDefault();
        document.getElementById("task-search")?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return null;
}
