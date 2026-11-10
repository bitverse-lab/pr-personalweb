"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiAlignLeft, FiChevronDown, FiChevronRight } from "react-icons/fi";
import TaskCheckbox from "./TaskCheckbox";
import TaskActions, { type TaskActionsTask } from "./TaskActions";
import SubtaskProgress from "./SubtaskProgress";
import SubtaskToggleList, { useSubtaskItems } from "./SubtaskToggleList";
import DueMenu from "./DueMenu";
import { PriorityFlag } from "./TaskMeta";
import type { TaskStatus } from "@/db/schema/productivity";

/**
 * One task: check, title, and a quiet meta line (due, priority, tags, checklist). Actions stay out
 * of sight until the row is hovered or focused, so a long list reads as a list, not a toolbar.
 */
export default function TaskListItem({ task, today }: { task: TaskActionsTask & { status: TaskStatus }; today: string }) {
  const [expanded, setExpanded] = useState(false);
  const [done, setDone] = useState(task.status === "done");
  const { items, toggle } = useSubtaskItems(task.subtasks);
  useEffect(() => setDone(task.status === "done"), [task.status]);

  return (
    <li className={`task-row${done ? " is-done" : ""}`}>
      <div className="task-row-main">
        <TaskCheckbox taskId={task.id} status={task.status} title={task.title} onChange={setDone} />
        <div className="task-row-body">
          <span className="task-title">{task.title}</span>
          <div className="task-meta">
            <DueMenu taskId={task.id} due={task.dueDate} today={today} done={done} />
            {task.priority && <PriorityFlag priority={task.priority} />}
            {task.tags.map((tag) => (
              <Link key={tag} href={`/me/tasks?q=${encodeURIComponent(tag)}`} className="task-tag" title={`Show tasks tagged ${tag}`}>
                #{tag}
              </Link>
            ))}
            {items.length > 0 && (
              <button
                type="button"
                className="task-sub-toggle"
                onClick={() => setExpanded((open) => !open)}
                aria-expanded={expanded}
                aria-label={expanded ? "Hide checklist" : "Show checklist"}
              >
                {expanded ? <FiChevronDown aria-hidden /> : <FiChevronRight aria-hidden />}
                <SubtaskProgress subtasks={items} />
              </button>
            )}
            {task.description && (
              <span className="task-has-notes" title="Has notes">
                <FiAlignLeft aria-hidden />
                <span className="visually-hidden">Has notes</span>
              </span>
            )}
          </div>
        </div>
        <div className="task-row-actions">
          <TaskActions task={task} />
        </div>
      </div>
      {expanded && items.length > 0 && (
        <div className="task-row-subs">
          <SubtaskToggleList items={items} onToggle={toggle} />
        </div>
      )}
    </li>
  );
}
