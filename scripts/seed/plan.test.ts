import { getTableName } from "drizzle-orm";
import { expect, test } from "vitest";
import { TABLES } from "./tables";
import { buildPrivate, emptyPrivateContext } from "./data/private";
import { buildPublic, emptyPublicContext } from "./data/public";
import { INSERT_ORDER, planInserts, toTables, withoutMedia } from "./plan";

const O = "owner-1";
const D = new Date("2026-11-09T00:00:00Z");
const pub = () => buildPublic(O, D, emptyPublicContext(), (k) => `https://cdn.test/${k}`);
const priv = () => buildPrivate(O, D, emptyPrivateContext());

test("rows already present are skipped, so a re-run inserts nothing", () => {
  const all = toTables(pub(), priv());
  const everyId = new Set(Object.values(all).flatMap((rows) => rows.map((r) => (r as { id?: string }).id).filter((x): x is string => !!x)));
  const rows = planInserts(all, everyId).flatMap((t) => t.rows);
  // only id-less join rows remain; they are inserted with ON CONFLICT DO NOTHING on their primary key
  expect(rows.every((r) => !("id" in (r as object)))).toBe(true);
});

test("parents come before children", () => {
  const order = planInserts({ project_media: [{ id: "1" }], media: [{ id: "2" }], project: [{ id: "3" }] }, new Set()).map((t) => t.table);
  expect(order).toEqual(["media", "project", "project_media"]);
  const full = INSERT_ORDER;
  for (const [parent, child] of [["calendar_event", "interview"], ["application_contact", "interview"], ["food", "meal_item"], ["meal", "meal_item"], ["exercise", "workout_set"], ["routine", "workout"], ["tag", "article_tag"], ["company", "application"]]) {
    expect(full.indexOf(parent as never)).toBeLessThan(full.indexOf(child as never));
  }
});

test("every seeded table appears in INSERT_ORDER exactly once", () => {
  expect(new Set(Object.keys(toTables(pub(), priv())))).toEqual(new Set(INSERT_ORDER));
  expect(new Set(INSERT_ORDER).size).toBe(INSERT_ORDER.length);
});

test("every table name maps to the Drizzle table of the same SQL name", () => {
  for (const name of INSERT_ORDER) expect(getTableName(TABLES[name])).toBe(name);
});

test("without storage, demo media and everything pointing at it is dropped", () => {
  const seed = withoutMedia(pub());
  expect(seed.media).toEqual([]);
  expect(seed.projectMedia).toEqual([]);
  expect(seed.projects.every((p) => p.coverMediaId === null)).toBe(true);
  expect(seed.articles.every((a) => a.coverUrl === null)).toBe(true);
  expect(seed.projects).toHaveLength(5);
});

test("media rows carry the uploaded byte size", () => {
  const all = toTables(pub(), priv(), new Map([["de5eed00-0001-4000-8000-000000000001", 1234]]));
  const m = (all.media as { id: string; sizeBytes: number }[]).find((x) => x.id === "de5eed00-0001-4000-8000-000000000001");
  expect(m?.sizeBytes).toBe(1234);
});
