import { describe, expect, it } from "vitest";
import { nextOccurrence, parseQuickTask, recurrenceLabel } from "./dates";

// 2026-11-10 is a Tuesday.
const TODAY = "2026-11-10";

describe("nextOccurrence", () => {
  it("steps one period on from the due date", () => {
    expect(nextOccurrence("2026-11-10", "daily", TODAY)).toBe("2026-11-11");
    expect(nextOccurrence("2026-11-10", "weekly", TODAY)).toBe("2026-11-17");
    expect(nextOccurrence("2026-11-10", "monthly", TODAY)).toBe("2026-12-10");
  });

  it("finished early: counts from the due date, not from today", () => {
    expect(nextOccurrence("2026-11-12", "daily", TODAY)).toBe("2026-11-13");
  });

  it("missed for a while: comes back once, on its next day after today, keeping the weekday", () => {
    expect(nextOccurrence("2026-11-01", "daily", TODAY)).toBe("2026-11-11");
    expect(nextOccurrence("2026-10-26", "weekly", TODAY)).toBe("2026-11-16"); // Mondays
  });

  it("weekdays skip the weekend", () => {
    expect(nextOccurrence("2026-11-13", "weekdays", "2026-11-13")).toBe("2026-11-16"); // Fri -> Mon
  });

  it("monthly keeps the day, clamped in short months", () => {
    expect(nextOccurrence("2027-01-31", "monthly", "2027-01-31")).toBe("2027-02-28");
  });

  it("without a due date, starts from today", () => {
    expect(nextOccurrence(null, "daily", TODAY)).toBe("2026-11-11");
  });
});

describe("parseQuickTask repeats", () => {
  it("reads daily and starts today", () => {
    expect(parseQuickTask("Stretch daily", TODAY)).toMatchObject({ title: "Stretch", recurrence: "daily", dueDate: TODAY });
  });

  it("reads every <weekday> as weekly from that day", () => {
    expect(parseQuickTask("Team sync every fri", TODAY)).toMatchObject({ title: "Team sync", recurrence: "weekly", dueDate: "2026-11-13" });
    expect(parseQuickTask("Plan week every tuesday", TODAY)).toMatchObject({ recurrence: "weekly", dueDate: TODAY });
  });

  it("reads every month and keeps an explicit date", () => {
    expect(parseQuickTask("Pay rent every month tomorrow", TODAY)).toMatchObject({ title: "Pay rent", recurrence: "monthly", dueDate: "2026-11-11" });
  });

  it("a rejected reading stays in the title", () => {
    expect(parseQuickTask("Weekly review", TODAY, { repeat: true })).toMatchObject({ title: "Weekly review", recurrence: undefined });
  });
});

describe("recurrenceLabel", () => {
  it("names the rule plainly", () => {
    expect(recurrenceLabel("weekly", "2026-11-13")).toBe("Every Fri");
    expect(recurrenceLabel("monthly", "2026-11-01")).toBe("Every month on the 1st");
    expect(recurrenceLabel("weekdays", null)).toBe("Every weekday");
  });
});
