"use client";

import { useEffect, useState } from "react";
import type { HeadingInfo } from "@/features/content/richtext";

// "On this page", kept beside the reading column; the section in view is marked aria-current.
// Plain anchors underneath, so it works without JavaScript.
export default function TableOfContents({ headings }: { headings: HeadingInfo[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      // The current section is the last heading above 40% of the viewport; at the very end, the last one.
      const above = els.filter((el) => el.getBoundingClientRect().top < window.innerHeight * 0.4);
      setActive(atBottom ? els[els.length - 1].id : (above[above.length - 1] ?? els[0]).id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [headings]);

  if (headings.length < 2) return null;
  return (
    <nav aria-label="On this page" className="toc">
      <p className="mono-meta mb-2">On this page</p>
      <ol className="list-unstyled mb-0">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "toc-sub" : undefined}>
            <a href={`#${h.id}`} className="toc-link" aria-current={active === h.id ? "true" : undefined}>
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
