"use client";

import { useState, useTransition } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import TaskBoardColumn from "./TaskBoardColumn";
import type { BoardTask } from "./TaskBoardCard";
import { updateTaskStatus } from "@/features/tasks/actions";
import { useToast } from "@/components/shared/ToastProvider";
import type { TaskStatus } from "@/db/schema/productivity";

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "To Do" },
  { status: "in_progress", title: "In Progress" },
  { status: "done", title: "Done" },
];

export interface BoardTaskWithStatus extends BoardTask {
  status: TaskStatus;
}

export default function TaskBoard({ tasks }: { tasks: BoardTaskWithStatus[] }) {
  const [grouped, setGrouped] = useState(() => groupByStatus(tasks));
  const [, startTransition] = useTransition();
  const toast = useToast();

  const handleDragEnd = (event: DragEndEvent) => {
    const taskId = String(event.active.id);
    const overStatus = event.over?.id as TaskStatus | undefined;
    if (!overStatus) return;

    let previousStatus: TaskStatus | null = null;
    for (const status of Object.keys(grouped) as TaskStatus[]) {
      if (grouped[status].some((task) => task.id === taskId)) {
        previousStatus = status;
        break;
      }
    }
    if (!previousStatus || previousStatus === overStatus) return;

    const movedTask = grouped[previousStatus].find((task) => task.id === taskId)!;
    const fromStatus = previousStatus;

    setGrouped((current) => ({
      ...current,
      [fromStatus]: current[fromStatus].filter((task) => task.id !== taskId),
      [overStatus]: [...current[overStatus], { ...movedTask, status: overStatus }],
    }));

    startTransition(async () => {
      const result = await updateTaskStatus({ id: taskId, status: overStatus });
      if (!result.ok) {
        setGrouped((current) => ({
          ...current,
          [overStatus]: current[overStatus].filter((task) => task.id !== taskId),
          [fromStatus]: [...current[fromStatus], movedTask],
        }));
        toast.error(result.error);
        return;
      }
      toast.success(`Moved to ${overStatus.replace("_", " ")}`);
    });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="row row-cols-1 row-cols-md-3 g-3">
        {COLUMNS.map((column) => (
          <div className="col" key={column.status}>
            <TaskBoardColumn status={column.status} title={column.title} tasks={grouped[column.status]} />
          </div>
        ))}
      </div>
    </DndContext>
  );
}

function groupByStatus(tasks: BoardTaskWithStatus[]): Record<TaskStatus, BoardTaskWithStatus[]> {
  return {
    todo: tasks.filter((task) => task.status === "todo"),
    in_progress: tasks.filter((task) => task.status === "in_progress"),
    done: tasks.filter((task) => task.status === "done"),
  };
}
