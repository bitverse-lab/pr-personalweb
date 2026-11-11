import { and, asc, eq, gt, gte, lt, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import type { EventColor } from "@/db/schema/productivity";

export interface CalendarEventValues {
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay?: boolean;
  color?: EventColor | null;
}

export const calendarEventRepository = {
  // Overlap semantics, not a naive BETWEEN: an event that starts before the visible
  // range but ends inside it (or spans across it entirely) must still show up.
  findManyByUserInRange(userId: string, start: string, end: string, limit?: number) {
    return db.query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.userId, userId),
        lte(calendarEvents.startAt, new Date(end)),
        gte(calendarEvents.endAt, new Date(start))
      ),
      orderBy: [asc(calendarEvents.startAt)],
      limit,
    });
  },

  // Timed events that genuinely overlap [start, end): touching edges (one ends at 10:00, the next
  // starts at 10:00) are not a clash, and all-day events are context, not a double booking.
  findOverlapping(userId: string, start: string, end: string, excludeId?: string) {
    return db.query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.userId, userId),
        eq(calendarEvents.allDay, false),
        lt(calendarEvents.startAt, new Date(end)),
        gt(calendarEvents.endAt, new Date(start)),
        excludeId ? ne(calendarEvents.id, excludeId) : undefined
      ),
      orderBy: [asc(calendarEvents.startAt)],
      limit: 3,
    });
  },

  findByIdForUser(id: string, userId: string) {
    return db.query.calendarEvents.findFirst({
      where: and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)),
    });
  },

  create(userId: string, values: CalendarEventValues) {
    return db
      .insert(calendarEvents)
      .values({
        userId,
        title: values.title,
        description: values.description,
        location: values.location,
        startAt: new Date(values.start),
        endAt: new Date(values.end),
        allDay: values.allDay ?? false,
        color: values.color ?? null,
      })
      .returning()
      .then((rows) => rows[0]);
  },

  update(id: string, userId: string, values: Partial<CalendarEventValues>) {
    return db
      .update(calendarEvents)
      .set({
        ...(values.title !== undefined && { title: values.title }),
        ...(values.description !== undefined && { description: values.description }),
        ...(values.location !== undefined && { location: values.location }),
        ...(values.start !== undefined && { startAt: new Date(values.start) }),
        ...(values.end !== undefined && { endAt: new Date(values.end) }),
        ...(values.allDay !== undefined && { allDay: values.allDay }),
        ...(values.color !== undefined && { color: values.color }),
        updatedAt: new Date(),
      })
      .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)))
      .returning()
      .then((rows) => rows[0] ?? null);
  },

  delete(id: string, userId: string) {
    return db
      .delete(calendarEvents)
      .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)))
      .returning()
      .then((rows) => rows[0] ?? null);
  },
};
