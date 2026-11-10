import { calendarEventRepository } from "@/server/repositories/calendar-event-repository";
import type { CalendarRange, CreateEventInput, UpdateEventInput, MoveEventInput } from "@/features/calendar/schema";

const DEFAULT_DURATION_MS = 60 * 60 * 1000;

export const calendarService = {
  getEvents(userId: string, range: CalendarRange) {
    return calendarEventRepository.findManyByUserInRange(userId, range.start, range.end, range.limit);
  },

  create(userId: string, input: CreateEventInput) {
    return calendarEventRepository.create(userId, {
      ...input,
      end: input.end ?? new Date(new Date(input.start).getTime() + DEFAULT_DURATION_MS).toISOString(),
    });
  },

  update(userId: string, id: string, input: Omit<UpdateEventInput, "id">) {
    return calendarEventRepository.update(id, userId, input);
  },

  move(userId: string, id: string, input: Omit<MoveEventInput, "id">) {
    return calendarEventRepository.update(id, userId, input);
  },

  conflicts(userId: string, start: string, end: string, excludeId?: string) {
    return calendarEventRepository.findOverlapping(userId, start, end, excludeId);
  },

  delete(userId: string, id: string) {
    return calendarEventRepository.delete(id, userId);
  },
};
