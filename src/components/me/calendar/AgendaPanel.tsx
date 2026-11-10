"use client";

import { FiCheckSquare, FiMapPin, FiSquare } from "react-icons/fi";
import { eventColorHex } from "@/features/calendar/colors";
import { addDays, dayKey, relativeStart, startOfDay, type CalendarTask } from "@/features/calendar/format";
import type { CalendarEventInput, ScreenPoint } from "./CalendarView";

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function pointOf(e: React.MouseEvent<HTMLElement>): ScreenPoint {
  const r = e.currentTarget.getBoundingClientRect();
  // Open leftwards from the panel so the popover lands over the calendar, not off-screen.
  return { x: r.left - 330, y: r.top };
}

/**
 * "What is next?" answered without reading the grid: the next (or running) event with a
 * countdown, today's remaining plan, then the coming week, all from the same data the grid uses.
 */
export default function AgendaPanel({
  now,
  events,
  tasks,
  tickedTaskId,
  onEventClick,
  onTaskClick,
}: {
  now: Date;
  events: CalendarEventInput[];
  tasks: CalendarTask[];
  /** A task just marked done here, animated once. */
  tickedTaskId?: string | null;
  onEventClick: (id: string, at: ScreenPoint) => void;
  onTaskClick: (id: string, at: ScreenPoint) => void;
}) {
  const upcoming = events
    .filter((e) => new Date(e.end) > now)
    .sort((a, b) => a.start.localeCompare(b.start));
  const next = upcoming.find((e) => !e.allDay);
  const running = next && new Date(next.start) <= now;
  const progress = running ? Math.min(100, Math.round(((now.getTime() - new Date(next.start).getTime()) / (new Date(next.end).getTime() - new Date(next.start).getTime())) * 100)) : 0;
  const today = dayKey(now);
  const todayEvents = upcoming.filter((e) => dayKey(new Date(e.start)) <= today && e.id !== next?.id);
  const todayTasks = tasks.filter((t) => t.dueDate === today);

  const days = Array.from({ length: 6 }, (_, i) => addDays(startOfDay(now), i + 1)).map((d) => ({
    date: d,
    events: upcoming.filter((e) => dayKey(new Date(e.start)) === dayKey(d)),
    tasks: tasks.filter((t) => t.dueDate === dayKey(d) && !t.done),
  }));
  const weekEmpty = days.every((d) => d.events.length === 0 && d.tasks.length === 0);

  return (
    <aside className="card rounded shadow-sm cal-agenda" aria-label="Agenda">
      <div className="card-body">
        <section className="cal-agenda-sec">
        <h2 className="cal-agenda-h">Up next</h2>
        {next ? (
          <button type="button" className="cal-next" onClick={(e) => onEventClick(next.id, pointOf(e))} style={{ ["--ev" as string]: eventColorHex(next.color) }}>
            <span className="cal-next-rel">
              {running ? (
                <>
                  <span className="cal-live-dot" aria-hidden /> Happening now
                </>
              ) : (
                relativeStart(new Date(next.start), new Date(next.end), now)
              )}
            </span>
            <span className="cal-next-title">{next.title}</span>
            <span className="cal-next-meta">
              {time(next.start)} – {time(next.end)}
              {next.location && (
                <>
                  {" · "}
                  <FiMapPin aria-hidden /> {next.location}
                </>
              )}
            </span>
            {running && (
              <span className="cal-next-progress" role="progressbar" aria-label="Time elapsed" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${progress}%` }} />
              </span>
            )}
          </button>
        ) : (
          <p className="cal-agenda-empty">Nothing else timed this week.</p>
        )}
        </section>

        <section className="cal-agenda-sec">
        <h2 className="cal-agenda-h">Today</h2>
        {todayEvents.length === 0 && todayTasks.length === 0 ? (
          <p className="cal-agenda-empty">Nothing else today.</p>
        ) : (
          <ul className="list-unstyled cal-agenda-list mb-0">
            {todayEvents.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={(ev) => onEventClick(e.id, pointOf(ev))}>
                  <span className="cal-cat-dot" style={{ background: eventColorHex(e.color) }} aria-hidden />
                  <span className="cal-agenda-time">{e.allDay ? "All day" : time(e.start)}</span>
                  <span className="cal-agenda-title">{e.title}</span>
                </button>
              </li>
            ))}
            {todayTasks.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={(ev) => onTaskClick(t.id, pointOf(ev))}
                  className={[t.done && "is-done", t.id === tickedTaskId && "is-ticked"].filter(Boolean).join(" ") || undefined}
                >
                  {t.done ? <FiCheckSquare aria-hidden className="cal-agenda-icon" /> : <FiSquare aria-hidden className="cal-agenda-icon" />}
                  <span className="cal-agenda-time">Task</span>
                  <span className="cal-agenda-title">{t.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        </section>

        <section className="cal-agenda-sec">
        <h2 className="cal-agenda-h">This week</h2>
        {weekEmpty ? (
          <p className="cal-agenda-empty">A clear week. Click a day to plan something.</p>
        ) : (
          days
            .filter((d) => d.events.length + d.tasks.length > 0)
            .map((d) => (
              <div key={dayKey(d.date)} className="cal-agenda-day">
                <p className="cal-agenda-dayname">{d.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                <ul className="list-unstyled cal-agenda-list mb-0">
                  {d.events.map((e) => (
                    <li key={e.id}>
                      <button type="button" onClick={(ev) => onEventClick(e.id, pointOf(ev))}>
                        <span className="cal-cat-dot" style={{ background: eventColorHex(e.color) }} aria-hidden />
                        <span className="cal-agenda-time">{e.allDay ? "All day" : time(e.start)}</span>
                        <span className="cal-agenda-title">{e.title}</span>
                      </button>
                    </li>
                  ))}
                  {d.tasks.map((t) => (
                    <li key={t.id}>
                      <button type="button" onClick={(ev) => onTaskClick(t.id, pointOf(ev))}>
                        <FiSquare aria-hidden className="cal-agenda-icon" />
                        <span className="cal-agenda-time">Task</span>
                        <span className="cal-agenda-title">{t.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
        )}
        </section>
      </div>
    </aside>
  );
}
