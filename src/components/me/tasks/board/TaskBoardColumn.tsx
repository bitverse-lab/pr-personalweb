"use client";

import { useDroppable } from "@dnd-kit/core";
import { FiInbox } from "react-icons/fi";
import EmptyState from "@/components/shared/EmptyState";
import TaskBoardCard, { type BoardTask } from "./TaskBoardCard";
import type { TaskStatus } from "@/db/schema/productivity";

export default function TaskBoardColumn({
  status,
  title,
  tasks,
}: {
  status: TaskStatus;
  title: string;
  tasks: BoardTask[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className="rounded p-2"
      style={{ background: isOver ? "var(--app-primary-soft)" : "var(--app-surface)", minHeight: 200 }}
    >
      <div className="d-flex align-items-center justify-content-between mb-2 px-1">
        <h6 className="mb-0">{title}</h6>
        <span className="badge bg-light text-dark">{tasks.length}</span>
      </div>
      {tasks.length === 0 ? (
        <EmptyState icon={FiInbox} title="Nothing here" className="py-3" />
      ) : (
        tasks.map((task) => <TaskBoardCard key={task.id} task={task} />)
      )}
    </div>
  );
}
