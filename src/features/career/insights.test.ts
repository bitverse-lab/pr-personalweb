import { describe, expect, it } from "vitest";
import { followUpDue, responseRate, shortAge, stageStart, untilLabel } from "./insights";

const now = new Date(2026, 10, 10, 9, 0);
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const app = (status: "wishlist" | "applied" | "screening" | "interview" | "offer", stageSince: Date | null, appliedAt: string | null = null) => ({
  status,
  stageSince,
  appliedAt,
  createdAt: daysAgo(60),
});

describe("stageStart", () => {
  it("uses the recorded stage change", () => expect(stageStart(app("screening", daysAgo(3)))).toEqual(daysAgo(3)));
  it("trusts the typed applied date over a later log entry", () =>
    expect(stageStart(app("applied", daysAgo(1), "2026-10-27")).toDateString()).toBe(new Date(2026, 9, 27).toDateString()));
  it("falls back to creation otherwise", () => expect(stageStart(app("screening", null))).toEqual(daysAgo(60)));
});

describe("followUpDue", () => {
  it("flags an application unanswered for two weeks", () => expect(followUpDue(app("applied", daysAgo(15)), now)).toBe(15));
  it("waits before that", () => expect(followUpDue(app("applied", daysAgo(13)), now)).toBeNull());
  it("uses a shorter wait after a screening", () => expect(followUpDue(app("screening", daysAgo(10)), now)).toBe(10));
  it("never nags about wishlist, interview or offer", () => {
    expect(followUpDue(app("wishlist", daysAgo(90)), now)).toBeNull();
    expect(followUpDue(app("interview", daysAgo(90)), now)).toBeNull();
    expect(followUpDue(app("offer", daysAgo(90)), now)).toBeNull();
  });
});

describe("responseRate", () => {
  it("counts a rejection as an answer and ignores wishlist and withdrawn", () =>
    expect(responseRate(["wishlist", "applied", "applied", "screening", "rejected", "withdrawn"])).toEqual({ answered: 2, sent: 4, percent: 50 }));
  it("has no rate before anything is sent", () => expect(responseRate(["wishlist"]).percent).toBeNull());
});

describe("labels", () => {
  it.each([[0, "today"], [5, "5d"], [21, "3w"], [90, "3mo"]])("%i days reads %s", (d, label) => expect(shortAge(d)).toBe(label));
  it("says when an interview is", () => {
    expect(untilLabel(new Date(now.getTime() + 45 * 60000), now)).toBe("in 45 min");
    expect(untilLabel(new Date(2026, 10, 11, 10), now)).toBe("tomorrow");
    expect(untilLabel(new Date(2026, 10, 14, 10), now)).toBe("in 4 days");
    expect(untilLabel(new Date(2026, 10, 30, 10), now)).toBe("Nov 30");
  });
});
