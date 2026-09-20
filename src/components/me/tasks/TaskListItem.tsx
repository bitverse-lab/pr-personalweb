"use client";

import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import TaskCheckbox from "./TaskCheckbox";
import TaskActions, { type TaskActionsTask } from "./TaskActions";
import SubtaskProgress from "./SubtaskProgress";
import SubtaskToggleList, { useSubtaskItems } from "./SubtaskToggleList";
import type { TaskPriority, TaskStatus } from "@/db/schema/productivity";

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  high: "badge bg-soft-danger text-danger",
  medium: "badge bg-soft-warning text-warning",
  low: "badge bg-soft-success text-success",
};

export default function TaskListItem({ task }: { task: TaskActionsTask & { status: TaskStatus } }) {
  const [expanded, setExpanded] = useState(false);
  const { items, toggle } = useSubtaskItems(task.subtasks);

  return (
    <li className="border-bottom py-2">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <TaskCheckbox taskId={task.id} status={task.status} />
          <span className={task.status === "done" ? "text-muted text-decoration-line-through" : ""}>
            {task.title}
          </span>
          {task.priority && <span className={PRIORITY_BADGE[task.priority]}>{task.priority}</span>}
          {task.tags.map((tag) => (
            <span key={tag} className="badge bg-light text-dark">
              {tag}
            </span>
          ))}
          {items.length > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-link p-0 d-inline-flex align-items-center gap-1 text-decoration-none"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              aria-label={expanded ? "Hide checklist" : "Show checklist"}
            >
              {expanded ? <FiChevronDown /> : <FiChevronRight />}
              <SubtaskProgress subtasks={items} />
            </button>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          {task.dueDate && <span className="text-muted small">{task.dueDate}</span>}
          <TaskActions task={task} />
        </div>
      </div>
      {expanded && items.length > 0 && (
        <div className="ps-4 pt-2">
          <SubtaskToggleList items={items} onToggle={toggle} />
        </div>
      )}
    </li>
  );
}
