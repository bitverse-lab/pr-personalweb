"use client";

import { useRef, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import TaskBoardColumn from "./TaskBoardColumn";
import { TaskBoardCardBody, type BoardTask } from "./TaskBoardCard";
import { updateTaskStatus } from "@/features/tasks/actions";
import { useToast } from "@/components/shared/ToastProvider";
import type { TaskStatus } from "@/db/schema/productivity";

const COLUMNS: { status: TaskStatus; title: string; hint: string }[] = [
  { status: "todo", title: "To do", hint: "Drop here to put it back in the queue" },
  { status: "in_progress", title: "In progress", hint: "Drag a task here when you start it" },
  { status: "done", title: "Done", hint: "Finished tasks land here" },
];
// The column under the pointer wins. Overlap-based detection picked the neighbouring column
// whenever a card was grabbed near one edge; keyboard drags (no pointer) fall back to overlap.
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};
const LABEL: Record<TaskStatus, string> = { todo: "To do", in_progress: "In progress", done: "Done" };

export interface BoardTaskWithStatus extends BoardTask {
  status: TaskStatus;
}

export default function TaskBoard({ tasks, today }: { tasks: BoardTaskWithStatus[]; today: string }) {
  const [grouped, setGrouped] = useState(() => groupByStatus(tasks));
  const [activeId, setActiveId] = useState<string | null>(null);
  // Undo runs from a toast created earlier; it must read the board as it is now, not as it was then.
  const groupedRef = useRef(grouped);
  groupedRef.current = grouped;
  const [, startTransition] = useTransition();
  const toast = useToast();
  // A few pixels of travel before a drag starts, so clicking a card's buttons never drags it.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  const findStatus = (taskId: string) =>
    (Object.keys(groupedRef.current) as TaskStatus[]).find((s) => groupedRef.current[s].some((t) => t.id === taskId)) ?? null;

  const move = (taskId: string, from: TaskStatus, to: TaskStatus, withUndo: boolean) => {
    const moved = groupedRef.current[from].find((task) => task.id === taskId);
    if (!moved) return;
    setGrouped((current) => ({
      ...current,
      [from]: current[from].filter((task) => task.id !== taskId),
      [to]: [{ ...moved, status: to }, ...current[to]],
    }));

    startTransition(async () => {
      const result = await updateTaskStatus({ id: taskId, status: to });
      if (!result.ok) {
        setGrouped((current) => ({
          ...current,
          [to]: current[to].filter((task) => task.id !== taskId),
          [from]: [moved, ...current[from]],
        }));
        toast.error(result.error);
        return;
      }
      if (withUndo) {
        toast.success(`Moved to ${LABEL[to]}`, { action: { label: "Undo", onClick: () => move(taskId, to, from, false) } });
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const taskId = String(event.active.id);
    const to = event.over?.id as TaskStatus | undefined;
    const from = findStatus(taskId);
    if (!to || !from || from === to) return;
    move(taskId, from, to, true);
  };

  const active = activeId ? Object.values(grouped).flat().find((t) => t.id === activeId) : undefined;

  return (
    <DndContext
      id="task-board-dnd"
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="task-board">
        {COLUMNS.map((column) => (
          <TaskBoardColumn key={column.status} status={column.status} title={column.title} hint={column.hint} tasks={grouped[column.status]} today={today} />
        ))}
      </div>
      {/* The card under the pointer is a lifted copy; the original stays as a placeholder in its column. */}
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" }}>
        {active ? (
          <div className="task-card is-lifted">
            <TaskBoardCardBody task={active} today={today} />
          </div>
        ) : null}
      </DragOverlay>
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
