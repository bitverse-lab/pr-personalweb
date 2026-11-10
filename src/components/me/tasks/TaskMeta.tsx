"use client";

import { FiFlag, FiRepeat } from "react-icons/fi";
import { dueInfo, recurrenceLabel } from "@/features/tasks/dates";
import type { TaskPriority, TaskRecurrence } from "@/db/schema/productivity";

const PRIORITY_LABEL: Record<TaskPriority, string> = { high: "High", medium: "Medium", low: "Low" };

/** Priority as a flag plus a word, never colour alone. */
export function PriorityFlag({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`task-flag task-flag--${priority}`}>
      <FiFlag aria-hidden /> {PRIORITY_LABEL[priority]}
    </span>
  );
}

/** "Every Mon", "Every weekday": the task comes back after it is ticked off. */
export function RepeatBadge({ rule, due }: { rule: TaskRecurrence; due: string | null }) {
  return (
    <span className="task-repeat" title="Repeats: ticking it off schedules the next one">
      <FiRepeat aria-hidden /> {recurrenceLabel(rule, due)}
    </span>
  );
}

/** "3d overdue", "Today", "Tomorrow", "Fri", "Nov 20", tinted by urgency. */
export function DueText({ due, today, done }: { due: string; today: string; done?: boolean }) {
  return (
    <span className={`task-due task-due--${done ? "done" : dueInfo(due, today).tone}`} title={due}>
      {dueLabel(due, today, done)}
    </span>
  );
}

/** A finished task is no longer "overdue"; it just had a date. */
export function dueLabel(due: string, today: string, done?: boolean) {
  if (!done) return dueInfo(due, today).label;
  return new Date(`${due}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
