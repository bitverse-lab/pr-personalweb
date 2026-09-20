"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { taskService } from "@/server/services/task-service";
import {
  taskFiltersSchema,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  restoreTaskSchema,
  taskIdSchema,
  type TaskFilters,
} from "./schema";
import type { ActionResult } from "@/types/action-result";

function revalidateTasks() {
  revalidatePath("/me/tasks");
  revalidatePath("/me");
}

// --- Queries ---

export async function getTasks(filters: Partial<TaskFilters> = {}) {
  const userId = await requireUserId();
  const parsed = taskFiltersSchema.parse(filters);
  return taskService.getTasks(userId, parsed);
}

// --- Mutations ---

export async function createTask(input: unknown): Promise<ActionResult<unknown>> {
  const userId = await requireUserId();
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const task = await taskService.create(userId, parsed.data);
  revalidateTasks();
  return { ok: true, data: task };
}

export async function updateTask(input: unknown): Promise<ActionResult<unknown>> {
  const userId = await requireUserId();
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, ...rest } = parsed.data;
  const task = await taskService.update(userId, id, rest);
  if (!task) return { ok: false, error: "Task not found" };
  revalidateTasks();
  return { ok: true, data: task };
}

export async function completeTask(id: string): Promise<ActionResult<unknown>> {
  const userId = await requireUserId();
  const parsed = taskIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid task" };
  const task = await taskService.complete(userId, parsed.data.id);
  if (!task) return { ok: false, error: "Task not found" };
  revalidateTasks();
  return { ok: true, data: task };
}

export async function reopenTask(id: string): Promise<ActionResult<unknown>> {
  const userId = await requireUserId();
  const parsed = taskIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid task" };
  const task = await taskService.reopen(userId, parsed.data.id);
  if (!task) return { ok: false, error: "Task not found" };
  revalidateTasks();
  return { ok: true, data: task };
}

export async function updateTaskStatus(input: unknown): Promise<ActionResult<unknown>> {
  const userId = await requireUserId();
  const parsed = updateTaskStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid status" };
  const task = await taskService.updateStatus(userId, parsed.data.id, parsed.data.status);
  if (!task) return { ok: false, error: "Task not found" };
  revalidateTasks();
  return { ok: true, data: task };
}

export async function restoreTask(input: unknown): Promise<ActionResult<unknown>> {
  const userId = await requireUserId();
  const parsed = restoreTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Could not restore task" };
  const task = await taskService.restore(userId, parsed.data);
  revalidateTasks();
  return { ok: true, data: task };
}

export async function deleteTask(id: string): Promise<ActionResult<unknown>> {
  const userId = await requireUserId();
  const parsed = taskIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid task" };
  const task = await taskService.delete(userId, parsed.data.id);
  if (!task) return { ok: false, error: "Task not found" };
  revalidateTasks();
  return { ok: true, data: task };
}
