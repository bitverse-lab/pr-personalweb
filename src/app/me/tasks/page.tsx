import Link from "next/link";
import { Suspense } from "react";
import { FiCheckSquare } from "react-icons/fi";
import MePageHeader from "@/components/me/MePageHeader";
import EmptyState from "@/components/shared/EmptyState";
import TaskQuickCapture from "@/components/me/tasks/TaskQuickCapture";
import TaskListItem from "@/components/me/tasks/TaskListItem";
import TaskSearch from "@/components/me/tasks/TaskSearch";
import TaskShortcuts from "@/components/me/tasks/TaskShortcuts";
import TaskBoard from "@/components/me/tasks/board/TaskBoard";
import { getTasks } from "@/features/tasks/actions";
import { getSubtasksForTasks, type SubtaskDto } from "@/features/tasks/subtask-actions";

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
  const tasks = await getTasks(view === "board" ? { status: "all", q } : { status, q });
  const allSubtasks = await getSubtasksForTasks(tasks.map((task) => task.id));

  const subtasksByTask = new Map<string, SubtaskDto[]>();
  for (const subtask of allSubtasks) {
    subtasksByTask.set(subtask.taskId, [...(subtasksByTask.get(subtask.taskId) ?? []), subtask]);
  }
  const enriched = tasks.map((task) => ({ ...task, subtasks: subtasksByTask.get(task.id) ?? [] }));

  return (
    <div className="container-fluid py-4 px-4">
      <TaskShortcuts />
      <MePageHeader
        title="Tasks"
        description="Keep track of what needs to get done. Press n for a new task, / to search."
      />
      <div className="card rounded shadow-sm">
        <div className="card-body">
          <TaskQuickCapture />

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
            {view === "list" ? (
              <div className="btn-group">
                {STATUS_TABS.map((tab) => (
                  <Link
                    key={tab.value}
                    href={buildHref({ status: tab.value, view, q })}
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

            <div className="btn-group">
              {VIEW_TABS.map((tab) => (
                <Link
                  key={tab.value}
                  href={buildHref({ status, view: tab.value, q })}
                  className={`btn btn-sm ${view === tab.value ? "btn-primary" : "btn-outline-primary"}`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          {view === "board" ? (
            <div className="mt-3">
              <TaskBoard key={enriched.map((t) => `${t.id}:${t.status}:${t.subtasks.length}`).join("|")} tasks={enriched} />
            </div>
          ) : enriched.length === 0 ? (
            <EmptyState
              icon={FiCheckSquare}
              title={q ? "No matching tasks" : status === "all" ? "No tasks yet" : `No ${status} tasks`}
              description={q ? "Try a different search." : status === "all" ? "Add your first task above." : undefined}
              className="mt-3"
            />
          ) : (
            <ul className="list-unstyled mb-0 mt-3">
              {enriched.map((task) => (
                <TaskListItem key={task.id} task={task} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
