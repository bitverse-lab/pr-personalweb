import Link from "next/link";
import { FiBriefcase } from "react-icons/fi";
import EmptyState from "@/components/shared/EmptyState";
import { PIPELINE_COLUMNS, STATUS_META } from "@/features/career/status";
import type { ApplicationStatus } from "@/db/schema/career";
import OverviewCard from "./OverviewCard";

export interface InterviewPreview {
  id: string;
  applicationId: string;
  title: string;
  whenLabel: string;
}

export interface CareerSummary {
  counts: Partial<Record<ApplicationStatus, number>>;
  interviews: InterviewPreview[];
}

export default function CareerSection({ summary }: { summary?: CareerSummary }) {
  const total = summary ? Object.values(summary.counts).reduce((sum, n) => sum + (n ?? 0), 0) : 0;

  return (
    <OverviewCard title="Career Pipeline" icon={FiBriefcase}>
      {!summary || total === 0 ? (
        <EmptyState
          icon={FiBriefcase}
          title="No applications tracked yet"
          description="Track the roles you're applying to, from first contact to offer."
          actionLabel="Open Career"
          actionHref="/me/career"
        />
      ) : (
        <>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {PIPELINE_COLUMNS.map((status) => (
              <Link
                key={status}
                href={`/me/career/applications?status=${status}`}
                className={`${STATUS_META[status].badge} text-decoration-none`}
              >
                {STATUS_META[status].label} · {summary.counts[status] ?? 0}
              </Link>
            ))}
          </div>
          <div className="text-muted small mb-1">Upcoming interviews</div>
          {summary.interviews.length === 0 ? (
            <p className="small mb-0">None scheduled.</p>
          ) : (
            <ul className="list-unstyled mb-0">
              {summary.interviews.map((interview) => (
                <li key={interview.id} className="d-flex justify-content-between border-bottom py-2">
                  <Link href={`/me/career/applications/${interview.applicationId}`}>{interview.title}</Link>
                  <span className="text-muted small">{interview.whenLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </OverviewCard>
  );
}
