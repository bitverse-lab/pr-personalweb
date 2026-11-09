# Admin ↔ Public Sync and Demo Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the workspace→public sync gaps, prove the sync with E2E tests that mutate through `/me`, and add a removable demo dataset covering every domain.

**Architecture:** Sync fixes live in the existing cache helper and actions. Demo data is a standalone `tsx` script (`scripts/seed/`) that talks to Postgres directly through the Drizzle schema, marks every row with a fixed UUID prefix, uploads generated PNG placeholders to Supabase storage, and has a matching clean command guarded against cascades into real rows. E2E signs in by minting an Auth.js JWT cookie locally.

**Tech Stack:** Next.js 14.2.35, Drizzle 0.45 + postgres-js, next-auth v5 beta (JWT), Supabase storage, Vitest, Playwright, `tsx` (new dev dependency).

**Spec:** `docs/superpowers/specs/2026-11-09-admin-public-sync-and-demo-data-design.md`

## Global Constraints

- No schema change. `db:push` is not run by this plan.
- Demo id prefix is exactly `de5eed00-`; demo storage key prefix is exactly `de5eed00/`.
- Seed is insert-only (`onConflictDoNothing`); it never updates or deletes an existing row and never creates a `profile` row.
- Owner = `user` row whose email equals `OWNER_EMAIL`; missing → exit non-zero before any write.
- Both seed commands print the database **host only** (never the URL or credentials) and per-table counts, and write only with `--yes` or an interactive `yes`.
- Health dates use `Asia/Jakarta`; tasks and calendar use UTC.
- Rich text must pass `validateDoc` (`src/features/content/richtext.ts`). Never raw HTML.
- Demo images are text-free abstract PNGs in Fronter colours (`#2a52c3`, `#5a6d90`, `#1cb59f`, `#fa693e`, `#3c4858`, `#f8f9fc`); no generated profile photos.
- E2E test records: title prefix `E2E · `, slug prefix `e2e-`; sync spec skipped when `CI` is set; auth fixture refuses non-localhost `baseURL`.
- Every repository query keeps filtering by `userId` (CLAUDE.md).
- **Spec adjustment (E2E profile test):** the test adds and removes an `E2E · ` experience instead of editing the headline, so a failed run can never leave the owner's real headline changed.
- **Spec correction:** the app has no soft-delete column ("trash" is hard delete + undo snapshot), so "1 article in trash" becomes 1 `archived` article, and "1 message in trash" is dropped.
- **Commits:** the working tree on `main` holds the owner's uncommitted work. Before Task 1, ask the owner to commit or stash it, then create branch `feat/sync-and-demo-data`. Each "Commit" step stages only the files that task lists.

## Review Focus

1. Running `pnpm db:seed --yes` twice → second run inserts 0 rows and uploads 0 new objects (Task 6 test: plan is computed from ids already present).
2. A real row referencing a demo row (real application → demo company, real project cover → demo media) → `seed:clean` aborts and lists it, deleting nothing (Task 7 test).
3. `OWNER_EMAIL` unset or no matching user → seed and clean exit 1 with a clear message, no write, no upload (Task 6 test).
4. Seed fails halfway (DB error after uploads) → DB insert is one transaction and rolls back; orphan storage objects are still removed by `seed:clean` because it sweeps the `de5eed00/` prefix independent of rows (Task 7 test).
5. An E2E test dies after publishing → `globalTeardown` deletes every owner row whose title starts `E2E · ` or slug starts `e2e-` across projects, articles, testimonials, experiences (Task 9 test).

---

### Task 1: Sync fixes

**Files:**
- Modify: `src/lib/data/site-cache.ts` (`revalidateSiteData`)
- Modify: `src/features/content/article-actions.ts` (`revalidateArticles`: drop its `/feed.xml` and `/sitemap.xml` lines)
- Modify: `src/features/testimonials/actions.ts` (`revalidateTestimonials`)
- Modify: `src/lib/data/testimonials.ts` (`getPublishedTestimonials`)
- Test: `src/lib/data/site-cache.test.ts`, `src/lib/data/testimonials.test.ts`

**Interfaces:**
- Produces: `revalidateSiteData(): void` now also revalidates `/sitemap.xml` and `/feed.xml`.

- [ ] **Step 1: Write the failing tests**

