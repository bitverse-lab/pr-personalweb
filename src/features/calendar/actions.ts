"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { calendarService } from "@/server/services/calendar-service";
import { taskService } from "@/server/services/task-service";
import {
  calendarRangeSchema,
  createEventSchema,
  updateEventSchema,
  moveEventSchema,
  eventIdSchema,
  conflictCheckSchema,
  type CalendarRange,
} from "./schema";
import type { ActionResult } from "@/types/action-result";
import type { CalendarTask } from "./format";

function revalidateCalendar() {
  revalidatePath("/me/calendar");
  revalidatePath("/me");
}

// --- Queries ---

export async function getCalendarEvents(range: CalendarRange) {
  const userId = await requireUserId();
  const parsed = calendarRangeSchema.parse(range);
  return calendarService.getEvents(userId, parsed);
}

// Tasks with a due date inside the visible range. The range arrives as local ISO strings
// ("2026-11-01T00:00:00+07:00"), so the first ten characters are already the local date.
export async function getCalendarTasks(range: CalendarRange): Promise<CalendarTask[]> {
  const userId = await requireUserId();
  const parsed = calendarRangeSchema.parse(range);
  const rows = await taskService.getDueBetween(userId, parsed.start.slice(0, 10), parsed.end.slice(0, 10));
  return rows.map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate!, done: t.status === "done" }));
}

// Events and dated tasks in one call: Server Actions from the client run one after another, so two
// separate calls cost two full round trips.
export async function getCalendarRange(range: CalendarRange) {
  const [events, tasks] = await Promise.all([getCalendarEvents(range), getCalendarTasks(range)]);
  return { events, tasks };
}

export async function checkEventConflicts(
  input: unknown
): Promise<ActionResult<{ id: string; title: string; start: string; end: string }[]>> {
  const userId = await requireUserId();
  const parsed = conflictCheckSchema.safeParse(input);
  if (!parsed.success) return { ok: true, data: [] };
  const rows = await calendarService.conflicts(userId, parsed.data.start, parsed.data.end, parsed.data.excludeId);
  return { ok: true, data: rows.map((e) => ({ id: e.id, title: e.title, start: e.startAt.toISOString(), end: e.endAt.toISOString() })) };
}

// --- Mutations ---

export async function createEvent(input: unknown): Promise<ActionResult<unknown>> {
  const userId = await requireUserId();
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const event = await calendarService.create(userId, parsed.data);
  revalidateCalendar();
  return { ok: true, data: event };
}

export async function updateEvent(input: unknown): Promise<ActionResult<unknown>> {
  const userId = await requireUserId();
  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, ...rest } = parsed.data;
  const event = await calendarService.update(userId, id, rest);
  if (!event) return { ok: false, error: "Event not found" };
  revalidateCalendar();
  return { ok: true, data: event };
}

export async function moveEvent(input: unknown): Promise<ActionResult<unknown>> {
  const userId = await requireUserId();
  const parsed = moveEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, ...rest } = parsed.data;
  const event = await calendarService.move(userId, id, rest);
  if (!event) return { ok: false, error: "Event not found" };
  revalidateCalendar();
  return { ok: true, data: event };
}

export async function deleteEvent(id: string): Promise<ActionResult<unknown>> {
  const userId = await requireUserId();
  const parsed = eventIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid event" };
  const event = await calendarService.delete(userId, parsed.data.id);
  if (!event) return { ok: false, error: "Event not found" };
  revalidateCalendar();
  return { ok: true, data: event };
}
