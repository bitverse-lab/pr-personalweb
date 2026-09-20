"use client";

import { useState, useTransition } from "react";
import { completeTask, reopenTask } from "@/features/tasks/actions";
import { useToast } from "@/components/shared/ToastProvider";
import type { TaskStatus } from "@/db/schema/productivity";

export default function TaskCheckbox({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const [checked, setChecked] = useState(status === "done");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleChange = () => {
    const next = !checked;
    setChecked(next);
    startTransition(async () => {
      const result = next ? await completeTask(taskId) : await reopenTask(taskId);
      if (!result.ok) {
        setChecked(!next);
        toast.error(result.error);
        return;
      }
      toast.success(next ? "Task marked complete" : "Task reopened");
    });
  };

  return (
    <input
      type="checkbox"
      className="form-check-input"
      checked={checked}
      onChange={handleChange}
      disabled={isPending}
      aria-label="Toggle task completion"
    />
  );
}
