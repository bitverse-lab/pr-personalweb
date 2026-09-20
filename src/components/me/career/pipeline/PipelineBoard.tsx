"use client";

import { useState, useTransition } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import PipelineColumn from "./PipelineColumn";
import { changeApplicationStatus } from "@/features/career/actions";
import { ALL_STATUSES, STATUS_META } from "@/features/career/status";
import { useToast } from "@/components/shared/ToastProvider";
import type { ApplicationStatus } from "@/db/schema/career";
import type { ApplicationDto } from "@/features/career/types";

function group(applications: ApplicationDto[]): Record<ApplicationStatus, ApplicationDto[]> {
  const result = Object.fromEntries(ALL_STATUSES.map((status) => [status, [] as ApplicationDto[]])) as Record<
    ApplicationStatus,
    ApplicationDto[]
  >;
  for (const application of applications) result[application.status].push(application);
  return result;
}

export default function PipelineBoard({
  applications,
  nextInterviews,
}: {
  applications: ApplicationDto[];
  nextInterviews: Record<string, string>;
}) {
  const [grouped, setGrouped] = useState(() => group(applications));
  const [, startTransition] = useTransition();
  const toast = useToast();
  // A small drag distance lets a plain click on the role link navigate instead of starting a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const id = String(event.active.id);
    const to = event.over?.id as ApplicationStatus | undefined;
    if (!to) return;
    const from = ALL_STATUSES.find((status) => grouped[status].some((a) => a.id === id));
    if (!from || from === to) return;
    const moved = grouped[from].find((a) => a.id === id)!;

    setGrouped((current) => ({
      ...current,
      [from]: current[from].filter((a) => a.id !== id),
      [to]: [{ ...moved, status: to }, ...current[to]],
    }));

    startTransition(async () => {
      const result = await changeApplicationStatus({ id, status: to });
      if (!result.ok) {
        setGrouped((current) => ({
          ...current,
          [to]: current[to].filter((a) => a.id !== id),
          [from]: [moved, ...current[from]],
        }));
        toast.error(result.error);
        return;
      }
      toast.success(`${moved.companyName} moved to ${STATUS_META[to].label}`);
    });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="d-flex gap-3 pb-2" style={{ overflowX: "auto" }}>
        {ALL_STATUSES.map((status) => (
          <PipelineColumn key={status} status={status} applications={grouped[status]} nextInterviews={nextInterviews} />
        ))}
      </div>
    </DndContext>
  );
}
