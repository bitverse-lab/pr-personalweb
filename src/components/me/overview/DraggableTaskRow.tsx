"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { TaskPreview } from "./TasksSection";

export default function DraggableTaskRow({ task }: { task: TaskPreview }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `overview-task-${task.id}`,
    data: { taskId: task.id, title: task.title },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1, cursor: "grab" }
    : { cursor: "grab" };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="d-flex justify-content-between border-bottom py-2"
    >
      <span>{task.title}</span>
      {task.dueLabel && <span className={`small task-due task-due--${task.dueTone ?? "later"}`}>{task.dueLabel}</span>}
    </li>
  );
}
