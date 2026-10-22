"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

type Phase = "idle" | "loading" | "done";

// A thin bar at the top that starts the moment an internal link is clicked and finishes when the new page has arrived,
// so a slow server response never feels like a dead click.
function Bar() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return; // same page or #anchor
      clearTimers();
      setPhase("loading");
      document.documentElement.classList.add("is-navigating");
      timers.current.push(window.setTimeout(() => setPhase("idle"), 10000)); // never get stuck
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // The new route has rendered: finish the bar, then fade it out.
  useEffect(() => {
    document.documentElement.classList.remove("is-navigating");
    setPhase((p) => (p === "loading" ? "done" : p));
    const t = window.setTimeout(() => setPhase((p) => (p === "done" ? "idle" : p)), 350);
    return () => window.clearTimeout(t);
  }, [pathname, search]);

  return <div className={`nav-progress nav-progress-${phase}`} role="presentation" aria-hidden="true" />;
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
