import { and, asc, desc, eq, ilike, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { tasks, subtasks } from "@/db/schema";
import type { TaskStatus, TaskPriority } from "@/db/schema/productivity";
import type { TaskFilters } from "@/features/tasks/schema";

const doneLastOrder = sql`case when ${tasks.status} = 'done' then 1 else 0 end`;

export const taskRepository = {
  findManyByUser(userId: string, filters: TaskFilters) {
    const conditions = [eq(tasks.userId, userId)];
    if (filters.status === "open") conditions.push(ne(tasks.status, "done"));
    if (filters.status === "completed") conditions.push(eq(tasks.status, "done"));
    if (filters.q) {
      const escaped = filters.q.replace(/[\\%_]/g, (char) => `\\${char}`);
      conditions.push(or(ilike(tasks.title, `%${escaped}%`), sql`${filters.q} = any(${tasks.tags})`)!);
    }
    const orderCol = filters.orderBy === "dueDate" ? tasks.dueDate : tasks.createdAt;

    return db.query.tasks.findMany({
      where: and(...conditions),
      orderBy: [asc(doneLastOrder), asc(orderCol), desc(tasks.createdAt)],
      limit: filters.limit,
    });
  },

  findByIdForUser(id: string, userId: string) {
    return db.query.tasks.findFirst({ where: and(eq(tasks.id, id), eq(tasks.userId, userId)) });
  },

  create(
    userId: string,
    values: { title: string; description?: string; dueDate?: string; priority?: TaskPriority; tags?: string[] }
  ) {
    return db
      .insert(tasks)
      .values({ userId, ...values })
      .returning()
      .then((rows) => rows[0]);
  },

  update(
    id: string,
    userId: string,
    values: Partial<{
      title: string;
      description: string | null;
      dueDate: string | null;
      priority: TaskPriority | null;
      tags: string[];
    }>
  ) {
    return db
      .update(tasks)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning()
      .then((rows) => rows[0] ?? null);
  },

  setStatus(id: string, userId: string, status: TaskStatus, completedAt: Date | null) {
    return db
      .update(tasks)
      .set({ status, completedAt, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning()
      .then((rows) => rows[0] ?? null);
  },

  delete(id: string, userId: string) {
    return db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning()
      .then((rows) => rows[0] ?? null);
  },

  async restore(
    userId: string,
    values: {
      title: string;
      description?: string | null;
      dueDate?: string | null;
      priority?: TaskPriority | null;
      tags?: string[];
      status: TaskStatus;
      completedAt?: Date | null;
      subtasks?: { title: string; done: boolean }[];
    }
  ) {
    const { subtasks: subtaskValues, ...taskValues } = values;
    const [task] = await db
      .insert(tasks)
      .values({ userId, ...taskValues })
      .returning();
    if (subtaskValues && subtaskValues.length > 0) {
      await db.insert(subtasks).values(subtaskValues.map((s) => ({ userId, taskId: task.id, ...s })));
    }
    return task;
  },

  async countOverdue(userId: string, today: string) {
    const rows = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), ne(tasks.status, "done"), lt(tasks.dueDate, today)));
    return rows[0]?.n ?? 0;
  },

  // Daily count of tasks completed since `sinceDate`, for the productivity heatmap/trend chart.
  getCompletionActivity(userId: string, sinceDate: Date) {
    return db.execute<{ day: string; count: number }>(sql`
      select date(${tasks.completedAt}) as day, count(*)::int as count
      from ${tasks}
      where ${tasks.userId} = ${userId} and ${tasks.status} = 'done' and ${tasks.completedAt} >= ${sinceDate.toISOString()}
      group by date(${tasks.completedAt})
      order by day
    `);
  },
};
