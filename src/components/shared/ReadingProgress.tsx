"use client";

import { useEffect, useState } from "react";

// A thin bar under the navbar showing how far through the article you are.
export default function ReadingProgress({ targetId }: { targetId: string }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.getElementById(targetId);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const done = Math.min(Math.max(-rect.top + window.innerHeight * 0.2, 0), Math.max(total, 1));
      setPct(Math.round((done / Math.max(total, 1)) * 100));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [targetId]);

  return (
    <div className="position-fixed top-0 start-0 w-100" style={{ height: 3, zIndex: 1999, pointerEvents: "none" }} role="progressbar" aria-label="Reading progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${pct}%`, height: "100%", background: "#2a52c3", transition: "width 80ms linear" }} />
    </div>
  );
}
