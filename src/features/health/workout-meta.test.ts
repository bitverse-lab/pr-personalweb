import { describe, expect, it } from "vitest";
import { fmtMinutes, groupByWeek, sessionMinutes, weekStartOf } from "./workout-meta";

const at = (min: number) => new Date(Date.UTC(2026, 10, 10, 9, 0) + min * 60_000);

describe("sessionMinutes", () => {
  it("measures a normal session", () => expect(sessionMinutes(at(0), at(65))).toBe(65));
  it("is unknown while unfinished", () => expect(sessionMinutes(at(0), null)).toBeNull());
  it("is unknown for a session left open for weeks", () => expect(sessionMinutes(at(0), at(45_366))).toBeNull());
  it("never reports zero", () => expect(sessionMinutes(at(0), at(0))).toBe(1));
});

describe("fmtMinutes", () => {
  it.each([[45, "45 min"], [65, "1 h 5 min"], [120, "2 h"]])("%i reads %s", (m, s) => expect(fmtMinutes(m)).toBe(s));
});

describe("weeks", () => {
  it("starts weeks on Monday", () => {
    expect(weekStartOf("2026-11-08")).toBe("2026-11-02"); // Sunday belongs to the week before
    expect(weekStartOf("2026-11-09")).toBe("2026-11-09"); // Monday starts its own
  });
  it("groups newest week first", () => {
    const groups = groupByWeek([{ date: "2026-11-08" }, { date: "2026-11-04" }, { date: "2026-10-30" }]);
    expect(groups.map((g) => [g.weekStart, g.items.length])).toEqual([["2026-11-02", 2], ["2026-10-26", 1]]);
  });
});
