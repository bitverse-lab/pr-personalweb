import Link from "next/link";
import { FiArrowRight, FiBriefcase, FiCalendar, FiClock, FiList } from "react-icons/fi";
import MePageHeader from "@/components/me/MePageHeader";
import EmptyState from "@/components/shared/EmptyState";
import NewApplicationButton from "@/components/me/career/NewApplicationButton";
import PipelineBoard from "@/components/me/career/pipeline/PipelineBoard";
import { getApplications, getCompanyNames, getInterviews } from "@/features/career/actions";
import { CLOSED_STATUSES, INTERVIEW_KIND_LABEL, STATUS_META } from "@/features/career/status";
import { followUpDue, responseRate, untilLabel } from "@/features/career/insights";
import type { ApplicationDto } from "@/features/career/types";

function Tile({ label, value, hint, tone }: { label: string; value: string | number; hint: string; tone?: string }) {
  return (
    <div className={`career-tile${tone ? ` career-tile--${tone}` : ""}`}>
      <span className="career-tile-n">{value}</span>
      <span className="career-tile-l">{label}</span>
      <span className="career-tile-h">{hint}</span>
    </div>
  );
}

export default async function CareerPage() {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000);
  const [rows, companies, interviews] = await Promise.all([
    getApplications({}),
    getCompanyNames(),
    getInterviews({ start: now.toISOString(), end: in30Days.toISOString() }),
  ]);
  const applications = rows as ApplicationDto[];

  const upcoming = interviews.filter((i) => i.status === "scheduled" && i.startAt >= now);
  const nextInterviews: Record<string, string> = {};
  for (const interview of upcoming) {
    if (!nextInterviews[interview.applicationId]) nextInterviews[interview.applicationId] = interview.startAt.toISOString();
  }

  const active = applications.filter((a) => !CLOSED_STATUSES.includes(a.status)).length;
  const offers = applications.filter((a) => a.status === "offer").length;
  const rate = responseRate(applications.map((a) => a.status));
  // Waiting too long with no interview booked: a follow-up is the next useful move.
  const nudges = applications
    .map((a) => ({ a, days: nextInterviews[a.id] ? null : followUpDue(a, now) }))
    .filter((x): x is { a: ApplicationDto; days: number } => x.days !== null)
    .sort((x, y) => y.days - x.days);

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

      <div className="career-tiles">
        <Tile label="Active" value={active} hint="not rejected or withdrawn" />
        <Tile
          label="Heard back"
          value={rate.percent === null ? "–" : `${rate.percent}%`}
          hint={rate.sent === 0 ? "nothing sent yet" : `${rate.answered} of ${rate.sent} sent`}
        />
        <Tile
          label="Interviews"
          value={upcoming.length}
          hint={upcoming[0] ? `next ${untilLabel(upcoming[0].startAt, now)}` : "none in the next 30 days"}
          tone={upcoming.length ? "primary" : undefined}
        />
        <Tile label="Offers" value={offers} hint={offers ? "waiting for your decision" : "none yet"} tone={offers ? "success" : undefined} />
      </div>

      {(upcoming.length > 0 || nudges.length > 0) && (
        <div className="row g-3 mb-3">
          {upcoming.length > 0 && (
            <div className={nudges.length > 0 ? "col-lg-6" : "col-12"}>
              <section className="card rounded shadow-sm h-100" aria-labelledby="upcoming-h">
                <div className="card-body">
                  <h2 id="upcoming-h" className="career-h">
                    <FiCalendar aria-hidden /> Upcoming interviews
                  </h2>
                  <ul className="list-unstyled career-list mb-0">
                    {upcoming.slice(0, 5).map((i) => (
                      <li key={i.id}>
                        <Link href={`/me/career/applications/${i.applicationId}`}>
                          <span className="career-when">{untilLabel(i.startAt, now)}</span>
                          <span className="career-what">
                            <strong>{i.companyName}</strong> · {INTERVIEW_KIND_LABEL[i.kind]}
                            <span className="career-sub">
                              {i.roleTitle} · {i.startAt.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            </span>
                          </span>
                          <FiArrowRight aria-hidden className="career-go" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>
          )}
          {nudges.length > 0 && (
            <div className={upcoming.length > 0 ? "col-lg-6" : "col-12"}>
              <section className="card rounded shadow-sm h-100" aria-labelledby="nudge-h">
                <div className="card-body">
                  <h2 id="nudge-h" className="career-h">
                    <FiClock aria-hidden /> Worth a follow-up
                  </h2>
                  <ul className="list-unstyled career-list mb-0">
                    {nudges.slice(0, 5).map(({ a, days }) => (
                      <li key={a.id}>
                        <Link href={`/me/career/applications/${a.id}`}>
                          <span className="career-when career-when--nudge">{days}d</span>
                          <span className="career-what">
                            <strong>{a.companyName}</strong> · {a.roleTitle}
                            <span className="career-sub">
                              {STATUS_META[a.status].label} for {days} days with no reply
                            </span>
                          </span>
                          <FiArrowRight aria-hidden className="career-go" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="career-tip">A two-line note to the recruiter after two quiet weeks is normal and often gets things moving.</p>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="card rounded shadow-sm">
          <div className="card-body">
            <EmptyState icon={FiBriefcase} title="No applications yet" description="Add the first role you're interested in and follow it through every stage." />
          </div>
        </div>
      ) : (
        <div className="card rounded shadow-sm">
          <div className="card-body">
            <h2 className="career-h">Pipeline</h2>
            <p className="career-board-hint">Drag a card to move it to the next stage. Click the role to open it.</p>
            <PipelineBoard
              key={applications.map((a) => `${a.id}:${a.status}`).join("|")}
              applications={applications}
              nextInterviews={nextInterviews}
              nowIso={now.toISOString()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
