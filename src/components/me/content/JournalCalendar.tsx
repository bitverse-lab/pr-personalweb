import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { openJournalDay } from "@/features/content/journal-actions";
import { MOOD_COLOR, moodLabel } from "@/features/content/journal-meta";
import type { JournalSummary } from "@/server/services/journal-service";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function JournalCalendar({
  month,
  today,
  entries,
  hrefFor,
}: {
  month: string;
  today: string;
  entries: JournalSummary[];
  hrefFor: (month: string) => string;
}) {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday first
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const title = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const isCurrent = month >= today.slice(0, 7);

  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="card rounded shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Link href={hrefFor(shiftMonth(month, -1))} className="btn btn-sm btn-outline-primary" aria-label="Previous month">
            <FiChevronLeft />
          </Link>
          <h6 className="mb-0">{title}</h6>
          {isCurrent ? (
            <button type="button" className="btn btn-sm btn-outline-primary" disabled aria-label="Next month"><FiChevronRight /></button>
          ) : (
            <Link href={hrefFor(shiftMonth(month, 1))} className="btn btn-sm btn-outline-primary" aria-label="Next month">
              <FiChevronRight />
            </Link>
          )}
        </div>
        <div className="d-grid text-center small" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-muted">{d[0]}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`b${i}`} />;
            const date = `${month}-${String(day).padStart(2, "0")}`;
            const entry = byDate.get(date);
            const isToday = date === today;
            const future = date > today;
            const base = { width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontSize: 13 } as const;
            const ring = isToday ? { outline: "2px solid var(--app-primary)", outlineOffset: 1 } : {};

            if (entry) {
              const bg = entry.mood ? MOOD_COLOR[entry.mood] : "var(--app-primary)";
              const dark = !entry.mood || entry.mood >= 3;
              const label = `${date}: entry, ${entry.wordCount} words${entry.mood ? `, mood ${moodLabel(entry.mood)}` : ""}`;
              return (
                <Link key={date} href={`/me/journal/${entry.id}`} aria-label={label} title={label} className="text-decoration-none fw-semibold" style={{ ...base, ...ring, background: bg, color: dark ? "#fff" : "var(--app-on-primary-soft)" }}>
                  {day}
                </Link>
              );
            }
            if (future) {
              return (
                <div key={date} className="text-muted" style={{ ...base, opacity: 0.4 }} aria-hidden>
                  {day}
                </div>
              );
            }
            return (
              <form key={date} action={openJournalDay}>
                <input type="hidden" name="date" value={date} />
                <button type="submit" className="btn p-0 border-0 text-muted" aria-label={`Write an entry for ${date}`} title="Write an entry for this day" style={{ ...base, ...ring, background: "var(--app-surface)" }}>
                  {day}
                </button>
              </form>
            );
          })}
        </div>
        <p className="text-muted small mt-3 mb-0">Filled days have an entry; shade shows mood (lighter = lower, darker = higher). Click an empty day to write one.</p>
      </div>
    </div>
  );
}
