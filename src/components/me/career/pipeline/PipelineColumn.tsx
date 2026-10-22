"use client";

import { useDroppable } from "@dnd-kit/core";
import PipelineCard from "./PipelineCard";
import { STATUS_ACCENT, STATUS_META } from "@/features/career/status";
import type { ApplicationStatus } from "@/db/schema/career";
import type { ApplicationDto } from "@/features/career/types";

export default function PipelineColumn({
  status,
  applications,
  nextInterviews,
}: {
  status: ApplicationStatus;
  applications: ApplicationDto[];
  nextInterviews: Record<string, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className="rounded p-2"
      style={{
        background: isOver ? "var(--app-primary-soft)" : "var(--app-surface)",
        borderTop: `3px solid ${STATUS_ACCENT[status]}`,
        minHeight: 180,
        minWidth: 230,
        width: 230,
        flex: "0 0 230px",
      }}
    >
      <div className="d-flex align-items-center justify-content-between mb-2 px-1">
        <h6 className="mb-0">{STATUS_META[status].label}</h6>
        <span className="badge bg-light text-dark">{applications.length}</span>
      </div>
      {applications.length === 0 ? (
        <p className="text-muted small px-1 mb-0">Drop a card here</p>
      ) : (
        applications.map((application) => (
          <PipelineCard key={application.id} application={application} nextInterview={nextInterviews[application.id]} />
        ))
      )}
    </div>
  );
}
