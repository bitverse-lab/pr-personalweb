import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiCalendar, FiDollarSign, FiExternalLink, FiMapPin } from "react-icons/fi";
import ApplicationStatusBadge from "@/components/me/career/ApplicationStatusBadge";
import ApplicationHeaderActions from "@/components/me/career/ApplicationHeaderActions";
import ApplicationTimeline from "@/components/me/career/ApplicationTimeline";
import ContactsCard from "@/components/me/career/ContactsCard";
import InterviewsCard from "@/components/me/career/InterviewsCard";
import DocumentsCard from "@/components/me/career/DocumentsCard";
import NoteForm from "@/components/me/career/NoteForm";
import { getApplicationDocuments } from "@/features/career/document-actions";
import { isStorageConfigured } from "@/server/storage/client";
import { getApplicationDetail, getCompanyNames } from "@/features/career/actions";
import StageStepper from "@/components/me/career/StageStepper";
import AdvanceStageButton from "@/components/me/career/AdvanceStageButton";
import { daysSince, followUpDue, stageStart } from "@/features/career/insights";
import type { ApplicationDto } from "@/features/career/types";

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const [detail, companies, documents] = await Promise.all([getApplicationDetail(params.id), getCompanyNames(), getApplicationDocuments(params.id)]);
  if (!detail) notFound();

  const application = detail.application as ApplicationDto;
  const now = new Date();
  const hasUpcoming = detail.interviews.some((i) => i.status === "scheduled" && i.startAt >= now);
  const nudge = hasUpcoming ? null : followUpDue(application, now);
  const inStage = daysSince(stageStart(application), now);

  return (
    <div className="container-fluid py-4 px-4">
      <Link href="/me/career/applications" className="text-muted small d-inline-flex align-items-center gap-1 mb-3">
        <FiArrowLeft /> Back to Applications
      </Link>

      <div className="card rounded shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle bg-soft-primary text-primary d-flex align-items-center justify-content-center fw-semibold fs-5"
                style={{ width: 52, height: 52, flex: "0 0 52px" }}
                aria-hidden
              >
                {application.companyName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="h4 mb-0">{application.roleTitle}</h1>
                <div className="text-muted">{application.companyName}</div>
                <div className="mt-1">
                  <ApplicationStatusBadge status={application.status} />
                </div>
              </div>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <AdvanceStageButton id={application.id} status={application.status} />
              <ApplicationHeaderActions application={application} companies={companies} />
            </div>
          </div>

          <StageStepper status={application.status} history={detail.history} />
          {nudge !== null ? (
            <p className="career-nudge" role="note">
              No reply for {nudge} days. A short, friendly follow-up to the recruiter is a good next step.
            </p>
          ) : (
            <p className="career-stage-age">{inStage === 0 ? "Entered this stage today." : `In this stage for ${inStage} day${inStage === 1 ? "" : "s"}.`}</p>
          )}

          <div className="d-flex flex-wrap gap-3 text-muted small mt-3">
            {application.location && (
              <span className="d-inline-flex align-items-center gap-1">
                <FiMapPin aria-hidden /> {application.location}
                {application.workMode && <span className="text-capitalize"> · {application.workMode}</span>}
              </span>
            )}
            {application.salaryRange && (
              <span className="d-inline-flex align-items-center gap-1">
                <FiDollarSign aria-hidden /> {application.salaryRange}
              </span>
            )}
            {application.appliedAt && (
              <span className="d-inline-flex align-items-center gap-1">
                <FiCalendar aria-hidden /> Applied{" "}
                {new Date(`${application.appliedAt}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
            {application.jobUrl && (
              <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="d-inline-flex align-items-center gap-1">
                <FiExternalLink aria-hidden /> Job posting
              </a>
            )}
          </div>

          {application.notes && (
            <p className="mt-3 mb-0" style={{ whiteSpace: "pre-wrap" }}>
              {application.notes}
            </p>
          )}
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-7">
          <InterviewsCard
            applicationId={application.id}
            interviews={detail.interviews}
            contacts={detail.contacts}
          />
          <ContactsCard applicationId={application.id} contacts={detail.contacts} />
          <DocumentsCard applicationId={application.id} documents={documents} storageConfigured={isStorageConfigured()} />
        </div>
        <div className="col-lg-5">
          <div className="card rounded shadow-sm mb-3">
            <div className="card-body">
              <h6 className="mb-3">Timeline</h6>
              <div className="mb-3">
                <NoteForm applicationId={application.id} />
              </div>
              <ApplicationTimeline events={detail.timeline} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
