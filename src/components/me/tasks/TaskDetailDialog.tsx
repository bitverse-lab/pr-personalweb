"use client";

import { useDialogA11y } from "@/hooks/useDialogA11y";
import SubtaskProgress from "./SubtaskProgress";
import SubtaskToggleList, { useSubtaskItems } from "./SubtaskToggleList";
import type { SubtaskDto } from "@/features/tasks/subtask-actions";
import type { TaskPriority } from "@/db/schema/productivity";

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  high: "badge bg-soft-danger text-danger",
  medium: "badge bg-soft-warning text-warning",
  low: "badge bg-soft-success text-success",
};

export interface TaskDetailValues {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority | null;
  tags: string[];
  subtasks: SubtaskDto[];
}

export default function TaskDetailDialog({
  task,
  onClose,
  onEdit,
}: {
  task: TaskDetailValues;
  onClose: () => void;
  onEdit: () => void;
}) {
  const panelRef = useDialogA11y<HTMLDivElement>(onClose);
  const { items, toggle } = useSubtaskItems(task.subtasks);

  return (
    <div role="presentation" className="me-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className="me-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h6 id="task-detail-title" className="mb-2">
          {task.title}
        </h6>
        <div className="d-flex flex-wrap gap-1 mb-3">
          {task.priority && <span className={PRIORITY_BADGE[task.priority]}>{task.priority}</span>}
          {task.tags.map((tag) => (
            <span key={tag} className="badge bg-light text-dark">
              {tag}
            </span>
          ))}
        </div>
        {task.dueDate && (
          <p className="small mb-2">
            <span className="text-muted">Due:</span> {task.dueDate}
          </p>
        )}
        {task.description ? (
          <p className="mb-3" style={{ whiteSpace: "pre-wrap" }}>
            {task.description}
          </p>
        ) : (
          <p className="text-muted small mb-3">No description.</p>
        )}

        {items.length > 0 && (
          <div className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="form-label mb-0">Checklist</span>
              <SubtaskProgress subtasks={items} />
            </div>
            <SubtaskToggleList items={items} onToggle={toggle} />
          </div>
        )}

        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onEdit}>
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
