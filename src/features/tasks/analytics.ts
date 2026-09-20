"use server";

import { requireUserId } from "@/server/auth";
import { taskService } from "@/server/services/task-service";

export interface CompletionActivityPoint {
  day: string;
  count: number;
}

function toDateKey(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export async function getOverdueTaskCount(): Promise<number> {
  const userId = await requireUserId();
  return taskService.countOverdue(userId);
}

export async function getTaskCompletionActivity(): Promise<CompletionActivityPoint[]> {
  const userId = await requireUserId();
  const rows = await taskService.getCompletionActivity(userId);
  return rows.map((row) => ({ day: toDateKey(row.day), count: Number(row.count) }));
}
