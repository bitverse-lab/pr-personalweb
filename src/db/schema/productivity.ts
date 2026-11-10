import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, boolean, date } from "drizzle-orm/pg-core";
import { users } from "./auth";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type TaskRecurrence = "daily" | "weekdays" | "weekly" | "monthly";

export const tasks = pgTable("task", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  // Date-only, per the spec's "date-only concepts use DATE" rule. Stored/read as a plain
  // "YYYY-MM-DD" string (not a JS Date) to avoid UTC-midnight timezone-shift display bugs.
  dueDate: date("due_date", { mode: "string" }),
  status: text("status").$type<TaskStatus>().notNull().default("todo"),
  priority: text("priority").$type<TaskPriority | null>(),
  tags: text("tags")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  // Repeating tasks: ticking one off creates the next occurrence, which points back here so
  // un-ticking can take it away again. No FK: the chain is a convenience, not an invariant.
  recurrence: text("recurrence").$type<TaskRecurrence | null>(),
  spawnedFromId: uuid("spawned_from_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subtasks = pgTable("subtask", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type EventColor = "blue" | "orange" | "green" | "pink" | "violet" | "red";

export const calendarEvents = pgTable("calendar_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  allDay: boolean("all_day").notNull().default(false),
  color: text("color").$type<EventColor | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
