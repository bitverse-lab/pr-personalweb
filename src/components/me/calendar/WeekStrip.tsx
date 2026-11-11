"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { addDays, dayKey } from "@/features/calendar/format";

/**
 * Phone navigation: a month grid is unreadable at 390px, so small screens get the week as a row
 * of days (a dot marks days with plans) above the day's list.
 */
export default function WeekStrip({
  selected,
  busyDays,
  onPick,
}: {
  selected: Date;
  busyDays: Set<string>;
  onPick: (date: Date) => void;
}) {
  const weekStart = addDays(selected, -selected.getDay());
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = dayKey(new Date());

  return (
    <div className="cal-strip" role="group" aria-label="Pick a day">
      <button type="button" className="cal-strip-nav" onClick={() => onPick(addDays(selected, -7))} aria-label="Previous week">
        <FiChevronLeft aria-hidden />
      </button>
      {days.map((d) => {
        const key = dayKey(d);
        const isSel = key === dayKey(selected);
        return (
          <button
            key={key}
            type="button"
            className={`cal-strip-day${isSel ? " is-sel" : ""}${key === today ? " is-today" : ""}`}
            aria-pressed={isSel}
            aria-label={d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            onClick={() => onPick(d)}
          >
            <span className="cal-strip-wd">{d.toLocaleDateString("en-US", { weekday: "narrow" })}</span>
            <span className="cal-strip-num">{d.getDate()}</span>
            <span className={`cal-strip-dot${busyDays.has(key) ? " is-busy" : ""}`} aria-hidden />
          </button>
        );
      })}
      <button type="button" className="cal-strip-nav" onClick={() => onPick(addDays(selected, 7))} aria-label="Next week">
        <FiChevronRight aria-hidden />
      </button>
    </div>
  );
}
