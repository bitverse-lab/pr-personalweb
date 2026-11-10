"use client";

import { useRef, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import PipelineColumn from "./PipelineColumn";
import { PipelineCardBody } from "./PipelineCard";
import { changeApplicationStatus } from "@/features/career/actions";
import { ALL_STATUSES, CLOSED_STATUSES, PIPELINE_COLUMNS, STATUS_META } from "@/features/career/status";
import { useToast } from "@/components/shared/ToastProvider";
import type { ApplicationStatus } from "@/db/schema/career";
import type { ApplicationDto } from "@/features/career/types";

function group(applications: ApplicationDto[]): Record<ApplicationStatus, ApplicationDto[]> {
  const result = Object.fromEntries(ALL_STATUSES.map((status) => [status, [] as ApplicationDto[]])) as Record<ApplicationStatus, ApplicationDto[]>;
  for (const application of applications) result[application.status].push(application);
  return result;
}

// The column under the pointer wins; overlap-based detection picked the neighbour whenever a card
// was grabbed near an edge. Keyboard drags (no pointer) fall back to overlap.
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

export default function PipelineBoard({
  applications,
  nextInterviews,
  nowIso,
}: {
  applications: ApplicationDto[];
  nextInterviews: Record<string, string>;
  /** Server "now", so day counts render the same on server and client. */
  nowIso: string;
}) {
  const now = new Date(nowIso);
  const [grouped, setGrouped] = useState(() => group(applications));
  // Undo runs from a toast made earlier; it must see the board as it is now.
  const groupedRef = useRef(grouped);
  groupedRef.current = grouped;
  const closedCount = CLOSED_STATUSES.reduce((n, s) => n + grouped[s].length, 0);
  const [showClosed, setShowClosed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const toast = useToast();
  // A small drag distance lets a plain click on the role link navigate instead of starting a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  const move = (id: string, from: ApplicationStatus, to: ApplicationStatus, withUndo: boolean) => {
    const moved = groupedRef.current[from].find((a) => a.id === id);
    if (!moved) return;
    setGrouped((current) => ({
      ...current,
      [from]: current[from].filter((a) => a.id !== id),
      [to]: [{ ...moved, status: to, stageSince: new Date() }, ...current[to]],
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
      if (withUndo) {
        toast.success(`${moved.companyName} moved to ${STATUS_META[to].label}`, {
          action: { label: "Undo", onClick: () => move(id, to, from, false) },
        });
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const id = String(event.active.id);
    const to = event.over?.id as ApplicationStatus | undefined;
    const from = ALL_STATUSES.find((status) => groupedRef.current[status].some((a) => a.id === id));
    if (!to || !from || from === to) return;
    move(id, from, to, true);
  };

  const active = activeId ? Object.values(grouped).flat().find((a) => a.id === activeId) : undefined;
  const columns = showClosed ? ALL_STATUSES : PIPELINE_COLUMNS;

  return (
    <DndContext
      id="pipeline-dnd"
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="pipeline-wrap">
        <div className="pipeline-scroll pl-board" style={{ overflowX: "auto" }}>
          {columns.map((status) => (
            <PipelineColumn key={status} status={status} applications={grouped[status]} nextInterviews={nextInterviews} now={now} />
          ))}
        </div>
      </div>
      {closedCount > 0 && (
        <button type="button" className="pl-closed-toggle" aria-expanded={showClosed} onClick={() => setShowClosed((v) => !v)}>
          {showClosed ? <FiChevronDown aria-hidden /> : <FiChevronRight aria-hidden />}
          {showClosed ? "Hide" : "Show"} closed ({closedCount})
        </button>
      )}
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" }}>
        {active ? (
          <div className="pl-card is-lifted">
            <PipelineCardBody application={active} nextInterview={nextInterviews[active.id]} now={now} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
