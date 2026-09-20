import { z } from "zod";

export const taskFiltersSchema = z.object({
  status: z.enum(["all", "open", "completed"]).default("all"),
  limit: z.number().int().positive().max(100).optional(),
  orderBy: z.enum(["dueDate", "createdAt"]).default("createdAt"),
  q: z.string().trim().max(100).optional(),
});
export type TaskFilters = z.infer<typeof taskFiltersSchema>;

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);
export const taskPrioritySchema = z.enum(["low", "medium", "high"]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional(),
  dueDate: z.iso.date().optional(),
  priority: taskPrioritySchema.optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial().extend({ id: z.string().uuid() });
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const taskIdSchema = z.object({ id: z.string().uuid() });

export const updateTaskStatusSchema = z.object({
  id: z.string().uuid(),
  status: taskStatusSchema,
});
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

export const restoreTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z.iso.date().nullable().optional(),
  priority: taskPrioritySchema.nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  status: taskStatusSchema,
  completedAt: z.iso.datetime({ offset: true }).nullable().optional(),
  subtasks: z
    .array(z.object({ title: z.string().trim().min(1).max(200), done: z.boolean() }))
    .max(100)
    .optional(),
});
export type RestoreTaskInput = z.infer<typeof restoreTaskSchema>;
