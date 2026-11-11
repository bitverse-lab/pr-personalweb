// Pure helpers for task due dates. Dates are plain "YYYY-MM-DD" strings (the column is DATE), so
// all arithmetic is done in UTC on those strings: no timezone can shift a day here.
import type { TaskPriority, TaskRecurrence } from "@/db/schema/productivity";

const DAY = 86_400_000;
const toUtc = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, day);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Whole days from `today` to `date` (negative when past). */
export function daysBetween(today: string, date: string): number {
  return Math.round((toUtc(date) - toUtc(today)) / DAY);
}

export function addDaysTo(date: string, days: number): string {
  return fromUtc(toUtc(date) + days * DAY);
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
// Short forms only where they are not also everyday words ("sun cream", "sat exam", "wed").
const WEEKDAY_SHORT: Record<string, number> = { mon: 1, tue: 2, tues: 2, thu: 4, thur: 4, thurs: 4, fri: 5 };
const weekdayOf = (date: string) => new Date(toUtc(date)).getUTCDay();

/** The next given weekday strictly after today (asking for "friday" on a Friday means next week). */
export function nextWeekday(today: string, weekday: number): string {
  const diff = (weekday - weekdayOf(today) + 7) % 7 || 7;
  return addDaysTo(today, diff);
}

export const RECURRENCES: TaskRecurrence[] = ["daily", "weekdays", "weekly", "monthly"];

/** "Every day", "Every weekday", "Every Mon", "Every month on the 15th". */
export function recurrenceLabel(rule: TaskRecurrence, due: string | null): string {
  if (rule === "daily") return "Every day";
  if (rule === "weekdays") return "Every weekday";
  if (rule === "weekly") return due ? `Every ${new Date(toUtc(due)).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}` : "Every week";
  if (!due) return "Every month";
  const d = Number(due.slice(8, 10));
  const suffix = d % 10 === 1 && d !== 11 ? "st" : d % 10 === 2 && d !== 12 ? "nd" : d % 10 === 3 && d !== 13 ? "rd" : "th";
  return `Every month on the ${d}${suffix}`;
}

/** Same day of month `months` later, clamped to the month's length (Jan 31 → Feb 28, then Mar 31). */
function addMonthsAnchored(date: string, months: number, anchorDay: number): string {
  const [y, m] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return fromUtc(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(anchorDay, last)));
}

function stepOnce(date: string, rule: TaskRecurrence, anchorDay: number): string {
  if (rule === "daily") return addDaysTo(date, 1);
  if (rule === "weekly") return addDaysTo(date, 7);
  if (rule === "monthly") return addMonthsAnchored(date, 1, anchorDay);
  let next = addDaysTo(date, 1);
  while (weekdayOf(next) === 0 || weekdayOf(next) === 6) next = addDaysTo(next, 1);
  return next;
}

/**
 * The due date of the next occurrence after one is ticked off: one step on from its due date (or
 * from today when it had none), and never in the past, so a habit missed for a week comes back
 * once, on its next day, instead of as seven overdue copies.
 */
export function nextOccurrence(due: string | null, rule: TaskRecurrence, today: string): string {
  const start = due ?? today;
  const anchor = Number(start.slice(8, 10));
  let next = stepOnce(start, rule, anchor);
  while (daysBetween(today, next) <= 0) next = stepOnce(next, rule, anchor);
  return next;
}

/** "on Fri, Nov 13" for the toast after a repeating task is ticked off. */
export function recurrenceNextLabel(due: string): string {
  return `on ${new Date(toUtc(due)).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}`;
}

export type DueTone = "overdue" | "today" | "soon" | "later";

/** How a due date reads at a glance: "3d overdue", "Today", "Tomorrow", "Fri", "Nov 20". */
export function dueInfo(due: string, today: string): { label: string; tone: DueTone; days: number } {
  const days = daysBetween(today, due);
  const date = new Date(toUtc(due));
  if (days < -1) return { label: `${-days}d overdue`, tone: "overdue", days };
  if (days === -1) return { label: "Yesterday", tone: "overdue", days };
  if (days === 0) return { label: "Today", tone: "today", days };
  if (days === 1) return { label: "Tomorrow", tone: "soon", days };
  if (days < 7) return { label: date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }), tone: "soon", days };
  const sameYear = due.slice(0, 4) === today.slice(0, 4);
  const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }), timeZone: "UTC" });
  return { label, tone: "later", days };
}

export type TaskGroupKey = "overdue" | "today" | "tomorrow" | "week" | "later" | "nodate" | "done";

export const GROUP_LABEL: Record<TaskGroupKey, string> = {
  overdue: "Overdue",
  today: "Today",
  tomorrow: "Tomorrow",
  week: "This week",
  later: "Later",
  nodate: "No date",
  done: "Done",
};

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

interface Groupable {
  dueDate: string | null;
  priority: TaskPriority | null;
  status: string;
  completedAt?: Date | null;
}

/**
 * Splits tasks into the order people plan in: what is late, what is today, what is next. Inside a
 * group, higher priority first, then the earlier date; otherwise the incoming order is kept.
 */
