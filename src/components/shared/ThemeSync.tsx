"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { applyTheme, resolveTheme, THEME_KEY } from "@/lib/theme";

// The head script sets the theme on full page loads; this keeps it right on client-side
// navigation into and out of /me, and when the system setting changes.
export default function ThemeSync() {
  const path = usePathname();
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(THEME_KEY);
      } catch {
        // Storage blocked: follow the system.
      }
      applyTheme(resolveTheme(path, stored, media.matches));
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [path]);
  return null;
}
