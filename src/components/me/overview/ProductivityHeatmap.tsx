"use client";

import { useMemo, useState } from "react";
import { heatSteps as HEAT_STEPS } from "@/lib/chart-theme";

export interface ActivityPoint {
  day: string; // "YYYY-MM-DD"
  count: number;
}


function colorForCount(count: number, max: number): string {
  if (count === 0 || max === 0) return HEAT_STEPS[0];
  const bucket = Math.min(HEAT_STEPS.length - 1, Math.ceil((count / max) * (HEAT_STEPS.length - 1)));
  return HEAT_STEPS[Math.max(1, bucket)];
}

function buildDays(activity: ActivityPoint[]): { date: string; count: number }[] {
  const countByDay = new Map(activity.map((point) => [point.day, point.count]));
  const days: { date: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 89; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 86400000);
    const key = date.toISOString().slice(0, 10);
    days.push({ date: key, count: countByDay.get(key) ?? 0 });
  }
  return days;
}

// Groups the 90-day list into Sunday-first week columns, padding the first
// week so day-of-week rows line up (GitHub-contribution-graph layout).
function toWeeks(days: { date: string; count: number }[]): ({ date: string; count: number } | null)[][] {
  const weeks: ({ date: string; count: number } | null)[][] = [];
  let currentWeek: ({ date: string; count: number } | null)[] = [];

  const firstDow = new Date(days[0].date).getDay();
  for (let i = 0; i < firstDow; i++) currentWeek.push(null);

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  return weeks;
}

export default function ProductivityHeatmap({ activity }: { activity: ActivityPoint[] }) {
  const [showTable, setShowTable] = useState(false);
  const days = useMemo(() => buildDays(activity), [activity]);
  const weeks = useMemo(() => toWeeks(days), [days]);
  const max = useMemo(() => Math.max(1, ...days.map((day) => day.count)), [days]);
  const activeDays = days.filter((day) => day.count > 0);

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <div className="d-flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="d-flex flex-column gap-1">
              {week.map((day, dayIndex) =>
                day ? (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} task${day.count === 1 ? "" : "s"} completed`}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: colorForCount(day.count, max),
                    }}
                  />
                ) : (
                  <div key={dayIndex} style={{ width: 12, height: 12 }} />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mt-2">
        <div className="d-flex align-items-center gap-1">
          <span className="text-muted small me-1">Less</span>
          {HEAT_STEPS.map((color) => (
            <div key={color} style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
          ))}
          <span className="text-muted small ms-1">More</span>
        </div>
        <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Hide list" : "View as list"}
        </button>
      </div>

      {showTable && (
        <div className="mt-2" style={{ maxHeight: 160, overflowY: "auto" }}>
          {activeDays.length === 0 ? (
            <p className="text-muted small mb-0">No completions in the last 90 days.</p>
          ) : (
            <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tasks completed</th>
                </tr>
              </thead>
              <tbody>
                {activeDays.map((day) => (
                  <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>{day.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