export function groupTasks<T extends Groupable>(tasks: T[], today: string): { key: TaskGroupKey; label: string; tasks: T[] }[] {
  const buckets: Record<TaskGroupKey, T[]> = { overdue: [], today: [], tomorrow: [], week: [], later: [], nodate: [], done: [] };
  for (const task of tasks) {
    if (task.status === "done") buckets.done.push(task);
    else if (!task.dueDate) buckets.nodate.push(task);
    else {
      const d = daysBetween(today, task.dueDate);
      buckets[d < 0 ? "overdue" : d === 0 ? "today" : d === 1 ? "tomorrow" : d < 7 ? "week" : "later"].push(task);
    }
  }
  const byPlan = (a: T, b: T) =>
    (PRIORITY_RANK[a.priority ?? "low"] + (a.priority ? 0 : 1)) - (PRIORITY_RANK[b.priority ?? "low"] + (b.priority ? 0 : 1)) ||
    (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
  for (const key of ["overdue", "today", "tomorrow", "week", "later", "nodate"] as const) buckets[key].sort(byPlan);
  // Most recently finished first.
  buckets.done.sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));

  return (Object.keys(buckets) as TaskGroupKey[]).filter((k) => buckets[k].length > 0).map((key) => ({ key, label: GROUP_LABEL[key], tasks: buckets[key] }));
}

export interface ParsedTask {
  title: string;
  dueDate?: string;
  priority?: TaskPriority;
  recurrence?: TaskRecurrence;
  tags: string[];
}

const REPEAT_WORDS: Record<string, TaskRecurrence> = { daily: "daily", weekdays: "weekdays", weekly: "weekly", monthly: "monthly" };
const EVERY_WORDS: Record<string, TaskRecurrence> = { day: "daily", weekday: "weekdays", week: "weekly", month: "monthly" };

const PRIORITY_TOKENS: Record<string, TaskPriority> = {
  "!high": "high", "!h": "high", "!1": "high", "!!!": "high",
  "!medium": "medium", "!med": "medium", "!m": "medium", "!2": "medium", "!!": "medium",
  "!low": "low", "!l": "low", "!3": "low",
};

export interface ParseIgnore {
  due?: boolean;
  priority?: boolean;
  repeat?: boolean;
  tags?: string[];
}

/**
 * Reads shorthand out of a quick-capture line: "Call mom tomorrow #family !high" becomes the title
 * "Call mom" due tomorrow, tagged family, high priority. Recognised words are removed from the
 * title; if nothing would be left, the words stay as the title. A reading the person rejected
 * (`ignore`) is not applied and its words go back into the title.
 */
export function parseQuickTask(input: string, today: string, ignore: ParseIgnore = {}): ParsedTask {
  const words = input.trim().split(/\s+/).filter(Boolean);
  const keep: string[] = [];
  const tags: string[] = [];
  let dueDate: string | undefined;
  let priority: TaskPriority | undefined;
  let recurrence: TaskRecurrence | undefined;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const lower = word.toLowerCase();
    const next = words[i + 1]?.toLowerCase();

    // Letters (incl. accented Latin), digits, _ and -; the tsconfig target predates the /u flag.
    const tag = /^#([A-Za-z0-9_\-\u00C0-\u024F]{1,30})$/.exec(word);
    if (tag && !ignore.tags?.includes(tag[1].toLowerCase())) {
      if (!tags.includes(tag[1].toLowerCase())) tags.push(tag[1].toLowerCase());
      continue;
    }
    if (PRIORITY_TOKENS[lower] && !ignore.priority) {
      priority = PRIORITY_TOKENS[lower];
      continue;
    }
    // "daily", "every day", "every weekday", "every monday" (weekly, starting that day)
    if (!recurrence && !ignore.repeat) {
      if (REPEAT_WORDS[lower]) {
        recurrence = REPEAT_WORDS[lower];
        continue;
      }
      if (lower === "every" && next) {
        const everyWd = WEEKDAYS.includes(next) ? WEEKDAYS.indexOf(next) : (WEEKDAY_SHORT[next] ?? -1);
        if (EVERY_WORDS[next]) {
          recurrence = EVERY_WORDS[next];
          i++;
          continue;
        }
        if (everyWd >= 0) {
          recurrence = "weekly";
          if (!dueDate && !ignore.due) dueDate = weekdayOf(today) === everyWd ? today : nextWeekday(today, everyWd);
          i++;
          continue;
        }
      }
    }
    if (!dueDate && !ignore.due) {
      if (lower === "today" || lower === "tod") {
        dueDate = today;
        continue;
      }
      if (lower === "tomorrow" || lower === "tmr" || lower === "tmrw") {
        dueDate = addDaysTo(today, 1);
        continue;
      }
      if (lower === "next" && next === "week") {
        dueDate = nextWeekday(today, 1);
        i++;
        continue;
      }
      const wd = WEEKDAYS.includes(lower) ? WEEKDAYS.indexOf(lower) : (WEEKDAY_SHORT[lower] ?? -1);
      if (wd >= 0) {
        dueDate = nextWeekday(today, wd);
        continue;
      }
    }
    keep.push(word);
  }

  const title = keep.join(" ");
  if (!title) return { title: input.trim(), tags: [] };
  // A repeating task needs a first date to count from; without one it starts today.
  if (recurrence && !dueDate && !ignore.due) dueDate = recurrence === "weekdays" && (weekdayOf(today) === 0 || weekdayOf(today) === 6) ? nextWeekday(today, 1) : today;
  return { title, dueDate, priority, recurrence, tags };
}
