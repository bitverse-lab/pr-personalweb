import { expect, test } from "vitest";
import { jakartaDate, utcDaysFrom } from "./dates";

test("jakartaDate crosses the day boundary before UTC does", () => {
  expect(jakartaDate(new Date("2026-11-09T18:30:00Z"), 0)).toBe("2026-11-10");
  expect(jakartaDate(new Date("2026-11-09T10:00:00Z"), -1)).toBe("2026-11-08");
});

test("utcDaysFrom returns UTC midnight offset by whole days", () => {
  expect(utcDaysFrom(new Date("2026-11-09T18:30:00Z"), -1).toISOString()).toBe("2026-11-08T00:00:00.000Z");
  expect(utcDaysFrom(new Date("2026-11-09T00:00:00Z"), 21).toISOString()).toBe("2026-11-30T00:00:00.000Z");
});
