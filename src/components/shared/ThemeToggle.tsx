"use client";

import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { applyTheme, THEME_KEY, type Theme } from "@/lib/theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  // Unknown until mount: the server cannot see the visitor's setting.
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    read();
    const watch = new MutationObserver(read);
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => watch.disconnect();
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage blocked: the switch still works for this page.
    }
    applyTheme(next);
  };

  const dark = theme === "dark";
  return (
    <button type="button" className={`btn btn-sm btn-icon btn-pills theme-toggle ${className}`} onClick={toggle} aria-pressed={dark} aria-label="Dark theme" title={dark ? "Switch to light theme" : "Switch to dark theme"}>
      {dark ? <FiSun aria-hidden /> : <FiMoon aria-hidden />}
    </button>
  );
}
