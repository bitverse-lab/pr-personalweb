import { expect, test } from "vitest";
import { highlightSchema, reorderSchema } from "./schema";

test("a highlight has a short machine key, a display value and an optional plain note", () => {
  expect(highlightSchema.safeParse({ metric: "gpa", value: "3.92 /4.00", note: "Summa Cum Laude" }).success).toBe(true);
  expect(highlightSchema.safeParse({ metric: "ip_rights", value: "6 HKI" }).data).toEqual({ metric: "ip_rights", value: "6 HKI", note: null });
});

test("the metric key is lower-case snake case, so it reads like a column in the hero query", () => {
  expect(highlightSchema.safeParse({ metric: "GPA!", value: "3.92" }).success).toBe(false);
  expect(highlightSchema.safeParse({ metric: "team led", value: "3" }).success).toBe(false);
});

test("value is required and short; note is capped", () => {
  expect(highlightSchema.safeParse({ metric: "gpa", value: "" }).success).toBe(false);
  expect(highlightSchema.safeParse({ metric: "gpa", value: "x".repeat(61) }).success).toBe(false);
  expect(highlightSchema.safeParse({ metric: "gpa", value: "3.92", note: "x".repeat(141) }).success).toBe(false);
});

test("highlights can be reordered like the other profile lists", () => {
  expect(reorderSchema.safeParse({ kind: "highlights", ids: [] }).success).toBe(true);
});