```ts
// site-cache.test.ts — vi.mock("next/cache") with revalidateTag/revalidatePath spies
test("revalidateSiteData refreshes tag, layout, sitemap and feed", () => {
  revalidateSiteData();
  expect(revalidateTag).toHaveBeenCalledWith(SITE_TAG);
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
  expect(revalidatePath).toHaveBeenCalledWith("/feed.xml");
});
// testimonials.test.ts — mock article/testimonial repositories and report-error
test("a database failure is reported, not swallowed", async () => {
  testimonialRepository.listPublished.mockRejectedValue(new Error("down"));
  expect(await getPublishedTestimonials()).toEqual([]);
  expect(reportError).toHaveBeenCalledWith("public-read", expect.any(Error));
});
```

- [ ] **Step 2: Run** `pnpm test src/lib/data` → both FAIL.
- [ ] **Step 3: Implement.** Add the two `revalidatePath` calls to `revalidateSiteData`. Remove the two now-duplicate lines from `revalidateArticles`. Make `revalidateTestimonials` call `revalidateSiteData()` plus `revalidatePath("/me/testimonials")`. Wrap the body of `getPublishedTestimonials` in `publicRead("testimonials", …, [])` instead of its own `try/catch`.
- [ ] **Step 4: Run** `pnpm test src/lib/data` → PASS; `pnpm typecheck` → no errors.
- [ ] **Step 5: Commit** `fix: refresh sitemap/feed on every public change; testimonials use site cache helper`.

---

### Task 2: Seed toolchain, ids and dates

**Files:**
- Modify: `package.json` (devDependency `tsx`; scripts `"db:seed": "tsx scripts/seed/seed.ts"`, `"db:seed:clean": "tsx scripts/seed/clean.ts"`)
- Modify: `vitest.config.ts` (`include: ["src/**/*.test.ts", "scripts/**/*.test.ts"]`)
- Create: `src/lib/demo.ts` (pure, no imports: the one source of the prefix for app and scripts)
- Create: `scripts/seed/ids.ts`, `scripts/seed/dates.ts`, `scripts/seed/connect.ts`
- Test: `src/lib/demo.test.ts` (`isDemoId`), `scripts/seed/ids.test.ts` (`demoId`), `scripts/seed/dates.test.ts`

**Interfaces:**
- Produces:
  - In `src/lib/demo.ts`: `DEMO_PREFIX = "de5eed00-"`, `DEMO_KEY_PREFIX = "de5eed00/"`, `isDemoId(id: string): boolean`
  - In `scripts/seed/ids.ts` (re-exports the above):
  - `demoId(domain: DemoDomain, n: number): string` — deterministic, valid UUID, unique across domains. `DemoDomain` is a string union of every seeded table name.
  - `utcDaysFrom(today: Date, offset: number): Date` (midnight UTC)
  - `jakartaDate(today: Date, offset: number): string` (`YYYY-MM-DD` in `Asia/Jakarta`)
  - `openDatabase(): { db: PostgresJsDatabase<typeof schema>; host: string; close(): Promise<void> }` — loads `.env.local` with `dotenv`, prefers `DIRECT_URL` else `DATABASE_URL`, `prepare: false`; `host` parsed with `new URL`.
  - `confirm(question: string, argv: string[]): Promise<boolean>` — true if `--yes` in argv, else reads one line from stdin.

- [ ] **Step 1: Write the failing tests**

```ts
test("demo ids are valid, prefixed, deterministic and unique across domains", () => {
  expect(demoId("project", 1)).toMatch(/^de5eed00-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(demoId("project", 1)).toBe(demoId("project", 1));
  expect(demoId("project", 1)).not.toBe(demoId("article", 1));
  expect(isDemoId(demoId("task", 99))).toBe(true);
  expect(isDemoId("6f1c2a3b-0000-4000-8000-000000000001")).toBe(false);
});
test("jakartaDate crosses the day boundary before UTC does", () => {
  expect(jakartaDate(new Date("2026-11-09T18:30:00Z"), 0)).toBe("2026-11-10");
  expect(utcDaysFrom(new Date("2026-11-09T18:30:00Z"), -1).toISOString()).toBe("2026-11-08T00:00:00.000Z");
});
```

- [ ] **Step 2: Run** `pnpm test scripts/seed` → FAIL (modules missing).
- [ ] **Step 3: Implement** the four modules. `demoId` encodes the domain as a fixed 4-hex code from a lookup table in segment 2 and `n` in the last segment. `jakartaDate` uses `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" })`. Install with `pnpm add -D tsx`.
- [ ] **Step 4: Run** `pnpm test scripts/seed` → PASS; `pnpm exec tsx --version` prints a version.
- [ ] **Step 5: Commit** `chore(seed): add tsx, demo id and date helpers`.

