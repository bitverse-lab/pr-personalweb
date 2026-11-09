import { auth } from "@/server/auth";
import TasksSection from "@/components/me/overview/TasksSection";
import CalendarSection from "@/components/me/overview/CalendarSection";
import CareerSection from "@/components/me/overview/CareerSection";
import HealthSection, { type HealthSummary } from "@/components/me/overview/HealthSection";
import { getHealthDashboard } from "@/features/health/dashboard-actions";
import JournalSection, { type JournalSummaryData } from "@/components/me/overview/JournalSection";
import { getJournalOverview } from "@/features/content/journal-actions";
import { getMyArticles } from "@/features/content/article-actions";
import Link from "next/link";
import { getUnreadMessageCount } from "@/features/contact/actions";
import QuickCapture from "@/components/me/overview/QuickCapture";
import SetupChecklist from "@/components/me/overview/SetupChecklist";
import { getDemoStatus, getSetupChecklist } from "@/features/setup/actions";
import ProductivitySection from "@/components/me/overview/ProductivitySection";
import MiniCalendar from "@/components/me/overview/MiniCalendar";
import OverviewDndProvider from "@/components/me/overview/OverviewDndProvider";
import { getTasks } from "@/features/tasks/actions";
import { getCalendarEvents } from "@/features/calendar/actions";
import { getApplicationStatusCounts, getInterviews } from "@/features/career/actions";
import { getTaskCompletionActivity, getOverdueTaskCount } from "@/features/tasks/analytics";
import { toTaskPreview } from "@/features/tasks/mappers";
import { toEventPreview } from "@/features/calendar/mappers";

export default async function MeOverviewPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [tasks, events, activity, monthEvents, overdue, statusCounts, interviewRows, health, journal, articleInfo, checklist, unreadMessages, demoLoaded] = await Promise.all([
    getTasks({ status: "open", orderBy: "dueDate", limit: 5 }),
    getCalendarEvents({ start: now.toISOString(), end: sevenDaysOut.toISOString(), limit: 5 }),
    getTaskCompletionActivity(),
    getCalendarEvents({ start: monthStart.toISOString(), end: monthEnd.toISOString() }),
    getOverdueTaskCount(),
    getApplicationStatusCounts(),
    getInterviews({ start: now.toISOString(), end: new Date(now.getTime() + 30 * 86400000).toISOString() }),
    getHealthDashboard(),
    getJournalOverview({ limit: 3 }),
    getMyArticles(),
    getSetupChecklist(),
    getUnreadMessageCount(),
    getDemoStatus(),
  ]);

  const journalSummary: JournalSummaryData = {
    today: journal.today,
    todayWords: journal.todayEntry.words,
    streak: journal.stats.streak,
    entries: journal.list.map((e) => ({
      id: e.id,
      title: e.title || e.snippet.slice(0, 60) || "Untitled entry",
      dateLabel: new Date(`${e.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
    })),
    drafts: articleInfo.counts.draft ?? 0,
    published: articleInfo.counts.published ?? 0,
  };

  const healthSummary: HealthSummary = {
    caloriesToday: health.day.totals.calories,
    calorieTarget: health.day.targets.calories,
    waterMl: health.day.waterMl,
    waterTarget: health.day.targets.waterMl,
    latestWeightKg: health.weight.latest?.weightKg ?? null,
    sevenDayAverageKg: health.weight.sevenDayAverage,
    weekWorkouts: health.workouts.week.count,
    weekWorkoutTarget: health.workouts.week.target,
    activeWorkout: health.workouts.active,
  };

  const careerSummary = {
    counts: Object.fromEntries(statusCounts.map((row) => [row.status, row.count])),
    interviews: interviewRows
      .filter((row) => row.status === "scheduled" && row.startAt >= now)
      .slice(0, 3)
      .map((row) => ({
        id: row.id,
        applicationId: row.applicationId,
        title: `${row.companyName} — ${row.roleTitle}`,
        whenLabel: row.startAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
      })),
  };
  const taskPreviews = tasks.map(toTaskPreview);
  const markers = [
    ...monthEvents.map((event) => ({ date: event.startAt.toISOString().slice(0, 10) })),
    ...tasks.filter((task) => task.dueDate).map((task) => ({ date: task.dueDate! })),
  ];

  return (
    <OverviewDndProvider>
      <div className="container-fluid py-4 px-4">
        <div className="mb-4">
          <h1 className="h4 mb-1">Welcome back, {firstName}</h1>
          <p className="text-muted mb-0">Here&apos;s what&apos;s going on today.</p>
        </div>

        {demoLoaded && (
          <div className="alert alert-warning py-2" role="status">
            Demo data is loaded. Remove it before sharing your site: <code>pnpm db:seed:clean</code>
          </div>
        )}
        {unreadMessages > 0 && (
          <div className="alert alert-primary d-flex flex-wrap justify-content-between align-items-center gap-2 py-2" role="status">
            <span>
              You have <strong>{unreadMessages}</strong> unread message{unreadMessages === 1 ? "" : "s"} from your contact form.
            </span>
            <Link href="/me/inbox?filter=unread" className="btn btn-sm btn-primary">Open inbox</Link>
          </div>
        )}
        <SetupChecklist items={checklist} />
        <QuickCapture today={health.today} />

        <div className="row row-cols-1 row-cols-md-2 g-4">
          <div className="col">
            <TasksSection tasks={taskPreviews} />
          </div>
          <div className="col">
            <MiniCalendar markers={markers} />
          </div>
          <div className="col">
            <CalendarSection events={events.map(toEventPreview)} />
          </div>
          <div className="col">
            <CareerSection summary={careerSummary} />
          </div>
          <div className="col">
            <HealthSection summary={healthSummary} />
          </div>
          <div className="col">
            <JournalSection summary={journalSummary} />
          </div>
          <div className="col">
            <ProductivitySection activity={activity} overdue={overdue} />
          </div>
        </div>
      </div>
    </OverviewDndProvider>
  );
}
