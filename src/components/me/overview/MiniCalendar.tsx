"use client";

import { monthGrid } from "@/features/calendar/format";
import { useDroppable } from "@dnd-kit/core";
import { FiCalendar } from "react-icons/fi";
import OverviewCard from "./OverviewCard";

export interface MiniCalendarMarker {
  date: string; // "YYYY-MM-DD"
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function MiniCalendarDay({ date, hasActivity, isToday }: { date: string; hasActivity: boolean; isToday: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `mini-calendar-${date}`, data: { date } });
  const dayNumber = Number(date.slice(-2));

  return (
    <div
      ref={setNodeRef}
      className="d-flex flex-column align-items-center justify-content-center rounded"
      style={{
        aspectRatio: "1",
        background: isOver ? "rgba(42,82,195,0.15)" : isToday ? "rgba(42,82,195,0.08)" : "transparent",
        fontWeight: isToday ? 600 : 400,
      }}
    >
      <span className="small">{dayNumber}</span>
      {hasActivity && (
        <span
          style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--app-primary)" }}
          aria-label="Has activity"
        />
      )}
    </div>
  );
}

/** `today` is the owner's day ("YYYY-MM-DD"); the grid used local-midnight ISO strings and shifted a day east of UTC. */
export default function MiniCalendar({ markers = [], today }: { markers?: MiniCalendarMarker[]; today: string }) {
  const todayKey = today;
  const activityDates = new Set(markers.map((marker) => marker.date));
  const cells = monthGrid(today);
  const monthLabel = new Date(`${today.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <OverviewCard title={monthLabel} icon={FiCalendar} href="/me/calendar" linkLabel="Open calendar">
      <div className="d-grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {WEEKDAY_LABELS.map((label, index) => (
          <div key={index} className="text-center text-muted small">
            {label}
          </div>
        ))}
        {cells.map((date, index) =>
          date ? (
            <MiniCalendarDay key={date} date={date} hasActivity={activityDates.has(date)} isToday={date === todayKey} />
          ) : (
            <div key={index} />
          )
        )}
      </div>
      <p className="text-muted small mt-2 mb-0">Drag a task here to schedule it.</p>
    </OverviewCard>
  );
}
