"use client";

import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import TaskListItem from "./TaskListItem";
import type { TaskActionsTask } from "./TaskActions";
import type { TaskGroupKey } from "@/features/tasks/dates";
import type { TaskStatus } from "@/db/schema/productivity";
import AnimatedList from "@/components/shared/AnimatedList";

type Row = TaskActionsTask & { status: TaskStatus };

/** Tasks in planning order, each group with a count. Done folds away unless it is all you asked for. */
export default function TaskGroups({
  groups,
  today,
  doneOpen,
}: {
  groups: { key: TaskGroupKey; label: string; tasks: Row[] }[];
  today: string;
  doneOpen: boolean;
}) {
  const [showDone, setShowDone] = useState(doneOpen);

  return (
    <div className="task-groups">
      {groups.map((group) => {
        const foldable = group.key === "done" && !doneOpen;
        const open = !foldable || showDone;
        return (
          <section key={group.key} id={`group-${group.key}`} className={`task-group task-group--${group.key}`} aria-labelledby={`group-${group.key}-h`}>
            <h2 id={`group-${group.key}-h`} className="task-group-h">
              {foldable ? (
                <button type="button" className="task-group-fold" aria-expanded={open} onClick={() => setShowDone((v) => !v)}>
                  {open ? <FiChevronDown aria-hidden /> : <FiChevronRight aria-hidden />}
                  {group.label}
                  <span className="task-group-count">{group.tasks.length}</span>
                </button>
              ) : (
                <>
                  {group.label}
                  <span className="task-group-count">{group.tasks.length}</span>
                </>
              )}
            </h2>
            {open && (
              <AnimatedList as="ul" className="list-unstyled mb-0">
                {group.tasks.map((task) => (
                  <TaskListItem key={task.id} task={task} today={today} />
                ))}
              </AnimatedList>
            )}
          </section>
        );
      })}
    </div>
  );
}
