"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { FiChevronLeft, FiChevronRight, FiPlus, FiX, FiCommand } from "react-icons/fi";
import EventFormDialog, { type EventFormValues } from "./EventFormDialog";
import QuickAdd from "./QuickAdd";
import { EventPeek, TaskPeek } from "./EventPeek";
import AgendaPanel from "./AgendaPanel";
import WeekStrip from "./WeekStrip";
import ShortcutsDialog from "./ShortcutsDialog";
import { getCalendarRange, createEvent, moveEvent, deleteEvent } from "@/features/calendar/actions";
import { completeTask, reopenTask } from "@/features/tasks/actions";
import { toCalendarEventInput } from "@/features/calendar/mappers";
import { EVENT_CATEGORY, EVENT_COLOR_KEYS, EVENT_COLORS } from "@/features/calendar/colors";
import { addDays, dayKey, localIso, startOfDay, type CalendarTask } from "@/features/calendar/format";
import { useToast } from "@/components/shared/ToastProvider";
import type { EventColor } from "@/db/schema/productivity";
import type { CalendarApi, CalendarEventInput, CalendarViewMode, EventMove, ScreenPoint } from "./CalendarView";

// A grid-shaped placeholder while FullCalendar loads, so the page does not jump from a spinner to a month.
function GridSkeleton() {
  return (
    <div className="cal-skeleton" role="status" aria-label="Loading calendar">
      <div className="cal-skeleton-head">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="skeleton" />
        ))}
      </div>
      {Array.from({ length: 5 }, (_, r) => (
        <div key={r} className="cal-skeleton-row">
          {Array.from({ length: 7 }, (_, c) => (
            <div key={c}>
              <span className="skeleton cal-skeleton-num" />
              {(r * 7 + c) % 3 === 0 && <span className="skeleton cal-skeleton-ev" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const CalendarView = dynamic(() => import("./CalendarView"), { ssr: false, loading: GridSkeleton });

// One-shot animation classes on the grid wrapper (see replay()).
const ANIMS = ["nav-next", "nav-prev", "nav-view", "nav-today", "nav-filter"] as const;
type Anim = (typeof ANIMS)[number];
const savedId = (data: unknown) => (data as { id?: string } | null)?.id;

const VIEW_OPTIONS: { value: CalendarViewMode; label: string; key: string }[] = [
  { value: "dayGridMonth", label: "Month", key: "m" },
  { value: "timeGridWeek", label: "Week", key: "w" },
  { value: "timeGridDay", label: "Day", key: "d" },
  { value: "listWeek", label: "List", key: "l" },
];

// Per-viewer conveniences only; the page works the same with storage blocked.
const STORE = { view: "cal:view", hidden: "cal:hidden", tasks: "cal:tasks", hint: "cal:hint-dismissed" };
const read = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the choice simply isn't remembered */
  }
};

type Peek = { kind: "event"; id: string; at: ScreenPoint } | { kind: "task"; id: string; at: ScreenPoint };
type Dialog = { values: EventFormValues; heading?: string };

interface CalendarShellProps {
  initialEvents: CalendarEventInput[];
  initialRange: { start: string; end: string };
}

export default function CalendarShell({ initialEvents, initialRange }: CalendarShellProps) {
  const [calendarApi, setCalendarApi] = useState<CalendarApi | null>(null);
  const [rangeTitle, setRangeTitle] = useState("");
  const [viewStart, setViewStart] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<CalendarEventInput[]>(initialEvents);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [agenda, setAgenda] = useState<{ events: CalendarEventInput[]; tasks: CalendarTask[] }>({ events: [], tasks: [] });
  const [view, setView] = useState<CalendarViewMode>("dayGridMonth");
  const [isPhone, setIsPhone] = useState(false);
  const [hidden, setHidden] = useState<Set<EventColor>>(new Set());
  const [showTasks, setShowTasks] = useState(true);
  const [hintOpen, setHintOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [quickAdd, setQuickAdd] = useState<{ selection: { start: string; end: string; allDay: boolean }; at: ScreenPoint } | null>(null);
  const [peek, setPeek] = useState<Peek | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [showKeys, setShowKeys] = useState(false);
  // Separate pending flags: only a range load dims the grid; a background agenda refresh never does.
  const [isPending, startTransition] = useTransition();
  const [isRangePending, startRange] = useTransition();
  const [landedId, setLandedId] = useState<string | null>(null);
  const [tickedTaskId, setTickedTaskId] = useState<string | null>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const animRef = useRef<HTMLDivElement>(null);
  const segRef = useRef<HTMLDivElement>(null);
  const currentRange = useRef(initialRange);
  const toast = useToast();

  const handleCalendarApi = useCallback((api: CalendarApi | null) => setCalendarApi(api), []);

  // Restore the viewer's choices once mounted (storage is not available during server render).
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 767.98px)").matches;
    setIsPhone(phone);
    const stored = read(STORE.view) as CalendarViewMode | null;
    const initial = phone ? "listDay" : stored && VIEW_OPTIONS.some((o) => o.value === stored) ? stored : "dayGridMonth";
    setView(initial);
    calendarApi?.changeView(initial);
    const hiddenRaw = read(STORE.hidden);
    if (hiddenRaw) setHidden(new Set(hiddenRaw.split(",").filter((c): c is EventColor => (EVENT_COLOR_KEYS as readonly string[]).includes(c))));
    setShowTasks(read(STORE.tasks) !== "0");
    setHintOpen(read(STORE.hint) !== "1");
  }, [calendarApi]);

  // Countdowns in the agenda stay honest without a reload.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const refreshAgenda = useCallback(() => {
    const from = startOfDay(new Date());
    const range = { start: localIso(from), end: localIso(addDays(from, 7)) };
    void getCalendarRange(range).then(({ events: rows, tasks: dated }) =>
      setAgenda({ events: rows.map(toCalendarEventInput), tasks: dated })
    );
  }, []);

  useEffect(() => refreshAgenda(), [refreshAgenda]);

  // FullCalendar fires datesSet again on every resize and height change; only a new range needs data.
  const loadedRange = useRef("");
  const refetch = (range: { start: string; end: string }, force = false) => {
    currentRange.current = range;
    const key = `${range.start}|${range.end}`;
    if (!force && key === loadedRange.current) return;
    loadedRange.current = key;
    startRange(async () => {
      const { events: rows, tasks: dated } = await getCalendarRange(range);
      setEvents(rows.map(toCalendarEventInput));
      setTasks(dated);
    });
  };

  const refreshAll = () => {
    refetch(currentRange.current, true);
    refreshAgenda();
  };

  // Restart a one-shot animation: drop any running one, force a reflow, add the new class. The
  // wrapper className is static in JSX, so React never strips the class mid-animation.
  const replay = (anim: Anim) => {
    const el = animRef.current;
    if (!el) return;
    el.classList.remove(...ANIMS);
    void el.offsetWidth;
    el.classList.add(anim);
  };

  const goPrev = () => {
    calendarApi?.prev();
    replay("nav-prev");
  };
  const goNext = () => {
    calendarApi?.next();
    replay("nav-next");
  };
  const goToday = () => {
    // Slide only when today is outside the visible range; otherwise there is nowhere to travel.
    const shown = calendarApi?.view;
    const now = new Date();
    const travelled = Boolean(shown && (now < shown.activeStart || now >= shown.activeEnd));
    const forward = Boolean(shown && now >= shown.activeEnd);
    calendarApi?.today();
    if (travelled) replay(forward ? "nav-next" : "nav-prev");
    // Pulse the date once it is on screen, after any slide has settled.
    window.setTimeout(() => replay("nav-today"), travelled ? 300 : 0);
  };

  const changeView = (nextView: CalendarViewMode) => {
    setView(nextView);
    calendarApi?.changeView(nextView);
    if (!isPhone) write(STORE.view, nextView);
    replay("nav-view");
  };

  // Mark what just landed (created, moved, restored) so the eye finds it; the class expires.
  const land = (id: string | undefined) => {
    if (!id) return;
    setLandedId(id);
    window.setTimeout(() => setLandedId((cur) => (cur === id ? null : cur)), 4000);
  };

  // The view switcher highlight slides to the chosen option instead of jumping.
  useLayoutEffect(() => {
    const group = segRef.current;
    const active = group?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!group || !active) return;
    setPill({ left: active.offsetLeft, width: active.offsetWidth });
  }, [view, isPhone]);

  const newEventValues = (): EventFormValues => {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    return { title: "", start: start.toISOString(), end: new Date(start.getTime() + 3600_000).toISOString(), allDay: false };
  };

  // ---- Mutations with Undo ----
  const restore = (values: EventFormValues) => {
    startTransition(async () => {
      const result = await createEvent({
        title: values.title,
        description: values.description ?? undefined,
        location: values.location ?? undefined,
        start: values.start,
        end: values.end,
        allDay: values.allDay,
        color: values.color,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Event restored");
      land(savedId(result.data));
      refreshAll();
    });
  };

  const handleDeleted = (values: EventFormValues) => {
    toast.success("Event deleted", { action: { label: "Undo", onClick: () => restore(values) } });
  };

  const deleteFromPeek = (event: CalendarEventInput) => {
    setPeek(null);
    startTransition(async () => {
      const result = await deleteEvent(event.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      handleDeleted({ ...event });
      refreshAll();
    });
  };

  const handleMove = (move: EventMove, revert: () => void) => {
    startTransition(async () => {
      const { previous, ...next } = move;
      const result = await moveEvent(next);
      if (!result.ok) {
        revert();
        toast.error(result.error);
        return;
      }
      land(move.id);
      refreshAll();
      toast.success("Event moved", {
        action: {
          label: "Undo",
          onClick: () =>
            startTransition(async () => {
              const back = await moveEvent({ id: move.id, ...previous });
              if (!back.ok) toast.error(back.error);
              else land(move.id);
              refreshAll();
            }),
        },
      });
    });
  };

  const toggleTask = (task: CalendarTask) => {
    startTransition(async () => {
      const result = task.done ? await reopenTask(task.id) : await completeTask(task.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPeek(null);
      if (!task.done) {
        setTickedTaskId(task.id);
        window.setTimeout(() => setTickedTaskId(null), 900);
      }
      toast.success(task.done ? "Task reopened" : "Task done");
      refreshAll();
    });
  };

  // ---- Filters ----
  const toggleCategory = (c: EventColor) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      write(STORE.hidden, Array.from(next).join(","));
      return next;
    });
    replay("nav-filter");
  };
  const toggleTasks = () => {
    setShowTasks((v) => {
      write(STORE.tasks, v ? "0" : "1");
      return !v;
    });
    replay("nav-filter");
  };
  const visibleEvents = useMemo(() => events.filter((e) => !hidden.has(e.color ?? "blue")), [events, hidden]);
  const busyDays = useMemo(() => {
    const days = new Set<string>();
    for (const e of events) days.add(dayKey(new Date(e.start)));
    for (const t of tasks) if (!t.done) days.add(t.dueDate);
    return days;
  }, [events, tasks]);

  // ---- Keyboard ----
  const anyOverlay = Boolean(quickAdd || peek || dialog || showKeys);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || anyOverlay) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;

      const option = VIEW_OPTIONS.find((o) => o.key === event.key.toLowerCase());
      if (option) changeView(option.value);
      else if (event.key === "t" || event.key === "T") goToday();
      else if (event.key === "ArrowLeft") goPrev();
      else if (event.key === "ArrowRight") goNext();
      else if (event.key === "n" || event.key === "N") setDialog({ values: newEventValues() });
      else if (event.key === "?") setShowKeys(true);
      else return;
      event.preventDefault();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  const peekEvent = peek?.kind === "event" ? (events.find((e) => e.id === peek.id) ?? agenda.events.find((e) => e.id === peek.id)) : undefined;
  const peekTask = peek?.kind === "task" ? (tasks.find((t) => t.id === peek.id) ?? agenda.tasks.find((t) => t.id === peek.id)) : undefined;

  const dismissHint = () => {
    setHintOpen(false);
    write(STORE.hint, "1");
  };

  return (
    <div className="row g-4">
      <div className="col-xxl-9">
        <div className="card rounded shadow-sm cal-card">
          <div className="card-body">
            <div className="cal-toolbar d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div className="d-flex align-items-center gap-3">
                <div className="btn-group">
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={goPrev} disabled={!calendarApi} aria-label="Previous" title="Previous (←)">
                    <FiChevronLeft />
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={goToday} disabled={!calendarApi} title="Today (T)">
                    Today
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={goNext} disabled={!calendarApi} aria-label="Next" title="Next (→)">
                    <FiChevronRight />
                  </button>
                </div>
                <h2 className="cal-title" aria-live="polite">{rangeTitle}</h2>
              </div>

              <div className="d-flex align-items-center gap-2">
                {!isPhone && (
                  <div className="btn-group cal-seg" role="group" aria-label="View" ref={segRef}>
                    {pill && <span className="cal-seg-pill" style={{ transform: `translateX(${pill.left - 3}px)`, width: pill.width }} aria-hidden />}
                    {VIEW_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`btn btn-sm ${view === option.value ? "btn-primary" : "btn-outline-primary"}`}
                        aria-pressed={view === option.value}
                        title={`${option.label} (${option.key.toUpperCase()})`}
                        onClick={() => changeView(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" className="btn btn-sm btn-primary d-flex align-items-center gap-1" title="New event (N)" onClick={() => setDialog({ values: newEventValues() })}>
                  <FiPlus /> New event
                </button>
                <button type="button" className="btn btn-sm btn-outline-primary border-0 d-none d-md-inline-flex" onClick={() => setShowKeys(true)} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)">
                  <FiCommand aria-hidden />
                </button>
              </div>
            </div>

            <div className="cal-filters" role="group" aria-label="Show categories">
              {EVENT_COLOR_KEYS.map((c) => (
                <button key={c} type="button" className={`cal-filter${hidden.has(c) ? " is-off" : ""}`} aria-pressed={!hidden.has(c)} onClick={() => toggleCategory(c)}>
                  <span className="cal-cat-dot" style={{ background: EVENT_COLORS[c] }} aria-hidden />
                  {EVENT_CATEGORY[c]}
                </button>
              ))}
              <button type="button" className={`cal-filter${showTasks ? "" : " is-off"}`} aria-pressed={showTasks} onClick={toggleTasks}>
                <span className="cal-cat-dot cal-cat-dot--task" aria-hidden />
                Tasks
              </button>
            </div>

            {hintOpen && (
              <div className="cal-hint" role="note">
                <span>
                  <strong>Tip:</strong>{" "}
                  {isPhone
                    ? "pick a day below to see its plan, then tap New event to add one."
                    : "click a day to add an event, drag across hours to block time, drag an event to move it. Press ? for shortcuts."}
                </span>
                <button type="button" className="btn btn-sm btn-outline-primary border-0" onClick={dismissHint} aria-label="Dismiss tip">
                  <FiX aria-hidden />
                </button>
              </div>
            )}

            {isPhone && (
              <WeekStrip
                selected={viewStart}
                busyDays={busyDays}
                onPick={(d) => {
                  if (dayKey(d) !== dayKey(viewStart)) replay(d > viewStart ? "nav-next" : "nav-prev");
                  calendarApi?.gotoDate(d);
                  if (view !== "listDay") changeView("listDay");
                }}
              />
            )}

            <div className={isRangePending ? "cal-grid is-loading" : "cal-grid"}>
              <div className="cal-anim" ref={animRef}>
              <CalendarView
                highlightId={landedId}
                onCalendarApi={handleCalendarApi}
                events={visibleEvents}
                tasks={showTasks ? tasks : []}
                initialView={view}
                onRangeChange={refetch}
                onViewChange={({ title, type, currentStart }) => {
                  setRangeTitle(title);
                  setView(type);
                  setViewStart(currentStart);
                }}
                onDateSelect={(selection, at) => {
                  calendarApi?.unselect();
                  setQuickAdd({ selection, at });
                }}
                onEventClick={(id, at) => setPeek({ kind: "event", id, at })}
                onTaskClick={(id, at) => setPeek({ kind: "task", id, at })}
                onEventMove={handleMove}
              />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-xxl-3">
        <AgendaPanel
          now={now}
          events={agenda.events.filter((e) => !hidden.has(e.color ?? "blue"))}
          tasks={showTasks ? agenda.tasks : []}
          tickedTaskId={tickedTaskId}
          onEventClick={(id, at) => setPeek({ kind: "event", id, at })}
          onTaskClick={(id, at) => setPeek({ kind: "task", id, at })}
        />
      </div>

      {quickAdd && (
        <QuickAdd
          selection={quickAdd.selection}
          at={quickAdd.at}
          onClose={() => setQuickAdd(null)}
          onCreated={(title, id) => {
            setQuickAdd(null);
            land(id);
            toast.success(`"${title}" added`);
            refreshAll();
          }}
          onMoreOptions={(values) => {
            setQuickAdd(null);
            setDialog({ values });
          }}
        />
      )}

      {peekEvent && peek && (
        <EventPeek
          event={peekEvent}
          at={peek.at}
          now={now}
          onClose={() => setPeek(null)}
          onEdit={() => {
            setPeek(null);
            setDialog({ values: { ...peekEvent } });
          }}
          onDuplicate={() => {
            setPeek(null);
            setDialog({ values: { ...peekEvent, id: undefined, title: `${peekEvent.title} (copy)` }, heading: "Duplicate event" });
          }}
          onDelete={() => deleteFromPeek(peekEvent)}
        />
      )}

      {peekTask && peek && <TaskPeek task={peekTask} at={peek.at} pending={isPending} onClose={() => setPeek(null)} onToggle={() => toggleTask(peekTask)} />}

      {dialog && (
        <EventFormDialog
          initialValues={dialog.values}
          heading={dialog.heading}
          onClose={() => setDialog(null)}
          onSaved={(id) => {
            land(id);
            refreshAll();
          }}
          onDeleted={handleDeleted}
        />
      )}

      {showKeys && <ShortcutsDialog onClose={() => setShowKeys(false)} />}
    </div>
  );
}
