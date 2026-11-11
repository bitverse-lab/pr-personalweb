import type { TaskPreview } from "@/components/me/overview/TasksSection";
import { dueInfo } from "./dates";

interface TaskRow {
  id: string;
  title: string;
  dueDate: string | null;
}

/** `today` is the owner's calendar day ("YYYY-MM-DD"), so labels flip at their midnight. */
export function toTaskPreview(task: TaskRow, today: string): TaskPreview {
  const info = task.dueDate ? dueInfo(task.dueDate, today) : null;
  return {
    id: task.id,
    title: task.title,
    dueLabel: info?.label,
    dueTone: info?.tone,
  };
}
