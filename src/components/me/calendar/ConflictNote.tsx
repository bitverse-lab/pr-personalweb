"use client";

import { useEffect, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { checkEventConflicts } from "@/features/calendar/actions";

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/**
 * Warns, without blocking, when a timed event overlaps another. Double booking is sometimes
 * on purpose (a call during a focus block), so this informs rather than refuses.
 */
export default function ConflictNote({ start, end, allDay, excludeId }: { start: string; end: string; allDay: boolean; excludeId?: string }) {
  const [clashes, setClashes] = useState<{ id: string; title: string; start: string; end: string }[]>([]);

  useEffect(() => {
    const valid = !allDay && start && end && new Date(end) > new Date(start);
    if (!valid) {
      setClashes([]);
      return;
    }
    let live = true;
    // Debounced: typing a time fires on every keystroke.
    const timer = setTimeout(async () => {
      const result = await checkEventConflicts({ start, end, excludeId });
      if (live && result.ok) setClashes(result.data);
    }, 300);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [start, end, allDay, excludeId]);

  if (clashes.length === 0) return null;
  return (
    <p className="cal-conflict" role="status">
      <FiAlertTriangle aria-hidden />
      <span>
        Overlaps {clashes.map((c, i) => (
          <span key={c.id}>
            {i > 0 && ", "}
            <strong>{c.title}</strong> ({time(c.start)}–{time(c.end)})
          </span>
        ))}
      </span>
    </p>
  );
}
