import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { subtasks, tasks } from "@/db/schema";

export const subtaskRepository = {
  findByTaskIds(userId: string, taskIds: string[]) {
    if (taskIds.length === 0) return Promise.resolve([]);
    return db.query.subtasks.findMany({
      where: and(eq(subtasks.userId, userId), inArray(subtasks.taskId, taskIds)),
      orderBy: [asc(subtasks.createdAt)],
    });
  },

  // Verifies the parent task belongs to the user before inserting, so a foreign task id can't be attached to.
  async create(userId: string, taskId: string, title: string) {
    const parent = await db.query.tasks.findFirst({ where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)) });
    if (!parent) return null;
    const rows = await db.insert(subtasks).values({ userId, taskId, title }).returning();
    return rows[0];
  },

  setDone(id: string, userId: string, done: boolean) {
    return db
      .update(subtasks)
      .set({ done })
      .where(and(eq(subtasks.id, id), eq(subtasks.userId, userId)))
      .returning()
      .then((rows) => rows[0] ?? null);
  },

  delete(id: string, userId: string) {
    return db
      .delete(subtasks)
      .where(and(eq(subtasks.id, id), eq(subtasks.userId, userId)))
      .returning()
      .then((rows) => rows[0] ?? null);
  },
};
