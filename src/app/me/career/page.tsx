import Link from "next/link";
import { FiBriefcase, FiList } from "react-icons/fi";
import MePageHeader from "@/components/me/MePageHeader";
import EmptyState from "@/components/shared/EmptyState";
import NewApplicationButton from "@/components/me/career/NewApplicationButton";
import PipelineBoard from "@/components/me/career/pipeline/PipelineBoard";
import { getApplications, getCompanyNames, getInterviews } from "@/features/career/actions";
import { CLOSED_STATUSES } from "@/features/career/status";
import type { ApplicationDto } from "@/features/career/types";

function Tile({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="col">
      <div className="card rounded shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small mb-1">{label}</div>
          <div className="h3 mb-0">{value}</div>
          <div className="text-muted small">{hint}</div>
        </div>
      </div>
    </div>
  );
}

export default async function CareerPage() {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000);
  const [applications, companies, interviews] = await Promise.all([
    getApplications({}),
    getCompanyNames(),
    getInterviews({ start: now.toISOString(), end: in30Days.toISOString() }),
  ]);

  const upcoming = interviews.filter((i) => i.status === "scheduled" && i.startAt >= now);
  const nextInterviews: Record<string, string> = {};
  for (const interview of upcoming) {
    if (!nextInterviews[interview.applicationId]) nextInterviews[interview.applicationId] = interview.startAt.toISOString();
  }

  const active = applications.filter((a) => !CLOSED_STATUSES.includes(a.status)).length;
  const offers = applications.filter((a) => a.status === "offer").length;

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
        <MePageHeader title="Career" description="Track the roles you're applying to, from first contact to offer." />
        <div className="d-flex gap-2">
          <Link href="/me/career/applications" className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1">
            <FiList /> All applications
          </Link>
          <NewApplicationButton companies={companies} />
        </div>
      </div>

      <div className="row row-cols-1 row-cols-sm-3 g-2 mb-4">
        <Tile label="Active applications" value={active} hint="not rejected or withdrawn" />
        <Tile label="Upcoming interviews" value={upcoming.length} hint="next 30 days" />
        <Tile label="Offers" value={offers} hint="waiting for your decision" />
      </div>

      {applications.length === 0 ? (
        <div className="card rounded shadow-sm">
          <div className="card-body">
            <EmptyState
              icon={FiBriefcase}
              title="No applications yet"
              description="Add the first role you're interested in and follow it through every stage."
            />
          </div>
        </div>
      ) : (
        <div className="card rounded shadow-sm">
          <div className="card-body">
            <PipelineBoard
              key={applications.map((a) => `${a.id}:${a.status}`).join("|")}
              applications={applications as ApplicationDto[]}
              nextInterviews={nextInterviews}
            />
          </div>
        </div>
      )}
    </div>
  );
}
