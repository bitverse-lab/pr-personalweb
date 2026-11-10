"use client";

import { useDraggable } from "@dnd-kit/core";
import TaskActions from "@/components/me/tasks/TaskActions";
import SubtaskProgress from "@/components/me/tasks/SubtaskProgress";
import { DueText, PriorityFlag } from "@/components/me/tasks/TaskMeta";
import type { SubtaskDto } from "@/features/tasks/subtask-actions";
import type { TaskPriority, TaskStatus } from "@/db/schema/productivity";

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

/** The card face, shared by the card in its column and the lifted copy that follows the pointer. */
export function TaskBoardCardBody({ task, today }: { task: BoardTask; today: string }) {
  return (
    <>
      <p className="task-card-title">{task.title}</p>
      {(task.dueDate || task.priority || task.tags.length > 0) && (
        <div className="task-meta">
          {task.dueDate && <DueText due={task.dueDate} today={today} done={task.status === "done"} />}
          {task.priority && <PriorityFlag priority={task.priority} />}
          {task.tags.map((tag) => (
            <span key={tag} className="task-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
      {task.subtasks.length > 0 && (
        <div className="mt-2">
          <SubtaskProgress subtasks={task.subtasks} />
        </div>
      )}
    </>
  );
}

export default function TaskBoardCard({ task, today }: { task: BoardTask; today: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <div ref={setNodeRef} className={`task-card${isDragging ? " is-placeholder" : ""}${task.status === "done" ? " is-done" : ""}`}>
      <div className="task-card-grip" {...listeners} {...attributes} aria-label={`Move "${task.title}"`} aria-roledescription="draggable task">
        <TaskBoardCardBody task={task} today={today} />
      </div>
      <div className="task-card-actions">
        <TaskActions task={task} />
      </div>
    </div>
  );
}
