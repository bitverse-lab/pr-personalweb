import type { EventPreview } from "@/components/me/overview/CalendarSection";
import type { CalendarEventInput } from "@/components/me/calendar/CalendarView";
import type { EventColor } from "@/db/schema/productivity";
import { eventColorHex } from "./colors";
import { relativeStart } from "./format";

interface EventRow {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  color: EventColor | null;
}

export function toEventPreview(event: EventRow): EventPreview {
  const timeLabel = event.allDay ? "All day" : relativeStart(event.startAt, event.endAt, new Date());
  return { id: event.id, title: event.title, timeLabel, colorHex: eventColorHex(event.color) };
}

export function toCalendarEventInput(event: EventRow): CalendarEventInput {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    location: event.location ?? null,
    start: event.startAt.toISOString(),
    end: event.endAt.toISOString(),
    allDay: event.allDay,
    color: event.color,
  };
}
