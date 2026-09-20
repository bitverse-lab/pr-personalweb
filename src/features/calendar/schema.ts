import { z } from "zod";

export const calendarRangeSchema = z.object({
  start: z.iso.datetime({ offset: true }),
  end: z.iso.datetime({ offset: true }),
  limit: z.number().int().positive().max(100).optional(),
});
export type CalendarRange = z.infer<typeof calendarRangeSchema>;

const baseEventFields = {
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(200).optional(),
  start: z.iso.datetime({ offset: true }),
  end: z.iso.datetime({ offset: true }).optional(),
  allDay: z.boolean().default(false),
  color: z.enum(["blue", "orange", "green", "pink", "violet", "red"]).nullable().optional(),
};

export const createEventSchema = z
  .object(baseEventFields)
  .refine((v) => !v.end || new Date(v.end) > new Date(v.start), {
    message: "End must be after start",
    path: ["end"],
  });
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z.object({
  id: z.string().uuid(),
  title: baseEventFields.title.optional(),
  description: baseEventFields.description,
  location: baseEventFields.location,
  start: baseEventFields.start.optional(),
  end: baseEventFields.end,
  allDay: z.boolean().optional(),
  color: baseEventFields.color,
});
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const moveEventSchema = z.object({
  id: z.string().uuid(),
  start: z.iso.datetime({ offset: true }),
  end: z.iso.datetime({ offset: true }).optional(),
  allDay: z.boolean().optional(),
});
export type MoveEventInput = z.infer<typeof moveEventSchema>;

export const eventIdSchema = z.object({ id: z.string().uuid() });
