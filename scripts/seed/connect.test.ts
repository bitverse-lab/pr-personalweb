import { expect, test } from "vitest";
import { describeError } from "./connect";

test("a wrapped query error reports its cause, not the query or its parameters", () => {
  const cause = Object.assign(new Error("getaddrinfo ENOTFOUND db.example.supabase.co"), { code: "ENOTFOUND" });
  const wrapped = new Error('Failed query: select "id" from "user" where email = $1\nparams: owner@example.com', { cause });
  const text = describeError(wrapped);
  expect(text).toContain("ENOTFOUND");
  expect(text).not.toContain("owner@example.com");
  expect(text).not.toContain("select");
});

test("a plain error keeps its message; anything else gets a generic line", () => {
  expect(describeError(new Error("OWNER_EMAIL is not set"))).toBe("OWNER_EMAIL is not set");
  expect(describeError("boom")).toBe("Unexpected failure.");
});
