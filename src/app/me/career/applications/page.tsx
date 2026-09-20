import Link from "next/link";
import { Suspense } from "react";
import { FiBriefcase, FiChevronRight, FiMapPin } from "react-icons/fi";
import MePageHeader from "@/components/me/MePageHeader";
import EmptyState from "@/components/shared/EmptyState";
import TaskSearch from "@/components/me/tasks/TaskSearch";
import ApplicationStatusBadge from "@/components/me/career/ApplicationStatusBadge";
import NewApplicationButton from "@/components/me/career/NewApplicationButton";
import { getApplications, getCompanyNames } from "@/features/career/actions";
import { ALL_STATUSES, STATUS_META } from "@/features/career/status";
import type { ApplicationStatus } from "@/db/schema/career";

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
  const [applications, companies] = await Promise.all([getApplications({ status, q }), getCompanyNames()]);

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
        <MePageHeader title="Applications" backHref="/me/career" backLabel="Back to Career" />
        <NewApplicationButton companies={companies} />
      </div>

      <div className="card rounded shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div className="d-flex flex-wrap gap-1">
              {[...GROUP_TABS.map((t) => ({ value: t.value as string, label: t.label })), ...ALL_STATUSES.map((s) => ({ value: s as string, label: STATUS_META[s].label }))].map(
                (tab) => (
                  <Link
                    key={tab.value}
                    href={href(tab.value, q)}
                    className={`btn btn-sm ${status === tab.value ? "btn-primary" : "btn-outline-primary"}`}
                  >
                    {tab.label}
                  </Link>
                )
              )}
            </div>
            <Suspense fallback={null}>
              <TaskSearch id="application-search" placeholder="Search company or role" label="Search applications" />
            </Suspense>
          </div>

          {applications.length === 0 ? (
            <EmptyState
              icon={FiBriefcase}
              title={q || status !== "all" ? "No matching applications" : "No applications yet"}
              description={q || status !== "all" ? "Try a different filter or search." : "Add your first application to get started."}
            />
          ) : (
            <ul className="list-unstyled mb-0">
              {applications.map((application) => (
                <li key={application.id}>
                  <Link
                    href={`/me/career/applications/${application.id}`}
                    className="d-flex align-items-center justify-content-between gap-3 p-3 rounded text-decoration-none border-bottom"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle bg-soft-primary text-primary d-flex align-items-center justify-content-center fw-semibold"
                        style={{ width: 40, height: 40, flex: "0 0 40px" }}
                        aria-hidden
                      >
                        {application.companyName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-dark fw-semibold">{application.roleTitle}</div>
                        <div className="text-muted small d-flex flex-wrap gap-2">
                          <span>{application.companyName}</span>
                          {application.location && (
                            <span className="d-inline-flex align-items-center gap-1">
                              <FiMapPin aria-hidden /> {application.location}
                            </span>
                          )}
                          {application.appliedAt && <span>Applied {application.appliedAt}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <ApplicationStatusBadge status={application.status} />
                      <FiChevronRight className="text-muted" aria-hidden />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
