import { describe, expect, it } from "vitest";
import { addDays, dayKey, formatWhen, localIso, relativeStart } from "./format";

// Dates are built with the local constructor so the tests hold in any timezone.
const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m);

describe("relativeStart", () => {
  const now = at(10, 9, 0);
  it("says now while the event is running", () => expect(relativeStart(at(10, 8, 30), at(10, 9, 30), now)).toBe("now"));
  it("counts minutes under an hour", () => expect(relativeStart(at(10, 9, 25), at(10, 10), now)).toBe("in 25 min"));
  it("counts hours and minutes later today", () => expect(relativeStart(at(10, 11, 10), at(10, 12), now)).toBe("in 2 h 10 min"));
  it("drops zero minutes", () => expect(relativeStart(at(10, 12), at(10, 13), now)).toBe("in 3 h"));
  it("names tomorrow", () => expect(relativeStart(at(11, 9), at(11, 10), now)).toBe("tomorrow at 9:00 AM"));
  it("names the weekday within a week", () => expect(relativeStart(at(13, 18), at(13, 19), now)).toBe("Fri at 6:00 PM"));
  it("falls back to a date beyond a week", () => expect(relativeStart(at(20, 9), at(20, 10), now)).toBe("Nov 20"));
  it("reports a past event as ended", () => expect(relativeStart(at(10, 7), at(10, 8), now)).toBe("ended"));
});

describe("formatWhen", () => {
  it("formats a timed event on one day", () => expect(formatWhen(at(10, 9), at(10, 10), false)).toBe("Tue, Nov 10 · 9:00 AM – 10:00 AM"));
  it("formats a one-day all-day event (exclusive end)", () => expect(formatWhen(at(10, 0), at(11, 0), true)).toBe("Tue, Nov 10 · All day"));
  it("formats a multi-day all-day event", () => expect(formatWhen(at(10, 0), at(13, 0), true)).toBe("Tue, Nov 10 – Thu, Nov 12"));
  it("formats a timed event across midnight", () => expect(formatWhen(at(10, 22), at(11, 1), false)).toBe("Tue, Nov 10 10:00 PM – Wed, Nov 11 1:00 AM"));
});

describe("dayKey / localIso / addDays", () => {
  it("uses the local day", () => expect(dayKey(at(10, 23, 59))).toBe("2026-11-10"));
  it("keeps local wall time and an offset", () => expect(localIso(at(10, 9, 5))).toMatch(/^2026-11-10T09:05:00[+-]\d{2}:\d{2}$/));
  it("crosses month ends", () => expect(dayKey(addDays(at(30, 12), 1))).toBe("2026-12-01"));
});
