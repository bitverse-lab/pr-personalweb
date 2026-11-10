import { describe, expect, it } from "vitest";
import { addDaysTo, daysBetween, dueInfo, groupTasks, nextWeekday, parseQuickTask } from "./dates";

// 2026-11-10 is a Tuesday.
const today = "2026-11-10";

describe("date arithmetic", () => {
  it("counts days across a month end", () => expect(daysBetween("2026-11-30", "2026-12-02")).toBe(2));
  it("adds days", () => expect(addDaysTo(today, 21)).toBe("2026-12-01"));
  it("finds the next weekday strictly after today", () => {
    expect(nextWeekday(today, 5)).toBe("2026-11-13"); // Friday
    expect(nextWeekday(today, 2)).toBe("2026-11-17"); // Tuesday on a Tuesday = next week
  });
});

describe("dueInfo", () => {
  it.each([
    ["2026-11-03", "7d overdue", "overdue"],
    ["2026-11-09", "Yesterday", "overdue"],
    ["2026-11-10", "Today", "today"],
    ["2026-11-11", "Tomorrow", "soon"],
    ["2026-11-13", "Fri", "soon"],
    ["2026-11-20", "Nov 20", "later"],
    ["2027-01-05", "Jan 5, 2027", "later"],
  ])("%s reads %s", (due, label, tone) => {
    expect(dueInfo(due, today)).toMatchObject({ label, tone });
  });
});

describe("groupTasks", () => {
  const t = (dueDate: string | null, priority: "high" | "medium" | "low" | null = null, status = "todo") => ({ dueDate, priority, status, completedAt: null });
  it("orders groups by urgency and drops empty ones", () => {
    const groups = groupTasks([t(null), t("2026-11-20"), t("2026-11-01"), t(today), t("2026-11-11"), t("2026-11-14"), t(today, null, "done")], today);
    expect(groups.map((g) => g.key)).toEqual(["overdue", "today", "tomorrow", "week", "later", "nodate", "done"]);
  });
  it("puts higher priority first within a group", () => {
    const [group] = groupTasks([t(today, "low"), t(today, null), t(today, "high"), t(today, "medium")], today);
    expect(group.tasks.map((x) => x.priority)).toEqual(["high", "medium", "low", null]);
  });
});

describe("parseQuickTask", () => {
  it("reads date, tag and priority shorthand", () => {
    expect(parseQuickTask("Call mom tomorrow #family !high", today)).toEqual({ title: "Call mom", dueDate: "2026-11-11", priority: "high", tags: ["family"] });
  });
  it("understands weekdays and next week", () => {
    expect(parseQuickTask("Gym fri", today).dueDate).toBe("2026-11-13");
    expect(parseQuickTask("Plan sprint next week", today)).toMatchObject({ title: "Plan sprint", dueDate: "2026-11-16" });
  });
  it("does not read everyday words as weekdays", () => {
    expect(parseQuickTask("Buy sun cream", today)).toEqual({ title: "Buy sun cream", tags: [] });
    expect(parseQuickTask("Prepare for sat exam", today)).toEqual({ title: "Prepare for sat exam", tags: [] });
  });
  it("leaves ordinary words alone", () => {
    expect(parseQuickTask("Read: Designing Data-Intensive Applications ch. 7", today)).toEqual({ title: "Read: Designing Data-Intensive Applications ch. 7", tags: [] });
  });
  it("keeps the words when they would be the whole title", () => {
    expect(parseQuickTask("tomorrow", today)).toEqual({ title: "tomorrow", tags: [] });
  });
  it("returns rejected readings to the title and keeps the rest", () => {
    expect(parseQuickTask("Call mom tomorrow #family !high", today, { due: true })).toEqual({ title: "Call mom tomorrow", priority: "high", tags: ["family"] });
    expect(parseQuickTask("Fix #1 bug", today, { tags: ["1"] })).toEqual({ title: "Fix #1 bug", tags: [] });
  });
  it("only takes the first date word", () => {
    expect(parseQuickTask("Move monday meeting to friday", today)).toMatchObject({ title: "Move meeting to friday", dueDate: "2026-11-16" });
  });
});
