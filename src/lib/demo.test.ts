import { expect, test } from "vitest";
import { DEMO_KEY_PREFIX, DEMO_PREFIX, isDemoId } from "./demo";

test("demo prefixes are fixed", () => {
  expect(DEMO_PREFIX).toBe("de5eed00-");
  expect(DEMO_KEY_PREFIX).toBe("de5eed00/");
});

test("isDemoId recognises only demo-prefixed ids", () => {
  expect(isDemoId("de5eed00-0001-4000-8000-000000000001")).toBe(true);
  expect(isDemoId("6f1c2a3b-0000-4000-8000-000000000001")).toBe(false);
  expect(isDemoId("DE5EED00-0001-4000-8000-000000000001")).toBe(false);
});
