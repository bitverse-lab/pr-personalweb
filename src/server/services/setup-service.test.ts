import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, expect, test, vi } from "vitest";

const rows: unknown[][] = [];
vi.mock("@/db", () => {
  // Thenable: awaiting the outer select resolves the next queued result.
  const chain: Record<string, unknown> = {
    from: () => chain,
    where: () => chain,
    then: (ok: (r: unknown[]) => unknown) => Promise.resolve(rows.shift() ?? []).then(ok),
  };
  return { db: { select: () => chain } };
});
// The real module wraps reads in React's cache(), which only Next's bundled React provides.
vi.mock("@/server/repositories/health-profile-repository", () => ({ healthProfileRepository: { find: async () => undefined } }));
vi.mock("@/server/storage/client", () => ({ isStorageConfigured: () => false }));

import { projects } from "@/db/schema";
import { demoRowsOf, setupService } from "./setup-service";

beforeEach(() => (rows.length = 0));

test("the demo probe is scoped to the owner and the demo id prefix", () => {
  const { sql, params } = new PgDialect().sqlToQuery(demoRowsOf(projects, "owner-1"));
  expect(sql).toContain('"project"."user_id" = $1');
  expect(sql).toMatch(/"project"\."id"::text like \$2/);
  expect(params).toEqual(["owner-1", "de5eed00-%"]);
});

test("hasDemoData is false when no table has demo rows", async () => {
  rows.push([{ found: false }]);
  expect(await setupService.hasDemoData("owner-1")).toBe(false);
});

test("hasDemoData is true when any table has a demo row", async () => {
  rows.push([{ found: true }]);
  expect(await setupService.hasDemoData("owner-1")).toBe(true);
});
