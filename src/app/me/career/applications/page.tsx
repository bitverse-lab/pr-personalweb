import Link from "next/link";
import { Suspense } from "react";
import { FiBriefcase, FiChevronRight, FiClock, FiMapPin } from "react-icons/fi";
import MePageHeader from "@/components/me/MePageHeader";
import EmptyState from "@/components/shared/EmptyState";
import TaskSearch from "@/components/me/tasks/TaskSearch";
import ApplicationStatusBadge from "@/components/me/career/ApplicationStatusBadge";
import NewApplicationButton from "@/components/me/career/NewApplicationButton";
import { getApplicationStatusCounts, getApplications, getCompanyNames } from "@/features/career/actions";
import { ALL_STATUSES, STATUS_ACCENT, STATUS_META } from "@/features/career/status";
import { daysSince, followUpDue, shortAge, stageStart } from "@/features/career/insights";
import type { ApplicationStatus } from "@/db/schema/career";
import type { ApplicationDto } from "@/features/career/types";

const GROUP_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
] as const;

type FilterValue = ApplicationStatus | (typeof GROUP_TABS)[number]["value"];

function isFilter(value: string | undefined): value is FilterValue {
  return GROUP_TABS.some((tab) => tab.value === value) || ALL_STATUSES.includes(value as ApplicationStatus);
}

function href(status: string, q?: string) {
  const query = new URLSearchParams();
  if (status !== "all") query.set("status", status);
  if (q) query.set("q", q);
  const text = query.toString();
  return text ? `/me/career/applications?${text}` : "/me/career/applications";
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const status: FilterValue = isFilter(searchParams.status) ? searchParams.status : "all";
  const q = searchParams.q?.trim().slice(0, 100) || undefined;
  const [rows, companies, counts] = await Promise.all([getApplications({ status, q }), getCompanyNames(), getApplicationStatusCounts()]);
  const applications = rows as ApplicationDto[];
  const countOf = new Map(counts.map((c) => [c.status, c.count]));
  const now = new Date();

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
        <MePageHeader title="Applications" backHref="/me/career" backLabel="Back to Career" />
        <NewApplicationButton companies={companies} />
      </div>

      <div className="card rounded shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <div className="btn-group" role="group" aria-label="Show">
              {GROUP_TABS.map((tab) => (
                <Link
                  key={tab.value}
                  href={href(tab.value, q)}
                  aria-current={status === tab.value ? "true" : undefined}
                  className={`btn btn-sm ${status === tab.value ? "btn-primary" : "btn-outline-primary"}`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            <Suspense fallback={null}>
              <TaskSearch id="application-search" placeholder="Search company or role" label="Search applications" />
            </Suspense>
          </div>

          {/* Stage filters as chips with counts: one click narrows to a stage, again clears it. */}
          <nav className="app-stage-chips" aria-label="Filter by stage">
            {ALL_STATUSES.map((s) => (
              <Link
                key={s}
                href={href(status === s ? "all" : s, q)}
                aria-current={status === s ? "true" : undefined}
                className={`app-stage-chip${status === s ? " is-on" : ""}${countOf.get(s) ? "" : " is-empty"}`}
                style={{ ["--accent" as string]: STATUS_ACCENT[s] }}
              >
                <span className="app-stage-dot" aria-hidden />
                {STATUS_META[s].label}
                <span className="app-stage-n">{countOf.get(s) ?? 0}</span>
              </Link>
            ))}
          </nav>

          {applications.length === 0 ? (
            <EmptyState
              icon={FiBriefcase}
              title={q || status !== "all" ? "No matching applications" : "No applications yet"}
              description={q || status !== "all" ? "Try a different filter or search." : "Add your first application to get started."}
            />
          ) : (
            <ul className="list-unstyled mb-0 app-list">
              {applications.map((application) => {
                const nudge = followUpDue(application, now);
                const inStage = daysSince(stageStart(application), now);
                return (
                  <li key={application.id}>
                    <Link href={`/me/career/applications/${application.id}`} className="app-row">
                      <span className="pl-avatar" aria-hidden>
                        {application.companyName.charAt(0).toUpperCase()}
                      </span>
                      <span className="app-row-main">
                        <span className="app-row-role">{application.roleTitle}</span>
                        <span className="app-row-meta">
                          <span>{application.companyName}</span>
                          {application.location && (
                            <span className="d-inline-flex align-items-center gap-1">
                              <FiMapPin aria-hidden /> {application.location}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="app-row-side">
                        {nudge !== null ? (
                          <span className="pl-pill pl-pill--nudge">
                            <FiClock aria-hidden /> Follow up · {shortAge(nudge)}
                          </span>
                        ) : (
                          <span className="pl-age">{inStage === 0 ? "today" : `${shortAge(inStage)} in stage`}</span>
                        )}
                        <ApplicationStatusBadge status={application.status} />
                        <FiChevronRight className="text-muted" aria-hidden />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
