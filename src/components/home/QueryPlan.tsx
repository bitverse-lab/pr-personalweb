"use client";

import { useEffect, useState } from "react";

// The home page as a query plan, pinned to the left edge on wide screens: one node per section,
// the one being read lit. A real navigation (links to each section), dressed as EXPLAIN output.
export interface PlanNode {
  id: string;
  op: string; // "Seq Scan on project"
}

export default function QueryPlan({ nodes }: { nodes: PlanNode[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [present, setPresent] = useState<PlanNode[]>([]);

  useEffect(() => {
    // Only sections that rendered (an empty section is left out of the page).
    const found = nodes.filter((n) => document.getElementById(n.id));
    setPresent(found);
    const seen = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.intersectionRatio);
        let best: string | null = null;
        let ratio = 0;
        for (const [id, r] of Array.from(seen)) if (r > ratio) [best, ratio] = [id, r];
        setActive(ratio > 0 ? best : null);
      },
      { threshold: [0, 0.15, 0.3, 0.5, 0.7] }
    );
    for (const n of found) io.observe(document.getElementById(n.id)!);
    return () => io.disconnect();
  }, [nodes]);

  if (present.length < 2) return null;
  return (
    <nav className={`qplan ${active ? "is-active" : ""}`} aria-label="Page sections">
      <p className="qplan-head" aria-hidden="true">QUERY PLAN</p>
      <ol className="list-unstyled mb-0">
        {present.map((n, i) => (
          <li key={n.id} className={n.id === active ? "is-on" : undefined} style={{ paddingLeft: Math.min(i, 3) * 6 }}>
            <a href={`#${n.id}`} aria-current={n.id === active ? "location" : undefined}>
              <span className="qplan-dot" aria-hidden="true" />
              <span className="qplan-op">{n.op}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
