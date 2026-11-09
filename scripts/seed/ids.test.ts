import { expect, test } from "vitest";
import { demoId, isDemoId } from "./ids";

test("demo ids are valid, prefixed, deterministic and unique across domains", () => {
  expect(demoId("project", 1)).toMatch(/^de5eed00-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(demoId("project", 1)).toBe(demoId("project", 1));
  expect(demoId("project", 1)).not.toBe(demoId("article", 1));
  expect(demoId("project", 1)).not.toBe(demoId("project", 2));
  expect(isDemoId(demoId("task", 99))).toBe(true);
});

test("a negative or fractional counter is a programming error", () => {
  expect(() => demoId("task", -1)).toThrow();
  expect(() => demoId("task", 1.5)).toThrow();
});