---

### Task 3: Placeholder PNG generator

**Files:**
- Create: `scripts/seed/png.ts`
- Test: `scripts/seed/png.test.ts`

**Interfaces:**
- Consumes: `sniffMime`, `kindOfMime`, `MAX_IMAGE_BYTES` from `src/features/media/rules.ts`.
- Produces: `placeholderPng(opts: { width: number; height: number; seed: number }): Uint8Array` — deterministic per `seed`, RGB 8-bit, filter 0 rows, `zlib.deflateSync`, CRC32 per chunk; a diagonal two-tone gradient plus 2–4 translucent bands, colours picked from the Global Constraints palette by `seed`.

- [ ] **Step 1: Write the failing test**

```ts
test("placeholder passes the app's own upload rules", () => {
  const png = placeholderPng({ width: 1600, height: 1000, seed: 3 });
  expect(sniffMime(png)).toBe("image/png");
  expect(kindOfMime("image/png")).toBe("image");
  expect(png.byteLength).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
  expect(Buffer.from(png).equals(Buffer.from(placeholderPng({ width: 1600, height: 1000, seed: 3 })))).toBe(true);
  expect(Buffer.from(png).equals(Buffer.from(placeholderPng({ width: 1600, height: 1000, seed: 4 })))).toBe(false);
});
test("dimensions are written to IHDR", () => {
  const v = new DataView(placeholderPng({ width: 1600, height: 900, seed: 1 }).buffer);
  expect([v.getUint32(16), v.getUint32(20)]).toEqual([1600, 900]);
});
```

- [ ] **Step 2: Run** `pnpm test scripts/seed/png` → FAIL.
- [ ] **Step 3: Implement** `placeholderPng`. If `sniffMime` does not accept PNG, stop and report (the spec assumes it does).
- [ ] **Step 4: Run** `pnpm test scripts/seed/png` → PASS.
- [ ] **Step 5: Commit** `feat(seed): deterministic placeholder PNG generator`.

---

### Task 4: Public demo content builders

**Files:**
- Create: `scripts/seed/data/public.ts`
- Test: `scripts/seed/data/public.test.ts`

**Interfaces:**
- Consumes: `demoId`, `isDemoId`, `utcDaysFrom` (Task 2); `validateDoc` from `src/features/content/richtext.ts`; table types from `src/db/schema`.
- Produces: `buildPublic(ownerId: string, today: Date): PublicSeed` where
  `PublicSeed = { media: MediaSeed[]; experiences; educations; skills; socialLinks; projects; projectLinks; projectMedia; tags; articles; articleTags; testimonials; contactMessages }`,
  each a `typeof table.$inferInsert[]`, and `MediaSeed = { row: typeof media.$inferInsert; png: { width; height; seed } }`.
  Counts (spec): experience 4, education 2, skills 18 (categories data / api / ui / ml / ops), social links 2 (GitHub, LinkedIn); projects 5 (3 published with 1 featured, 1 draft, 1 archived), project covers 5 + 2 gallery images on the featured project; articles 6 (4 published spread over the last 90 days, 1 draft, 1 archived) each published one with a cover; testimonials 5 (4 published); contact messages 6 (3 read). English copy, Indonesian context. Media `storageKey` = `de5eed00/<mediaId>.png`, bucket `public-media`, status `ready`, `purpose` matching how the app sets it for covers.
  `position` values start after the owner's existing max — the builder takes `startPositions: Partial<Record<"experience"|"education"|"skill"|"socialLink"|"project"|"testimonial", number>>` as a third argument.

- [ ] **Step 1: Write the failing tests**

```ts
const seed = buildPublic(OWNER, new Date("2026-11-09T00:00:00Z"), { experience: 2 });
test("every row is demo-marked and owned by the owner", () => {
  for (const rows of Object.values(seed)) for (const r of rows as any[]) {
    const row = "row" in r ? r.row : r;
    if ("id" in row) expect(isDemoId(row.id)).toBe(true);
    if ("userId" in row) expect(row.userId).toBe(OWNER);
  }
});
test("counts and statuses match the spec", () => {
  expect(seed.projects.map((p) => p.status).sort()).toEqual(["archived", "draft", "published", "published", "published"]);
  expect(seed.projects.filter((p) => p.featured)).toHaveLength(1);
  expect(seed.articles.filter((a) => a.status === "published")).toHaveLength(4);
  expect(seed.testimonials.filter((t) => t.published)).toHaveLength(4);
  expect(seed.experiences[0].position).toBe(3);
});
test("rich text is valid and every cover points at a seeded media row", () => {
  for (const d of [...seed.projects, ...seed.articles]) expect(validateDoc(d.content).ok).toBe(true);
  const ids = new Set(seed.media.map((m) => m.row.id));
  for (const p of seed.projects) expect(ids.has(p.coverMediaId!)).toBe(true);
  expect(seed.media.every((m) => m.row.storageKey!.startsWith("de5eed00/"))).toBe(true);
});
```

