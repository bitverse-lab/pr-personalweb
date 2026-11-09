import { getTableColumns } from "drizzle-orm";
import { expect, test } from "vitest";
import { buildPrivate, emptyPrivateContext } from "./data/private";
import { TABLES } from "./tables";
import { deleteStatements, foreignKeyEdges, guardQueries } from "./guard";
import { INSERT_ORDER } from "./plan";

test("edges include the cascades that could hurt real data", () => {
  const e = foreignKeyEdges().map((x) => `${x.child}.${x.column}->${x.parent}`);
  expect(e).toContain("application.company_id->company");
  expect(e).toContain("project.cover_media_id->media");
  expect(e).toContain("profile.photo_media_id->media");
  expect(e).toContain("interview.calendar_event_id->calendar_event");
  expect(e).toContain("article_tag.tag_id->tag");
  expect(e.some((x) => x.endsWith("->user"))).toBe(false);
});

test("guard SQL targets real children of demo parents", () => {
  const q = guardQueries([{ child: "application", column: "company_id", parent: "company", childHasId: true, siblings: [] }])[0].sql;
  expect(q).toContain(`"application"."id"::text NOT LIKE 'de5eed00-%'`);
  expect(q).toContain(`"application"."company_id"::text LIKE 'de5eed00-%'`);
});

test("for a join table without ids, a link is real when its other side is real", () => {
  const q = guardQueries([{ child: "article_tag", column: "tag_id", parent: "tag", childHasId: false, siblings: ["article_id"] }])[0].sql;
  expect(q).toContain(`"article_tag"."tag_id"::text LIKE 'de5eed00-%'`);
  expect(q).toContain(`"article_tag"."article_id"::text NOT LIKE 'de5eed00-%'`);
});

test("a demo article linked to one of the owner's tags does not block clean", () => {
  // the seed reuses existing tags, so these links are expected; deleting them loses nothing real
  const articleSide = foreignKeyEdges().filter((e) => e.child === "article_tag" && e.column === "article_id");
  expect(articleSide).toEqual([]);
  const tagSide = guardQueries(foreignKeyEdges().filter((e) => e.child === "article_tag" && e.column === "tag_id"));
  expect(tagSide).toHaveLength(1);
  expect(tagSide[0].sql).toContain(`"article_tag"."article_id"::text NOT LIKE 'de5eed00-%'`);
});

test("rows the owner has edited since seeding are kept, not deleted", () => {
  // the app upserts journal days into the existing (demo) row
  const where = deleteStatements("owner-1").find((s) => s.table === "journal_entry")!.where;
  expect(where).toContain(`"updated_at" <= "created_at"`);
});

test("every column a delete statement references exists on its table", () => {
  for (const s of deleteStatements("owner-1")) {
    const cols = new Set(Object.values(getTableColumns(TABLES[s.table])).map((c) => c.name));
    for (const [, col] of Array.from(s.where.matchAll(/"([a-z_]+)"/g))) expect(cols, `${s.table}.${col}`).toContain(col);
  }
});

test("the seed never creates a health profile; the owner's goals are theirs to set", () => {
  expect(buildPrivate("owner-1", new Date("2026-11-09T00:00:00Z"), emptyPrivateContext()).healthProfiles).toEqual([]);
});

test("deletes run children first and only touch demo rows of the owner", () => {
  const stmts = deleteStatements("owner-1");
  const order = stmts.map((s) => s.table);
  expect(order).toEqual([...INSERT_ORDER].reverse());
  const project = stmts.find((s) => s.table === "project")!.sql;
  expect(project).toContain(`"id"::text LIKE 'de5eed00-%'`);
  expect(project).toContain(`"user_id" = 'owner-1'`);
  expect(stmts.find((s) => s.table === "article_tag")!.sql).toContain(`"article_id"::text LIKE 'de5eed00-%'`);
});

test("every seeded table with an id is scoped by user_id", () => {
  for (const name of INSERT_ORDER) {
    const cols = Object.values(getTableColumns(TABLES[name])).map((c) => c.name);
    if (cols.includes("id")) expect(cols, name).toContain("user_id");
  }
});

test("an owner id with a quote cannot break out of the statement", () => {
  expect(() => deleteStatements("x' or '1'='1")).toThrow();
});
