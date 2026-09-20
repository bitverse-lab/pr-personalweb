"use client";

import { useTransition } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { createEvent } from "@/features/calendar/actions";
import { useToast } from "@/components/shared/ToastProvider";

export default function OverviewDndProvider({ children }: { children: React.ReactNode }) {
  const [, startTransition] = useTransition();
  const toast = useToast();

  const handleDragEnd = (event: DragEndEvent) => {
    const dropData = event.over?.data.current as { date: string } | undefined;
    const dragData = event.active.data.current as { taskId: string; title: string } | undefined;
    if (!dropData?.date || !dragData?.title) return;

    const start = new Date(`${dropData.date}T09:00:00`);

    startTransition(async () => {
      const result = await createEvent({
        title: dragData.title,
        start: start.toISOString(),
        allDay: false,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Scheduled "${dragData.title}"`);
    });
  };

  return <DndContext onDragEnd={handleDragEnd}>{children}</DndContext>;
}