- [ ] **Step 2: Run** `pnpm test scripts/seed/data/public` → FAIL.
- [ ] **Step 3: Implement** `buildPublic`. Match `validateDoc`'s real return shape (read it first; adjust `.ok` in the test if it differs). Fill `plainText` for articles and projects the way the services do.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(seed): public demo content`.

---

### Task 5: Private demo content builders

**Files:**
- Create: `scripts/seed/data/private.ts`
- Test: `scripts/seed/data/private.test.ts`

**Interfaces:**
- Consumes: Task 2 helpers.
- Produces: `buildPrivate(ownerId: string, today: Date, has: { healthProfile: boolean }): PrivateSeed` with tasks (~25: all three statuses, some overdue, 5 done in the last 7 days) + subtasks; calendar events (~15, −21…+21 days, UTC); companies 8, applications 10 covering every `ApplicationStatus`, status history, contacts, timeline events, interviews 4 each with a `calendarEventId` from this seed; journal entries 30 of the last 35 days (Jakarta dates) with mood; health profile only when `has.healthProfile` is false; weight 60 days; body measurements 6; foods 20; meals over 21 days with meal items; water entries; routines 4 with routine exercises; exercises it needs (custom, demo ids); workouts 12 `completed` with sets.

- [ ] **Step 1: Write the failing tests**

```ts
const s = buildPrivate(OWNER, new Date("2026-11-09T00:00:00Z"), { healthProfile: true });
test("every application status is represented", () => {
  expect(new Set(s.applications.map((a) => a.status))).toEqual(new Set(APPLICATION_STATUSES));
});
test("interviews reference seeded calendar events", () => {
  const ev = new Set(s.calendarEvents.map((e) => e.id));
  expect(s.interviews.every((i) => ev.has(i.calendarEventId!))).toBe(true);
});
test("meal items snapshot their food's nutrition times servings", () => {
  const foods = new Map(s.foods.map((f) => [f.id, f]));
  for (const it of s.mealItems) {
    const f = foods.get(it.foodId!)!;
    expect(it.calories).toBeCloseTo(f.calories * it.servings, 5);
    expect(it.name).toBe(f.name);
  }
});
test("an existing health profile is left alone", () => {
  expect(s.healthProfiles).toHaveLength(0);
  expect(buildPrivate(OWNER, new Date(), { healthProfile: false }).healthProfiles).toHaveLength(1);
});
```

