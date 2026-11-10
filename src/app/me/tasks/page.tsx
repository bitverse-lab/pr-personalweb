import Link from "next/link";
import { Suspense } from "react";
import { FiCheckSquare } from "react-icons/fi";
import MePageHeader from "@/components/me/MePageHeader";
import EmptyState from "@/components/shared/EmptyState";
import TaskQuickCapture from "@/components/me/tasks/TaskQuickCapture";
import TaskGroups from "@/components/me/tasks/TaskGroups";
import TaskSearch from "@/components/me/tasks/TaskSearch";
import TaskShortcuts from "@/components/me/tasks/TaskShortcuts";
import TaskBoard from "@/components/me/tasks/board/TaskBoard";
import { getTasks } from "@/features/tasks/actions";
import { getSubtasksForTasks, type SubtaskDto } from "@/features/tasks/subtask-actions";
import { daysBetween, groupTasks } from "@/features/tasks/dates";
import { todayInUserTz } from "@/lib/timezone";
import NumberFlow from "@number-flow/react";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "completed", label: "Done" },
] as const;

const VIEW_TABS = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
] as const;

type StatusValue = (typeof STATUS_TABS)[number]["value"];
type ViewValue = (typeof VIEW_TABS)[number]["value"];

function isStatusValue(value: string | undefined): value is StatusValue {
  return STATUS_TABS.some((tab) => tab.value === value);
}

function isViewValue(value: string | undefined): value is ViewValue {
  return VIEW_TABS.some((tab) => tab.value === value);
}

function buildHref(params: { status?: string; view?: string; q?: string }) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.view && params.view !== "list") query.set("view", params.view);
  if (params.q) query.set("q", params.q);
  const text = query.toString();
  return text ? `/me/tasks?${text}` : "/me/tasks";
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { status?: string; view?: string; q?: string };
}) {
  const view = isViewValue(searchParams.view) ? searchParams.view : "list";
  const status = isStatusValue(searchParams.status) ? searchParams.status : "all";
  const q = searchParams.q?.trim().slice(0, 100) || undefined;
  // "Today" is the owner's calendar day (tz cookie), so "overdue" flips at their midnight, not UTC's.
  const [all, today] = await Promise.all([getTasks({ status: "all", q }), todayInUserTz()]);
  const allSubtasks = await getSubtasksForTasks(all.map((task) => task.id));

  const subtasksByTask = new Map<string, SubtaskDto[]>();
  for (const subtask of allSubtasks) {
    subtasksByTask.set(subtask.taskId, [...(subtasksByTask.get(subtask.taskId) ?? []), subtask]);
  }
  const enriched = all.map((task) => ({ ...task, subtasks: subtasksByTask.get(task.id) ?? [] }));
  const listed =
    view === "board" || status === "all" ? enriched : enriched.filter((t) => (status === "open" ? t.status !== "done" : t.status === "done"));

  // Counts over everything (not the current filter), so the summary always tells the whole story.
  const open = enriched.filter((t) => t.status !== "done");
  const weekAgo = Date.now() - 7 * 86_400_000;
  const summary = [
    { key: "overdue", label: "Overdue", count: open.filter((t) => t.dueDate && daysBetween(today, t.dueDate) < 0).length },
    { key: "today", label: "Due today", count: open.filter((t) => t.dueDate === today).length },
    // Same span as the Tomorrow + This week groups (1-6 days out), so the tile and the list agree.
    { key: "week", label: "Coming up", count: open.filter((t) => t.dueDate && daysBetween(today, t.dueDate) > 0 && daysBetween(today, t.dueDate) < 7).length },
    { key: "done", label: "Done this week", count: enriched.filter((t) => t.status === "done" && t.completedAt && t.completedAt.getTime() >= weekAgo).length },
  ];
  const groups = groupTasks(listed, today);
  // Where each summary tile jumps to in the list ("Coming up" lands on the first of its groups).
  const anchorFor = (key: string) => {
    if (key === "week") return groups.find((g) => g.key === "tomorrow" || g.key === "week")?.key;
    return groups.find((g) => g.key === key)?.key;
  };

  return (
    <div className="container-fluid py-4 px-4">
      <TaskShortcuts />
      <MePageHeader title="Tasks" description="Keep track of what needs to get done. Press n for a new task, / to search." />

      <div className="task-summary" aria-label="Summary">
        {summary.map((s) => {
          const target = view === "list" ? anchorFor(s.key) : undefined;
          const body = (
            <>
              <span className="task-summary-n"><NumberFlow value={s.count} /></span>
              <span className="task-summary-l">{s.label}</span>
            </>
          );
          const cls = `task-summary-tile task-summary-tile--${s.key}${s.count === 0 ? " is-zero" : ""}`;
          return target ? (
            <a key={s.key} href={`#group-${target}`} className={cls}>
              {body}
            </a>
          ) : (
            <div key={s.key} className={cls}>
              {body}
            </div>
          );
        })}
      </div>

      <div className="card rounded shadow-sm">
        <div className="card-body">
          <TaskQuickCapture today={today} />

          <div className="task-toolbar">
            {view === "list" ? (
              <div className="btn-group" role="group" aria-label="Show">
                {STATUS_TABS.map((tab) => (
                  <Link
                    key={tab.value}
                    href={buildHref({ status: tab.value, view, q })}
                    aria-current={status === tab.value ? "true" : undefined}
                    className={`btn btn-sm ${status === tab.value ? "btn-primary" : "btn-outline-primary"}`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            ) : (
              <div />
            )}

            <Suspense fallback={null}>
              <TaskSearch />
            </Suspense>

            <div className="btn-group" role="group" aria-label="Layout">
              {VIEW_TABS.map((tab) => (
                <Link
                  key={tab.value}
                  href={buildHref({ status, view: tab.value, q })}
                  aria-current={view === tab.value ? "true" : undefined}
                  className={`btn btn-sm ${view === tab.value ? "btn-primary" : "btn-outline-primary"}`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          {q && (
            <p className="task-filter-note">
              Showing tasks matching <strong>{q}</strong> · <Link href={buildHref({ status, view })}>Clear</Link>
            </p>
          )}

          {view === "board" ? (
            <div className="mt-3">
              <TaskBoard key={enriched.map((t) => `${t.id}:${t.status}:${t.dueDate}:${t.subtasks.length}`).join("|")} tasks={enriched} today={today} />
            </div>
          ) : listed.length === 0 ? (
            <EmptyState
              icon={FiCheckSquare}
              title={q ? "No matching tasks" : status === "completed" ? "Nothing finished yet" : status === "open" ? "All clear" : "No tasks yet"}
              description={q ? "Try a different search." : status === "open" ? "Nothing open. Enjoy it, or add the next thing above." : status === "all" ? "Add your first task above." : undefined}
              className="mt-3"
            />
          ) : (
            <TaskGroups groups={groups} today={today} doneOpen={status === "completed"} />
          )}
        </div>
      </div>
    </div>
  );
}
