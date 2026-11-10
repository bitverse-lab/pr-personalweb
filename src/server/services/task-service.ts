import { taskRepository } from "@/server/repositories/task-repository";
import type { TaskStatus } from "@/db/schema/productivity";
import type { TaskFilters, CreateTaskInput, UpdateTaskInput, RestoreTaskInput } from "@/features/tasks/schema";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export const taskService = {
  getTasks(userId: string, filters: TaskFilters) {
    return taskRepository.findManyByUser(userId, filters);
  },

  getDueBetween(userId: string, from: string, to: string) {
    return taskRepository.findDueBetween(userId, from, to);
  },

  create(userId: string, input: CreateTaskInput) {
    return taskRepository.create(userId, input);
  },

  update(userId: string, id: string, input: Omit<UpdateTaskInput, "id">) {
    return taskRepository.update(id, userId, input);
  },

  complete(userId: string, id: string) {
    return taskRepository.setStatus(id, userId, "done", new Date());
  },

  reopen(userId: string, id: string) {
    return taskRepository.setStatus(id, userId, "todo", null);
  },

  updateStatus(userId: string, id: string, status: TaskStatus) {
    return taskRepository.setStatus(id, userId, status, status === "done" ? new Date() : null);
  },

  delete(userId: string, id: string) {
    return taskRepository.delete(id, userId);
  },

  restore(userId: string, input: RestoreTaskInput) {
    return taskRepository.restore(userId, {
      ...input,
      completedAt: input.completedAt ? new Date(input.completedAt) : null,
    });
  },

  /** `today` is the owner's calendar day, the same one the Tasks page groups by. */
  countOverdue(userId: string, today: string) {
    return taskRepository.countOverdue(userId, today);
  },

  getCompletionActivity(userId: string, tz: string) {
    const since = new Date(Date.now() - NINETY_DAYS_MS);
    return taskRepository.getCompletionActivity(userId, since, tz);
  },
};
