import { db } from "@/db";
import { taskRepository } from "@/server/repositories/task-repository";
import { nextOccurrence } from "@/features/tasks/dates";
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

  complete(userId: string, id: string, today: string) {
    return this.transition(userId, id, "done", today);
  },

  reopen(userId: string, id: string, today: string) {
    return this.transition(userId, id, "todo", today);
  },

  updateStatus(userId: string, id: string, status: TaskStatus, today: string) {
    return this.transition(userId, id, status, today);
  },

  /**
   * Status change, atomically with what a repeating task implies: ticking it off creates the next
   * occurrence (with its checklist reset); un-ticking takes that occurrence back. `today` is the
   * owner's calendar day.
   */
  transition(userId: string, id: string, status: TaskStatus, today: string) {
    return db.transaction(async (tx) => {
      const current = await taskRepository.findByIdForUser(id, userId, tx);
      if (!current) return null;
      const finishing = status === "done" && current.status !== "done";
      const completedAt = status !== "done" ? null : finishing ? new Date() : current.completedAt;
      const task = await taskRepository.setStatus(id, userId, status, completedAt, tx);
      if (!task) return null;

      let next: { id: string; dueDate: string | null } | null = null;
      if (finishing && current.recurrence && !(await taskRepository.findSpawned(userId, id, tx))) {
        const created = await taskRepository.create(
          userId,
          {
            title: current.title,
            description: current.description,
            dueDate: nextOccurrence(current.dueDate, current.recurrence, today),
            priority: current.priority,
            recurrence: current.recurrence,
            tags: current.tags,
            spawnedFromId: id,
          },
          tx
        );
        await taskRepository.copySubtasks(userId, id, created.id, tx);
        next = { id: created.id, dueDate: created.dueDate };
      } else if (status !== "done" && current.status === "done") {
        await taskRepository.deleteOpenSpawned(userId, id, tx);
      }
      return { ...task, next };
    });
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
