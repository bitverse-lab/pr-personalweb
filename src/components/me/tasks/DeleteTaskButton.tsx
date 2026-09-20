"use client";

import { useState, useTransition } from "react";
import { FiTrash2 } from "react-icons/fi";
import { deleteTask, restoreTask } from "@/features/tasks/actions";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/shared/ToastProvider";
import type { TaskPriority, TaskStatus } from "@/db/schema/productivity";

export interface DeletableTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority | null;
  tags: string[];
  status: TaskStatus;
  completedAt: Date | null;
  subtasks: { title: string; done: boolean }[];
}

export default function DeleteTaskButton({ task }: { task: DeletableTask }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleUndo = () => {
    startTransition(async () => {
      const result = await restoreTask({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        tags: task.tags,
        status: task.status,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        subtasks: task.subtasks,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Task restored");
    });
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteTask(task.id);
      setConfirming(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Task deleted", { action: { label: "Undo", onClick: handleUndo } });
    });
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-sm btn-outline-danger border-0"
        onClick={() => setConfirming(true)}
        aria-label="Delete task"
      >
        <FiTrash2 />
      </button>
      {confirming && (
        <ConfirmDialog
          title="Delete task?"
          message={`"${task.title}" will be deleted. You can undo right after.`}
          isPending={isPending}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
