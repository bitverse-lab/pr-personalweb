// Pure read-outs over applications: how long something has sat in a stage, what needs a nudge,
// and how often applications get an answer. No server imports: client and server both use these.
import type { ApplicationStatus } from "@/db/schema/career";

const DAY = 86_400_000;

export function daysSince(from: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - from.getTime()) / DAY));
}

interface Staged {
  status: ApplicationStatus;
  stageSince: Date | null;
  appliedAt: string | null;
  createdAt: Date;
}

/**
 * When the application entered its current stage. For "applied" the applied date the owner typed
 * wins (it is often back-dated when logging an application late); otherwise the recorded stage
 * change, then creation for rows that predate stage history.
 */
export function stageStart(app: Staged): Date {
  if (app.status === "applied" && app.appliedAt) return new Date(`${app.appliedAt}T00:00:00`);
  return app.stageSince ?? app.createdAt;
}

// How long silence is normal before a polite follow-up makes sense, per waiting stage.
export const FOLLOW_UP_AFTER_DAYS: Partial<Record<ApplicationStatus, number>> = { applied: 14, screening: 10 };

/** Days waiting, when an application has waited long enough to deserve a follow-up; otherwise null. */
export function followUpDue(app: Staged, now: Date): number | null {
  const limit = FOLLOW_UP_AFTER_DAYS[app.status];
  if (limit === undefined) return null;
  const waited = daysSince(stageStart(app), now);
  return waited >= limit ? waited : null;
}

const SENT: ApplicationStatus[] = ["applied", "screening", "interview", "offer", "rejected"];
const ANSWERED: ApplicationStatus[] = ["screening", "interview", "offer", "rejected"];

/**
 * Of the applications actually sent (not wishlist, not withdrawn), how many got any answer:
 * a screen, an interview, an offer, or a no. A rejection is still a reply.
 */
export function responseRate(statuses: ApplicationStatus[]): { answered: number; sent: number; percent: number | null } {
  const sent = statuses.filter((s) => SENT.includes(s)).length;
  const answered = statuses.filter((s) => ANSWERED.includes(s)).length;
  return { answered, sent, percent: sent === 0 ? null : Math.round((answered / sent) * 100) };
}

/** "today", "1d", "12d", "3w", "2mo": compact age for cards. */
export function shortAge(days: number): string {
  if (days === 0) return "today";
  if (days < 14) return `${days}d`;
  if (days < 60) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

/** "in 45 min", "in 3 h", "tomorrow", "in 4 days", "Nov 30" for an upcoming instant. */
export function untilLabel(at: Date, now: Date): string {
  const minutes = Math.round((at.getTime() - now.getTime()) / 60000);
  if (minutes < 0) return "now";
  if (minutes < 60) return `in ${minutes} min`;
  if (minutes < 60 * 12) return `in ${Math.round(minutes / 60)} h`;
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(at) - startOf(now)) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  return at.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
