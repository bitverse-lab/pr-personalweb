import { expect, test } from "./support/owner";

// Checks the Health pages against the live database. Only the forgotten-workout test writes, and it
// deletes its own row.
test.skip(!!process.env.CI, "reads the live database; run locally with pnpm test:e2e");
test.describe.configure({ timeout: 120_000 });

const SLOW = { timeout: 30_000 };

test("overview shows progress rings for goals that are set", async ({ ownerPage: page }) => {
  await page.goto("/me/health");
  await expect(page.getByText("Workouts this week")).toBeVisible(SLOW);
  await expect(page.getByRole("img", { name: /% of target/ }).first()).toBeVisible();
});

test("weight entries start with the last two weeks and unfold", async ({ ownerPage: page }) => {
  await page.goto("/me/health/weight");
  const rows = page.locator("table").last().locator("tbody tr");
  await expect(rows.first()).toBeVisible(SLOW);
  const more = page.getByRole("button", { name: /Show all \d+ entries/ });
  if ((await more.count()) === 0) test.skip(true, "fewer than 15 entries: nothing to fold");
  await expect(rows).toHaveCount(14);
  await more.click();
  expect(await rows.count()).toBeGreaterThan(14);
  await expect(page.getByRole("button", { name: "Show fewer" })).toBeVisible();
});

test("workout history is grouped by week with totals, and no impossible durations", async ({ ownerPage: page }) => {
  await page.goto("/me/health/workouts");
  const weeks = page.locator(".wk-week");
  await expect(weeks.first()).toBeVisible(SLOW);
  await expect(weeks.first().locator(".wk-week-totals")).toContainText(/workouts? ·/);
  // A forgotten session must never show as days of training.
  const stats = await page.locator(".wk-row-stats").allTextContents();
  for (const text of stats) {
    const m = /(\d+) h/.exec(text);
    if (m) expect(Number(m[1])).toBeLessThanOrEqual(6);
  }
});

test("a workout left open for hours is closed at the length you give it", async ({ ownerPage: page }) => {
  const { openSql, findOwner } = await import("./support/owner-db");
  const sql = openSql();
  const owner = await findOwner(sql);
  const [exercise] = await sql`select id from exercise where user_id = ${owner.id} limit 1`;
  const [w] = await sql`
    insert into workout (user_id, date, name, started_at, status)
    values (${owner.id}, (now() - interval '10 hours')::date, ${`E2E · Forgotten ${Date.now().toString(36)}`}, now() - interval '10 hours', 'in_progress')
    returning id`;
  await sql`insert into workout_set (user_id, workout_id, exercise_id, exercise_order, set_number, reps, done) values (${owner.id}, ${w.id}, ${exercise.id}, 0, 1, 10, true)`;
  try {
    await page.goto(`/me/health/workouts/${w.id}`);
    await expect(page.getByText(/probably left running/)).toBeVisible(SLOW);
    await page.getByLabel("Minutes").fill("45");
    await page.getByRole("button", { name: "Finish with this time" }).click();
    await page.waitForURL(/\/me\/health\/workouts$/, SLOW);
    const [row] = await sql`select status, extract(epoch from ended_at - started_at)::int as secs from workout where id = ${w.id}`;
    expect(row.status).toBe("completed");
    expect(row.secs).toBe(45 * 60);
  } finally {
    await sql`delete from workout where id = ${w.id}`;
    await sql.end();
  }
});
