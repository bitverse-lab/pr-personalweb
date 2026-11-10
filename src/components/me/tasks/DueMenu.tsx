"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { FiCalendar } from "react-icons/fi";
import { updateTask } from "@/features/tasks/actions";
import { addDaysTo, dueInfo, nextWeekday } from "@/features/tasks/dates";
import { useToast } from "@/components/shared/ToastProvider";
import { dueLabel } from "./TaskMeta";

/**
 * The due date doubles as a reschedule button: Today, Tomorrow, Next Monday, a picked date, or
 * none. Rescheduling is the most common edit a task gets, so it should not need the edit dialog.
 */
export default function DueMenu({ taskId, due, today, done }: { taskId: string; due: string | null; today: string; done: boolean }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        wrapRef.current?.querySelector<HTMLButtonElement>(".task-due-btn")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    wrapRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const set = (next: string | null) => {
    setOpen(false);
    if (next === due) return;
    startTransition(async () => {
      const result = await updateTask({ id: taskId, dueDate: next });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(next ? `Due ${dueInfo(next, today).label.toLowerCase()}` : "Due date removed", {
        action: {
          label: "Undo",
          onClick: () =>
            startTransition(async () => {
              const back = await updateTask({ id: taskId, dueDate: due });
              if (!back.ok) toast.error(back.error);
            }),
        },
      });
    });
  };

  const info = due ? dueInfo(due, today) : null;
  const options: { label: string; value: string | null }[] = [
    { label: "Today", value: today },
    { label: "Tomorrow", value: addDaysTo(today, 1) },
    { label: "Next Monday", value: nextWeekday(today, 1) },
  ];

  return (
    <div className="task-due-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`task-due-btn task-due--${done ? "done" : info ? info.tone : "none"}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={due ? `Due ${dueLabel(due, today, done)}. Change due date` : "Set a due date"}
        title={due ?? "Set a due date"}
        disabled={isPending}
        onClick={() => setOpen((v) => !v)}
      >
        <FiCalendar aria-hidden />
        {due ? dueLabel(due, today, done) : <span className="task-due-add">Add date</span>}
      </button>
      {open && (
        <div className="task-due-menu" role="menu" id={menuId} aria-label="Due date">
          {options.map((o) => (
            <button key={o.label} type="button" role="menuitem" onClick={() => set(o.value)}>
              <span>{o.label}</span>
              <span className="task-due-menu-hint">{dueInfo(o.value!, today).days === 0 ? "" : new Date(`${o.value}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</span>
            </button>
          ))}
          <label className="task-due-pick">
            <span>Pick a date</span>
            <input type="date" defaultValue={due ?? ""} onChange={(e) => e.target.value && set(e.target.value)} />
          </label>
          {due && (
            <button type="button" role="menuitem" className="task-due-clear" onClick={() => set(null)}>
              No date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
