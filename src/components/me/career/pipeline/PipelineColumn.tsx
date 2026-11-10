"use client";

import { useDroppable } from "@dnd-kit/core";
import PipelineCard from "./PipelineCard";
import { STATUS_ACCENT, STATUS_META } from "@/features/career/status";
import type { ApplicationStatus } from "@/db/schema/career";
import type { ApplicationDto } from "@/features/career/types";

const EMPTY_HINT: Partial<Record<ApplicationStatus, string>> = {
  wishlist: "Roles you might apply to",
  applied: "Drag here once you've sent it",
  screening: "First call or recruiter screen",
  interview: "Interviews in progress",
  offer: "Offers to decide on",
  rejected: "Closed by the company",
  withdrawn: "Closed by you",
};

export default function PipelineColumn({
  status,
  applications,
  nextInterviews,
  now,
}: {
  status: ApplicationStatus;
  applications: ApplicationDto[];
  nextInterviews: Record<string, string>;
  now: Date;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={`pl-col${isOver ? " is-over" : ""}`}
      style={{ ["--accent" as string]: STATUS_ACCENT[status] }}
      aria-label={`${STATUS_META[status].label}, ${applications.length}`}
    >
      <header className="pl-col-head">
        <span className="pl-col-dot" aria-hidden />
        <h2 className="pl-col-title">{STATUS_META[status].label}</h2>
        <span className="pl-col-count">{applications.length}</span>
      </header>
      {applications.length === 0 ? (
        <p className="pl-col-empty">{EMPTY_HINT[status]}</p>
      ) : (
        applications.map((application) => (
          <PipelineCard key={application.id} application={application} nextInterview={nextInterviews[application.id]} now={now} />
        ))
      )}
    </section>
  );
}
