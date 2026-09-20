"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import TaskActions from "@/components/me/tasks/TaskActions";
import SubtaskProgress from "@/components/me/tasks/SubtaskProgress";
import type { SubtaskDto } from "@/features/tasks/subtask-actions";
import type { TaskPriority, TaskStatus } from "@/db/schema/productivity";

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  high: "badge bg-soft-danger text-danger",
  medium: "badge bg-soft-warning text-warning",
  low: "badge bg-soft-success text-success",
};

export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority | null;
  tags: string[];
  status: TaskStatus;
  completedAt: Date | null;
  subtasks: SubtaskDto[];
}

export default function TaskBoardCard({ task }: { task: BoardTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className="card rounded shadow-sm mb-2 me-board-card">
      <div className="card-body p-3" {...listeners} {...attributes}>
        <p className="mb-2" style={{ cursor: "grab" }}>
          {task.title}
        </p>
        <div className="d-flex flex-wrap gap-1 mb-2">
          {task.priority && <span className={PRIORITY_BADGE[task.priority]}>{task.priority}</span>}
          {task.tags.map((tag) => (
            <span key={tag} className="badge bg-light text-dark">
              {tag}
            </span>
          ))}
        </div>
        {task.dueDate && <div className="text-muted small mb-2">{task.dueDate}</div>}
        <SubtaskProgress subtasks={task.subtasks} />
      </div>
      <div className="card-footer bg-white border-top-0 d-flex justify-content-end gap-1 py-1">
        <TaskActions task={task} />
      </div>
    </div>
  );
}
