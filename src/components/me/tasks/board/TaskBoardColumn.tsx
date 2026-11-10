"use client";

import { useDroppable } from "@dnd-kit/core";
import TaskBoardCard, { type BoardTask } from "./TaskBoardCard";
import type { TaskStatus } from "@/db/schema/productivity";

export default function TaskBoardColumn({
  status,
  title,
  hint,
  tasks,
  today,
}: {
  status: TaskStatus;
  title: string;
  hint: string;
  tasks: BoardTask[];
  today: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section ref={setNodeRef} className={`task-col task-col--${status}${isOver ? " is-over" : ""}`} aria-label={`${title}, ${tasks.length}`}>
      <header className="task-col-head">
        <span className="task-col-dot" aria-hidden />
        <h2 className="task-col-title">{title}</h2>
        <span className="task-col-count">{tasks.length}</span>
      </header>
      {tasks.length === 0 ? <p className="task-col-empty">{hint}</p> : tasks.map((task) => <TaskBoardCard key={task.id} task={task} today={today} />)}
    </section>
  );
}
