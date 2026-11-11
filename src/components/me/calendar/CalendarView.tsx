"use client";

import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import type { CalendarApi, DatesSetArg, EventClickArg, EventContentArg, EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { FiCheckSquare, FiSquare } from "react-icons/fi";
import { eventColorHex } from "@/features/calendar/colors";
import type { EventColor } from "@/db/schema/productivity";
import type { CalendarTask } from "@/features/calendar/format";

export type CalendarViewMode = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek" | "listDay";

export interface CalendarEventInput {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start: string;
  end: string;
  allDay: boolean;
  color?: EventColor | null;
}

/** Where on screen something happened, so a popover can open beside it. */
export interface ScreenPoint {
  x: number;
  y: number;
}

export interface EventMove {
  id: string;
  start: string;
  end: string;
  allDay: boolean;
  /** The event's times before the drag, for Undo. */
  previous: { start: string; end: string; allDay: boolean };
}

export interface CalendarViewProps {
  events: CalendarEventInput[];
  /** An event that just landed (created, moved, restored), drawn with a one-shot highlight. */
  highlightId?: string | null;
  tasks: CalendarTask[];
  initialView: CalendarViewMode;
  onCalendarApi: (api: CalendarApi | null) => void;
  onRangeChange: (range: { start: string; end: string }) => void;
  /** The visible range as FullCalendar words it ("November 2026"), plus the view and its first day. */
  onViewChange?: (view: { title: string; type: CalendarViewMode; currentStart: Date }) => void;
  onDateSelect: (selection: { start: string; end: string; allDay: boolean }, at: ScreenPoint) => void;
  onEventClick: (eventId: string, at: ScreenPoint) => void;
  onTaskClick: (taskId: string, at: ScreenPoint) => void;
  onEventMove: (move: EventMove, revert: () => void) => void;
}

const TASK_PREFIX = "task:";

function handleMove(arg: EventDropArg | EventResizeDoneArg, onEventMove: CalendarViewProps["onEventMove"]) {
  const { event, oldEvent } = arg;
  if (!event.start || !oldEvent.start) return;
  onEventMove(
    {
      id: event.id,
      start: event.start.toISOString(),
      end: (event.end ?? event.start).toISOString(),
      allDay: event.allDay,
      previous: {
        start: oldEvent.start.toISOString(),
        end: (oldEvent.end ?? oldEvent.start).toISOString(),
        allDay: oldEvent.allDay,
      },
    },
    arg.revert
  );
}

// Below the clicked element, or at the pointer when there is no element (a drag selection).
function pointFrom(el: HTMLElement | null, js?: MouseEvent | null): ScreenPoint {
  if (el) {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.bottom };
  }
  if (js) return { x: js.clientX, y: js.clientY };
  return { x: window.innerWidth / 2, y: window.innerHeight / 3 };
}

function renderContent(arg: EventContentArg) {
  // `true` asks FullCalendar for its default rendering; undefined would render an empty chip.
  if (arg.event.extendedProps.kind !== "task") return true;
  const done = Boolean(arg.event.extendedProps.done);
  const Icon = done ? FiCheckSquare : FiSquare;
  return (
    <span className="cal-task-chip">
      <Icon aria-hidden />
      <span className="cal-task-title">{arg.event.title}</span>
    </span>
  );
}

const CalendarView = function CalendarView({
  events,
  highlightId,
  tasks,
  initialView,
  onCalendarApi,
  onRangeChange,
  onViewChange,
  onDateSelect,
  onEventClick,
  onTaskClick,
  onEventMove,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  // Week/day grids get a fixed height (opening at 07:00) instead of a page-long column from midnight.
  const [timeGrid, setTimeGrid] = useState(initialView.startsWith("timeGrid"));

  // scrollTime only applies at render, before the fixed height exists; re-apply it once the grid can scroll.
  useEffect(() => {
    if (timeGrid) calendarRef.current?.getApi().scrollToTime("07:00:00");
  }, [timeGrid]);

  useEffect(() => {
    onCalendarApi(calendarRef.current?.getApi() ?? null);
    return () => onCalendarApi(null);
  }, [onCalendarApi]);

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
      initialView={initialView}
      headerToolbar={false}
      height={timeGrid ? 760 : "auto"}
      scrollTime="07:00:00"
      eventDisplay="block"
      dayMaxEvents={3}
      nowIndicator
      fixedWeekCount={false}
      views={{ timeGrid: { dayHeaderFormat: { weekday: "short", day: "numeric" } } }}
      selectable
      selectMirror
      editable
      eventStartEditable
      eventDurationEditable
      events={[
        ...events.map(({ id, title, start, end, allDay, color }) => ({
          id,
          title,
          start,
          end,
          allDay,
          // A tint of the event colour reads as a label, not a shout; the full colour stays on the edge bar.
          backgroundColor: `color-mix(in srgb, ${eventColorHex(color)} 14%, white)`,
          borderColor: eventColorHex(color),
          extendedProps: { order: 0 },
          classNames: id === highlightId ? ["is-landed"] : [],
        })),
        // Open dated tasks sit in the all-day row as checklist chips, after the day's events; finished
        // ones would only crowd the grid (the agenda still shows today's). Moved from Tasks, not dragged here.
        ...tasks.filter((t) => !t.done).map((t) => ({
          id: `${TASK_PREFIX}${t.id}`,
          title: t.title,
          start: t.dueDate,
          allDay: true,
          editable: false,
          classNames: t.done ? ["cal-task", "is-done"] : ["cal-task"],
          extendedProps: { kind: "task", done: t.done, order: 1 },
        })),
      ]}
      eventContent={renderContent}
      eventOrder="order,start,-duration,allDay,title"
      datesSet={(arg: DatesSetArg) => {
        onRangeChange({ start: arg.startStr, end: arg.endStr });
        onViewChange?.({ title: arg.view.title, type: arg.view.type as CalendarViewMode, currentStart: arg.view.currentStart });
        setTimeGrid(arg.view.type.startsWith("timeGrid"));
      }}
      select={(arg) => {
        // Full instants, never startStr: an all-day selection's startStr is a bare "2027-02-15".
        onDateSelect({ start: arg.start.toISOString(), end: arg.end.toISOString(), allDay: arg.allDay }, pointFrom(null, arg.jsEvent));
      }}
      eventClick={(arg: EventClickArg) => {
        arg.jsEvent.preventDefault();
        const at = pointFrom(arg.el, arg.jsEvent);
        if (arg.event.id.startsWith(TASK_PREFIX)) onTaskClick(arg.event.id.slice(TASK_PREFIX.length), at);
        else onEventClick(arg.event.id, at);
      }}
      eventDrop={(arg: EventDropArg) => handleMove(arg, onEventMove)}
      eventResize={(arg: EventResizeDoneArg) => handleMove(arg, onEventMove)}
    />
  );
};

export type { CalendarApi };
export default CalendarView;