- [ ] **Step 2: Run** `pnpm test scripts/seed/data/private` → FAIL.
- [ ] **Step 3: Implement** `buildPrivate`. `APPLICATION_STATUSES` is the list of `ApplicationStatus` values from `src/db/schema/career.ts`; export it from `private.ts` if the schema only has the type. Match the column types for numeric nutrition fields (string vs number) exactly as the schema declares.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(seed): private workspace demo content`.

---

### Task 6: `pnpm db:seed`

**Files:**
- Create: `scripts/seed/seed.ts`, `scripts/seed/plan.ts`, `scripts/seed/storage.ts`
- Test: `scripts/seed/plan.test.ts`

**Interfaces:**
- Consumes: Tasks 2–5.
- Produces:
  - `planInserts(all: Record<string, { id?: string }[]>, existingIds: Set<string>): { table: string; rows: unknown[] }[]` — drops rows whose id already exists; returns tables in FK-safe insert order (fixed array `INSERT_ORDER` in `plan.ts`).
  - `uploadPlaceholders(items: MediaSeed[], existingKeys: Set<string>): Promise<number>` — uses `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` with `@supabase/supabase-js`, `upsert: false`, `contentType: "image/png"`; skips keys already present; returns uploaded count.
  - `seed.ts` main: open DB → find owner by `OWNER_EMAIL` (exit 1 if unset/missing) → read owner start positions and `healthProfile` existence → build → read existing demo ids → `planInserts` → print host + per-table counts → `confirm` → upload → one `db.transaction` inserting in order with `onConflictDoNothing()` → print totals. Storage not configured → skip media rows and covers, print a warning.

- [ ] **Step 1: Write the failing tests**

```ts
test("rows already present are skipped, so a re-run inserts nothing", () => {
  const all = { project: [{ id: "a" }, { id: "b" }], task: [{ id: "c" }] };
  expect(planInserts(all, new Set(["a", "b", "c"])).flatMap((t) => t.rows)).toEqual([]);
});
test("parents come before children", () => {
  const order = planInserts({ project_media: [{ id: "1" }], media: [{ id: "2" }], project: [{ id: "3" }] }, new Set()).map((t) => t.table);
  expect(order.indexOf("media")).toBeLessThan(order.indexOf("project"));
  expect(order.indexOf("project")).toBeLessThan(order.indexOf("project_media"));
});
test("every seeded table appears in INSERT_ORDER", () => {
  expect(new Set(INSERT_ORDER)).toEqual(new Set([...Object.keys(buildPublic(O, D, {})), ...Object.keys(buildPrivate(O, D, { healthProfile: true }))].map(toTableName)));
});
```

- [ ] **Step 2: Run** `pnpm test scripts/seed/plan` → FAIL.
- [ ] **Step 3: Implement** the three files. `toTableName` maps builder keys to SQL table names; keep it next to `INSERT_ORDER`.
- [ ] **Step 4: Run** → PASS. Then `OWNER_EMAIL= pnpm db:seed` → exits 1 with "OWNER_EMAIL is not set", nothing printed about tables.
- [ ] **Step 5: Commit** `feat(seed): db:seed command`.

---

### Task 7: `pnpm db:seed:clean`

**Files:**
- Create: `scripts/seed/clean.ts`, `scripts/seed/guard.ts`
- Test: `scripts/seed/guard.test.ts`

**Interfaces:**
- Consumes: `DEMO_PREFIX`, `DEMO_KEY_PREFIX`, `INSERT_ORDER`, `openDatabase`, `confirm`.
- Produces:
  - `foreignKeyEdges(): { child: string; column: string; parent: string }[]` — derived from every table in `src/db/schema` via `getTableConfig(table).foreignKeys` (drizzle-orm/pg-core), excluding auth tables.
  - `guardQueries(edges): { child: string; column: string; sql: string }[]` — for each edge, SQL counting child rows whose own id is **not** demo-prefixed but whose `column` **is**.
  - `clean.ts` main: open DB → owner check → run guard queries; any non-zero → print table/column/count, exit 1 with no deletes → snapshot non-demo row counts per table → print per-table demo counts → `confirm` → one transaction deleting `WHERE id::text LIKE 'de5eed00-%'` in reverse `INSERT_ORDER` → list and remove every storage object under `de5eed00/` in `public-media` (independent of rows, so orphans from a failed seed go too) → re-count non-demo rows and exit 1 if any table changed.

- [ ] **Step 1: Write the failing tests**

```ts
test("edges include the cascades that could hurt real data", () => {
  const e = foreignKeyEdges().map((x) => `${x.child}.${x.column}->${x.parent}`);
  expect(e).toContain("application.company_id->company");
  expect(e).toContain("project.cover_media_id->media");
  expect(e).toContain("interview.calendar_event_id->calendar_event");
});
test("guard SQL targets real children of demo parents", () => {
  const q = guardQueries([{ child: "application", column: "company_id", parent: "company" }])[0].sql;
  expect(q).toContain(`"application"."id"::text NOT LIKE 'de5eed00-%'`);
  expect(q).toContain(`"application"."company_id"::text LIKE 'de5eed00-%'`);
});
```

- [ ] **Step 2: Run** `pnpm test scripts/seed/guard` → FAIL.
- [ ] **Step 3: Implement.** Column names come from the Drizzle column's `.name` (snake_case in the DB); adjust the test strings if the schema uses different SQL names.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(seed): db:seed:clean with cascade guard`.

---

### Task 8: Demo notice in the workspace

**Files:**
- Modify: `src/server/services/setup-service.ts` (add `hasDemoData(userId: string): Promise<boolean>`; this service already queries `db` directly, follow it)
- Modify: `src/features/setup/actions.ts` (add `getDemoStatus(): Promise<boolean>`: `requireUserId()` then the service)
- Modify: `src/app/me/page.tsx` (fetch it alongside `getSetupChecklist()`; render the notice above the overview sections)
- Test: `src/server/services/setup-service.test.ts`

