import type { EventPreview } from "@/components/me/overview/CalendarSection";
import type { CalendarEventInput } from "@/components/me/calendar/CalendarView";
import type { EventColor } from "@/db/schema/productivity";
import { eventColorHex } from "./colors";

interface EventRow {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  color: EventColor | null;
}

export function toEventPreview(event: EventRow): EventPreview {
  const timeLabel = event.allDay
    ? "All day"
    : event.startAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return { id: event.id, title: event.title, timeLabel, colorHex: eventColorHex(event.color) };
}

export function toCalendarEventInput(event: EventRow): CalendarEventInput {
  return {
    id: event.id,
    title: event.title,
    start: event.startAt.toISOString(),
    end: event.endAt.toISOString(),
    allDay: event.allDay,
    color: event.color,
  };
}
