"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { FiCalendar, FiClock, FiMapPin } from "react-icons/fi";
import { daysSince, followUpDue, shortAge, stageStart, untilLabel } from "@/features/career/insights";
import type { ApplicationDto } from "@/features/career/types";

/** The card face, shared by the card in its column and the lifted copy under the pointer. */
export function PipelineCardBody({ application, nextInterview, now }: { application: ApplicationDto; nextInterview?: string; now: Date }) {
  const inStage = daysSince(stageStart(application), now);
  const nudge = followUpDue(application, now);
  return (
    <>
      <div className="pl-card-head">
        <span className="pl-avatar" aria-hidden>
          {application.companyName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="pl-company">{application.companyName}</div>
          <Link href={`/me/career/applications/${application.id}`} className="pl-role" onPointerDown={(e) => e.stopPropagation()}>
            {application.roleTitle}
          </Link>
        </div>
      </div>
      {(application.location || application.workMode) && (
        <div className="pl-meta">
          <FiMapPin aria-hidden />
          {[application.location, application.workMode && application.workMode[0].toUpperCase() + application.workMode.slice(1)].filter(Boolean).join(" · ")}
        </div>
      )}
      <div className="pl-foot">
        {nextInterview ? (
          <span className="pl-pill pl-pill--interview">
            <FiCalendar aria-hidden /> Interview {untilLabel(new Date(nextInterview), now)}
          </span>
        ) : nudge !== null ? (
          <span className="pl-pill pl-pill--nudge" title="No reply for a while: a short follow-up email often helps">
            <FiClock aria-hidden /> Follow up · {shortAge(nudge)}
          </span>
        ) : (
          <span className="pl-age" title="Time in this stage">
            {inStage === 0 ? "New today" : `${shortAge(inStage)} in stage`}
          </span>
        )}
      </div>
    </>
  );
}

export default function PipelineCard({ application, nextInterview, now }: { application: ApplicationDto; nextInterview?: string; now: Date }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: application.id });

  return (
    <div
      ref={setNodeRef}
      className={`pl-card${isDragging ? " is-placeholder" : ""}`}
      {...listeners}
      {...attributes}
      aria-label={`${application.roleTitle} at ${application.companyName}. Drag to change stage`}
      aria-roledescription="draggable application"
    >
      <PipelineCardBody application={application} nextInterview={nextInterview} now={now} />
    </div>
  );
}