**Interfaces:**
- Consumes: `DEMO_PREFIX` from `src/lib/demo.ts` (Task 2).
- Produces: `hasDemoData(userId)` — true if any of `project`, `article`, `task` has a row with `user_id = userId AND id::text LIKE 'de5eed00-%'` (`limit 1` each, filtered by `userId` per CLAUDE.md).
- Notice: existing template alert styling (no hex, tokens only), text exactly "Demo data is loaded. Remove it before sharing your site: `pnpm db:seed:clean`".

- [ ] **Step 1: Write the failing test** — mock `@/db`; assert the generated SQL for each table contains the `userId` filter and `LIKE 'de5eed00-%'`, and that the result is `false` when all three return no rows.
- [ ] **Step 2: Run** `pnpm test src/server/services/setup-service` → FAIL.
- [ ] **Step 3: Implement** the service method, the action, and the notice.
- [ ] **Step 4: Run** `pnpm check` → PASS.
- [ ] **Step 5: Commit** `feat(me): show a notice while demo data is loaded`.

---

### Task 9: E2E — workspace mutation shows on the public site

**Files:**
- Create: `e2e/fixtures/owner.ts`, `e2e/admin-public-sync.spec.ts`, `e2e/global-teardown.ts`
- Modify: `playwright.config.ts` (`globalTeardown: "./e2e/global-teardown.ts"`)

**Interfaces:**
- Produces: `test` extended with an `ownerPage` fixture. It loads `.env.local`, throws if `baseURL` host is not `localhost`/`127.0.0.1`, looks up the owner id by `OWNER_EMAIL` (own `postgres` client), mints `encode({ token: { id, sub: id, email, name }, secret: AUTH_SECRET, salt: "authjs.session-token" })` from `next-auth/jwt`, and adds cookie `authjs.session-token` for `localhost`.
- Teardown deletes owner rows with `title LIKE 'E2E · %'` or `slug LIKE 'e2e-%'` in `project`, `article`, `testimonial` (author name for testimonials), and `experience` (`company LIKE 'E2E · %'`), each `WHERE user_id = owner`.

- [ ] **Step 1: Write the specs** (all in `admin-public-sync.spec.ts`, `test.skip(!!process.env.CI, "touches the live database")`):
  1. Project: create via `/me/projects` → publish → `/projects` lists it, `/projects/e2e-<n>` shows its title, nav has "Projects" → set to draft → list lacks it, detail returns 404.
  2. Article: publish → `/articles` lists it, detail renders, `/feed.xml` and `/sitemap.xml` contain the slug → draft → all four lack it.
  3. Testimonial: create + publish → home shows the quote → unpublish → gone.
  4. Profile: add experience `E2E · Acme` → `/cv` and `/about` show it → delete → gone.
  5. Featured: publish + feature a project → home work section shows it → unfeature → gone.
  Each test deletes its records in `afterEach` through the UI delete action.
- [ ] **Step 2: Sanity check the fixture** — a test that `ownerPage.goto("/me")` stays on `/me` (not redirected to `/login`).
- [ ] **Step 3: Run** `pnpm test:e2e e2e/admin-public-sync.spec.ts` (needs the database) → all PASS. Then `CI=1 pnpm test:e2e e2e/admin-public-sync.spec.ts` → all skipped.
- [ ] **Step 4: Teardown check** — stop a run with Ctrl+C right after the first publish, then run `pnpm exec tsx e2e/global-teardown.ts` (the module's default export is also invoked when run directly) → prints the deleted counts; `/projects` no longer lists the `E2E · ` project.
- [ ] **Step 5: Commit** `test(e2e): prove workspace changes reach the public site`.

---

### Task 10: End-to-end verification (requires the database)

No code. Blocked until `supabase.co` resolves from the dev machine.

- [ ] `pnpm check` and `pnpm build` (dev server stopped, `.next` removed) → PASS.
- [ ] `pnpm db:seed` → review host and counts → `yes` → totals match Tasks 4–5.
- [ ] `pnpm db:seed --yes` again → `0` rows inserted, `0` uploads.
- [ ] Playwright inspection at 1440 and 390 px: every public page and every `/me` section shows data, no console errors, no broken images, no horizontal overflow; demo notice visible on `/me`.
- [ ] `pnpm test:e2e` → PASS (public smoke, accessibility, sync).
- [ ] `pnpm db:seed:clean` → `yes` → 0 demo rows, 0 objects under `de5eed00/`, non-demo counts unchanged.
- [ ] Report results with real output, including anything not run.
