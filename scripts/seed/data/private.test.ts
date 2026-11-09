import { expect, test } from "vitest";
import { validateDoc } from "../../../src/features/content/richtext";
import { jakartaDate } from "../dates";
import { isDemoId } from "../ids";
import { APPLICATION_STATUSES, buildPrivate, emptyPrivateContext } from "./private";
import { buildPublic, emptyPublicContext } from "./public";

const OWNER = "owner-1";
const TODAY = new Date("2026-11-09T03:00:00Z");

function rowsOf(seed: object) {
  return (Object.values(seed) as Record<string, unknown>[][]).flat();
}

test("every row is demo-marked and owned by the owner", () => {
  for (const row of rowsOf(buildPrivate(OWNER, TODAY, emptyPrivateContext()))) {
    if ("id" in row) expect(isDemoId(row.id as string)).toBe(true);
    if ("userId" in row) expect(row.userId).toBe(OWNER);
  }
});

test("volumes match the spec", () => {
  const s = buildPrivate(OWNER, TODAY, emptyPrivateContext());
  expect(s.tasks.length).toBeGreaterThanOrEqual(24);
  expect(new Set(s.tasks.map((t) => t.status))).toEqual(new Set(["todo", "in_progress", "done"]));
  expect(s.subtasks.length).toBeGreaterThan(0);
  expect(s.calendarEvents.length).toBeGreaterThanOrEqual(15);
  expect(s.companies).toHaveLength(8);
  expect(s.applications).toHaveLength(10);
  expect(s.interviews).toHaveLength(4);
  expect(s.journalEntries).toHaveLength(30);
  expect(s.weightEntries).toHaveLength(60);
  expect(s.bodyMeasurements).toHaveLength(6);
  expect(s.foods).toHaveLength(20);
  expect(s.routines).toHaveLength(4);
  expect(s.workouts).toHaveLength(12);
  expect(s.workouts.every((w) => w.status === "completed")).toBe(true);
});

test("some tasks are overdue and five were completed in the last week", () => {
  const s = buildPrivate(OWNER, TODAY, emptyPrivateContext());
  const todayIso = "2026-11-09";
  expect(s.tasks.some((t) => t.status !== "done" && t.dueDate! < todayIso)).toBe(true);
  const weekAgo = TODAY.getTime() - 7 * 86_400_000;
  expect(s.tasks.filter((t) => t.status === "done" && (t.completedAt as Date).getTime() >= weekAgo)).toHaveLength(5);
});

test("every application status is represented and each has matching history", () => {
  const s = buildPrivate(OWNER, TODAY, emptyPrivateContext());
  expect(new Set(s.applications.map((a) => a.status))).toEqual(new Set(APPLICATION_STATUSES));
  for (const a of s.applications) {
    const history = s.applicationStatusHistory.filter((h) => h.applicationId === a.id);
    expect(history.at(-1)?.toStatus).toBe(a.status);
  }
});

test("interviews reference seeded calendar events and applications", () => {
  const s = buildPrivate(OWNER, TODAY, emptyPrivateContext());
  const events = new Set(s.calendarEvents.map((e) => e.id));
  const apps = new Set(s.applications.map((a) => a.id));
  for (const i of s.interviews) {
    expect(events.has(i.calendarEventId!)).toBe(true);
    expect(apps.has(i.applicationId)).toBe(true);
  }
});

test("meal items snapshot their food's nutrition times servings", () => {
  const s = buildPrivate(OWNER, TODAY, emptyPrivateContext());
  const foods = new Map(s.foods.map((f) => [f.id, f]));
  expect(s.mealItems.length).toBeGreaterThan(40);
  for (const it of s.mealItems) {
    const f = foods.get(it.foodId!)!;
    expect(it.name).toBe(f.name);
    expect(it.calories).toBeCloseTo(f.calories * (it.servings as number), 1);
    expect(it.protein).toBeCloseTo((f.protein as number) * (it.servings as number), 1);
  }
});

test("per-day health and journal rows stop at yesterday, so today's logs are the owner's own rows", () => {
  const s = buildPrivate(OWNER, TODAY, emptyPrivateContext());
  const today = jakartaDate(TODAY, 0);
  for (const rows of [s.weightEntries, s.bodyMeasurements, s.journalEntries]) {
    expect(rows.map((r) => r.date).sort().at(-1)! < today).toBe(true);
  }
  expect(s.weightEntries.map((w) => w.date).sort().at(-1)).toBe(jakartaDate(TODAY, -1));
  expect(new Set(s.weightEntries.map((w) => w.date)).size).toBe(60);
  for (const j of s.journalEntries) expect(validateDoc(j.content)).toBeNull();
});

test("the owner's existing rows win every unique key", () => {
  const all = buildPrivate(OWNER, TODAY, emptyPrivateContext());
  const takenWeight = all.weightEntries[0].date;
  const takenJournal = all.journalEntries[0].date;
  const food = all.foods[0];
  const ctx = {
    ...emptyPrivateContext(),
    healthProfile: true,
    weightDates: new Set([takenWeight]),
    journalDates: new Set([takenJournal]),
    foodIds: new Map([[`${food.name.toLowerCase()}|${food.brand ?? ""}`, "real-food"]]),
    exerciseIds: new Map([[all.exercises[0].name.toLowerCase(), "real-exercise"]]),
    companyIds: new Map([[all.companies[0].name.toLowerCase(), "real-company"]]),
  };
  const s = buildPrivate(OWNER, TODAY, ctx);
  expect(s.healthProfiles).toHaveLength(0);
  expect(s.weightEntries.map((w) => w.date)).not.toContain(takenWeight);
  expect(s.journalEntries.map((j) => j.date)).not.toContain(takenJournal);
  expect(s.foods.map((f) => f.name)).not.toContain(food.name);
  expect(s.mealItems.some((m) => m.foodId === "real-food")).toBe(true);
  expect(s.workoutSets.some((w) => w.exerciseId === "real-exercise")).toBe(true);
  expect(s.applications.some((a) => a.companyId === "real-company")).toBe(true);
  expect(s.companies).toHaveLength(7);
});

test("no two demo rows share an id, across both builders", () => {
  const pub = buildPublic(OWNER, TODAY, emptyPublicContext(), (k) => k);
  const ids = [...rowsOf(buildPrivate(OWNER, TODAY, emptyPrivateContext())), ...rowsOf(pub).map((r) => (r.row as Record<string, unknown>) ?? r)]
    .map((r) => r.id)
    .filter(Boolean);
  expect(new Set(ids).size).toBe(ids.length);
});

test("a health profile is created only when the owner has none", () => {
  expect(buildPrivate(OWNER, TODAY, emptyPrivateContext()).healthProfiles).toHaveLength(1);
});
