"use client";

import Link from "next/link";
import { useDroppable } from "@dnd-kit/core";

export interface MiniCalendarMarker {
  date: string; // "YYYY-MM-DD"
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function buildMonthGrid(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];

  for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    cells.push(date.toISOString().slice(0, 10));
  }
  return cells;
}

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

export default function MiniCalendar({ markers = [] }: { markers?: MiniCalendarMarker[] }) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const activityDates = new Set(markers.map((marker) => marker.date));
  const cells = buildMonthGrid(today.getFullYear(), today.getMonth());
  const monthLabel = today.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="card rounded shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="card-title mb-0">{monthLabel}</h6>
          <Link href="/me/calendar" className="small">
            Open Calendar
          </Link>
        </div>
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
      </div>
    </div>
  );
}
