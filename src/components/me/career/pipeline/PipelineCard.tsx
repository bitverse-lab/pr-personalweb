"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FiCalendar, FiMapPin } from "react-icons/fi";
import type { ApplicationDto } from "@/features/career/types";

export default function PipelineCard({ application, nextInterview }: { application: ApplicationDto; nextInterview?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: application.id });
  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className="card rounded shadow-sm mb-2 me-board-card" {...listeners} {...attributes}>
      <div className="card-body p-3">
        <div className="fw-semibold">{application.companyName}</div>
        <Link
          href={`/me/career/applications/${application.id}`}
          className="d-block text-dark small mb-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {application.roleTitle}
        </Link>
        <div className="d-flex flex-wrap gap-2 text-muted small">
          {application.location && (
            <span className="d-inline-flex align-items-center gap-1">
              <FiMapPin aria-hidden /> {application.location}
            </span>
          )}
          {application.workMode && <span className="text-capitalize">{application.workMode}</span>}
          {application.appliedAt && <span>Applied {application.appliedAt}</span>}
        </div>
        {nextInterview && (
          <div className="mt-2">
            <span className="badge bg-soft-warning text-warning d-inline-flex align-items-center gap-1">
              <FiCalendar aria-hidden /> {new Date(nextInterview).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
