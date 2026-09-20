"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { calendarService } from "@/server/services/calendar-service";
import {
  calendarRangeSchema,
  createEventSchema,
  updateEventSchema,
  moveEventSchema,
  eventIdSchema,
  type CalendarRange,
} from "./schema";
import type { ActionResult } from "@/types/action-result";

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
