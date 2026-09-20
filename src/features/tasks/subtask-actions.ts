"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { subtaskRepository } from "@/server/repositories/subtask-repository";
import type { ActionResult } from "@/types/action-result";

const addSchema = z.object({ taskId: z.string().uuid(), title: z.string().trim().min(1, "Title is required").max(200) });
const toggleSchema = z.object({ id: z.string().uuid(), done: z.boolean() });
const idSchema = z.object({ id: z.string().uuid() });

export interface SubtaskDto {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
}

function revalidate() {
  revalidatePath("/me/tasks");
  revalidatePath("/me");
}

function toDto(row: { id: string; taskId: string; title: string; done: boolean }): SubtaskDto {
  return { id: row.id, taskId: row.taskId, title: row.title, done: row.done };
}

export async function getSubtasksForTasks(taskIds: string[]): Promise<SubtaskDto[]> {
  const userId = await requireUserId();
  const ids = z.array(z.string().uuid()).max(500).parse(taskIds);
  const rows = await subtaskRepository.findByTaskIds(userId, ids);
  return rows.map(toDto);
}

export async function addSubtask(input: unknown): Promise<ActionResult<SubtaskDto>> {
  const userId = await requireUserId();
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const row = await subtaskRepository.create(userId, parsed.data.taskId, parsed.data.title);
  if (!row) return { ok: false, error: "Task not found" };
  revalidate();
  return { ok: true, data: toDto(row) };
}

export async function toggleSubtask(input: unknown): Promise<ActionResult<SubtaskDto>> {
  const userId = await requireUserId();
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid subtask" };
  const row = await subtaskRepository.setDone(parsed.data.id, userId, parsed.data.done);
  if (!row) return { ok: false, error: "Subtask not found" };
  revalidate();
  return { ok: true, data: toDto(row) };
}

export async function deleteSubtask(id: string): Promise<ActionResult<SubtaskDto>> {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid subtask" };
  const row = await subtaskRepository.delete(parsed.data.id, userId);
  if (!row) return { ok: false, error: "Subtask not found" };
  revalidate();
  return { ok: true, data: toDto(row) };
}
