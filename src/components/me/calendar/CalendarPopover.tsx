"use client";

import { useId, useLayoutEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import type { ScreenPoint } from "./CalendarView";

const WIDTH = 320;
const GAP = 8;
const EDGE = 12;

/**
 * A small dialog that opens beside what was clicked (a day, an event), so reading or adding
 * something never costs a full-screen modal. Escape, Tab trapping and focus return come from
 * useDialogA11y; a click on the scrim closes it.
 */
export default function CalendarPopover({
  at,
  label,
  onClose,
  children,
}: {
  at: ScreenPoint;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useDialogA11y<HTMLDivElement>(onClose);
  const titleId = useId();
  const [pos, setPos] = useState<{ left: number; top: number; origin: string } | null>(null);

  // Measure once mounted, then keep it on screen: flip above the anchor when there is no room below.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const height = panel.offsetHeight;
    const width = Math.min(WIDTH, window.innerWidth - EDGE * 2);
    const left = Math.min(Math.max(at.x, EDGE), window.innerWidth - width - EDGE);
    const below = at.y + GAP;
    const top = below + height > window.innerHeight - EDGE ? Math.max(EDGE, at.y - height - GAP * 4) : below;
    // Grow out of the clicked point: the origin is that point in the panel own coordinates.
    const ox = Math.min(Math.max(at.x - left, 0), width);
    const oy = top < at.y ? height : 0;
    setPos({ left, top, origin: `${ox}px ${oy}px` });
  }, [at, panelRef]);

  return (
    <div role="presentation" className="cal-pop-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="cal-pop"
        style={{ left: pos?.left ?? at.x, top: pos?.top ?? at.y, opacity: pos ? 1 : 0, transformOrigin: pos?.origin }}
      >
        <div className="d-flex align-items-start justify-content-between gap-2">
          <span id={titleId} className="visually-hidden">{label}</span>
          <div className="flex-grow-1 min-w-0">{children}</div>
          <button type="button" className="btn btn-sm btn-outline-primary border-0 cal-pop-close" onClick={onClose} aria-label="Close">
            <FiX aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
