// Pure date helpers for the calendar UI. No server imports: client components use these.

/** A dated task as the calendar shows it (a checklist chip on its due day). */
export interface CalendarTask {
  id: string;
  title: string;
  dueDate: string;
  done: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar day as "YYYY-MM-DD" (not UTC, which shifts the day for anyone east or west of Greenwich). */
/**
 * Sunday-first cells for the month containing `today` ("YYYY-MM-DD"): leading nulls, then every
 * day key. Built from the key alone, so it is the same on the server and in any browser timezone.
 */
export function monthGrid(today: string): (string | null)[] {
  const [y, m] = today.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: first.getUTCDay() }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${today.slice(0, 7)}-${pad(d)}`);
  return cells;
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** ISO string in local time with its offset, e.g. "2026-11-10T09:00:00+07:00", the form FullCalendar hands out. */
export function localIso(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  return `${dayKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const time = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/**
 * When an event starts, said the way a person would: "now", "in 25 min", "in 2 h 10 min",
 * "tomorrow at 9:00 AM", "Fri at 6:00 PM", then a plain date beyond a week.
 */
export function relativeStart(start: Date, end: Date, now: Date): string {
  if (start <= now && now < end) return "now";
  const minutes = Math.round((start.getTime() - now.getTime()) / 60000);
  if (minutes < 0) return "ended";
  if (minutes < 60) return minutes <= 1 ? "in 1 min" : `in ${minutes} min`;
  const days = Math.round((startOfDay(start).getTime() - startOfDay(now).getTime()) / 86400000);
  if (days === 0) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `in ${h} h` : `in ${h} h ${m} min`;
  }
  if (days === 1) return `tomorrow at ${time(start)}`;
  if (days < 7) return `${start.toLocaleDateString("en-US", { weekday: "short" })} at ${time(start)}`;
  return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Tue, Nov 10 · 9:00 AM – 10:00 AM", "Tue, Nov 10 · All day", or a span across days. */
export function formatWhen(start: Date, end: Date, allDay: boolean): string {
  const day = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (allDay) {
    // All-day ends are exclusive (midnight after the last day).
    const lastDay = addDays(end, -1);
    return dayKey(lastDay) <= dayKey(start) ? `${day(start)} · All day` : `${day(start)} – ${day(lastDay)}`;
  }
  if (dayKey(start) === dayKey(end)) return `${day(start)} · ${time(start)} – ${time(end)}`;
  return `${day(start)} ${time(start)} – ${day(end)} ${time(end)}`;
}
