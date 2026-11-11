"use client";

import { useEffect, useState, useTransition } from "react";
import { completeTask, reopenTask } from "@/features/tasks/actions";
import { recurrenceNextLabel } from "@/features/tasks/dates";
import { useToast } from "@/components/shared/ToastProvider";
import type { TaskStatus } from "@/db/schema/productivity";

/**
 * A round check that ticks instantly (the server catches up), with Undo on the toast so a
 * mis-tap costs one click, not a hunt through the Done list.
 */
export default function TaskCheckbox({
  taskId,
  status,
  title,
  onChange,
}: {
  taskId: string;
  status: TaskStatus;
  title?: string;
  /** Lets the row reflect the new state (strike-through) before the list re-renders. */
  onChange?: (done: boolean) => void;
}) {
  const [checked, setChecked] = useState(status === "done");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  // The server render is the source of truth once it arrives.
  useEffect(() => setChecked(status === "done"), [status]);

  const apply = (next: boolean) => {
    setChecked(next);
    onChange?.(next);
    startTransition(async () => {
      const result = next ? await completeTask(taskId) : await reopenTask(taskId);
      if (!result.ok) {
        setChecked(!next);
        onChange?.(!next);
        toast.error(result.error);
        return;
      }
      // A repeating task says when it comes back; Undo also takes that next one away.
      const upcoming = (result.data as { next?: { dueDate: string | null } | null } | null)?.next;
      const message = next ? (upcoming?.dueDate ? `Done. Next one ${recurrenceNextLabel(upcoming.dueDate)}` : "Task done") : "Task reopened";
      toast.success(message, { action: { label: "Undo", onClick: () => apply(!next) } });
    });
  };

  return (
    <input
      type="checkbox"
      className="form-check-input task-check"
      checked={checked}
      onChange={() => apply(!checked)}
      disabled={isPending}
      aria-label={title ? `Mark "${title}" ${checked ? "not done" : "done"}` : "Toggle task completion"}
    />
  );
}
