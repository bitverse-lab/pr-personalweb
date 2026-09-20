import type { TaskPreview } from "@/components/me/overview/TasksSection";

interface TaskRow {
  id: string;
  title: string;
  dueDate: string | null;
}

function formatDueLabel(dueDate: string | null): string | undefined {
  if (!dueDate) return undefined;
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (dueDate === today) return "Today";
  if (dueDate === tomorrow) return "Tomorrow";
  return dueDate;
}

export function toTaskPreview(task: TaskRow): TaskPreview {
  return {
    id: task.id,
    title: task.title,
    dueLabel: formatDueLabel(task.dueDate),
  };
}
