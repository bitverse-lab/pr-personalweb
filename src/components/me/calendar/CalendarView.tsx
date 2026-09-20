"use client";

import { forwardRef } from "react";
import FullCalendar from "@fullcalendar/react";
import type { CalendarApi, DatesSetArg, EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { eventColorHex } from "@/features/calendar/colors";
import type { EventColor } from "@/db/schema/productivity";

export type CalendarViewMode = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek" | "listDay";

export interface CalendarEventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color?: EventColor | null;
}

export interface CalendarViewProps {
  events: CalendarEventInput[];
  initialView: CalendarViewMode;
  onRangeChange: (range: { start: string; end: string }) => void;
  onDateSelect: (selection: { start: string; end: string; allDay: boolean }) => void;
  onEventClick: (eventId: string) => void;
  onEventMove: (move: { id: string; start: string; end: string; allDay: boolean }, revert: () => void) => void;
}

function handleMove(
  arg: EventDropArg | EventResizeDoneArg,
  onEventMove: CalendarViewProps["onEventMove"]
) {
  const { event } = arg;
  if (!event.start) return;
  onEventMove(
    {
      id: event.id,
      start: event.start.toISOString(),
      end: (event.end ?? event.start).toISOString(),
      allDay: event.allDay,
    },
    arg.revert
  );
}

const CalendarView = forwardRef<FullCalendar, CalendarViewProps>(function CalendarView(
  { events, initialView, onRangeChange, onDateSelect, onEventClick, onEventMove },
  ref
) {
  return (
    <FullCalendar
      ref={ref}
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
      initialView={initialView}
      headerToolbar={false}
      height="auto"
      selectable
      editable
      eventStartEditable
      eventDurationEditable
      events={events.map(({ color, ...event }) => ({
        ...event,
        backgroundColor: eventColorHex(color),
        borderColor: eventColorHex(color),
      }))}
      datesSet={(arg: DatesSetArg) => onRangeChange({ start: arg.startStr, end: arg.endStr })}
      select={(arg) => onDateSelect({ start: arg.startStr, end: arg.endStr, allDay: arg.allDay })}
      eventClick={(arg: EventClickArg) => onEventClick(arg.event.id)}
      eventDrop={(arg: EventDropArg) => handleMove(arg, onEventMove)}
      eventResize={(arg: EventResizeDoneArg) => handleMove(arg, onEventMove)}
    />
  );
});

export type { CalendarApi };
export default CalendarView;
