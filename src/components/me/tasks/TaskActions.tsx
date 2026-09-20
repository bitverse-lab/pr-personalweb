"use client";

import { useState } from "react";
import { FiEdit2, FiEye } from "react-icons/fi";
import TaskDetailDialog from "./TaskDetailDialog";
import TaskEditDialog from "./TaskEditDialog";
import DeleteTaskButton, { type DeletableTask } from "./DeleteTaskButton";
import type { SubtaskDto } from "@/features/tasks/subtask-actions";

export type TaskActionsTask = Omit<DeletableTask, "subtasks"> & { subtasks: SubtaskDto[] };

export default function TaskActions({ task }: { task: TaskActionsTask }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary border-0"
        onClick={() => setDetailOpen(true)}
        aria-label="View task details"
      >
        <FiEye />
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary border-0"
        onClick={() => setEditOpen(true)}
        aria-label="Edit task"
      >
        <FiEdit2 />
      </button>
      <DeleteTaskButton task={task} />

      {detailOpen && (
        <TaskDetailDialog
          task={task}
          onClose={() => setDetailOpen(false)}
          onEdit={() => {
            setDetailOpen(false);
            setEditOpen(true);
          }}
        />
      )}
      {editOpen && (
        <TaskEditDialog
          initialValues={{
            id: task.id,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority,
            tags: task.tags,
            subtasks: task.subtasks,
          }}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
