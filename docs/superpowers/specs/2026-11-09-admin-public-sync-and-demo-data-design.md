# Admin ↔ public sync verification and demo data

Date: 2026-11-09 · Status: owner decisions folded in, awaiting approval

## Why

The owner shares this site with recruiters and uses `/me` daily. Before polishing the public
design (hero direction "C v3", parked as a separate project), the owner wants proof that every
change made in the workspace shows up correctly on the public site, and a realistic dataset so
the whole product, public and private, can be exercised as if it were live.

Today nothing proves the sync works: the only E2E specs (`e2e/public-smoke.spec.ts`,
`e2e/accessibility.spec.ts`) cover public pages, and the database is mostly empty, so most
public sections render their empty or degraded state.

## Goals

1. Fix the known sync gaps between workspace mutations and public output.
2. Automated E2E tests that perform a real workspace mutation and assert the public page changed.
3. A demo dataset covering every domain, public and private, that can be added and removed
   with one command each, without touching the owner's real rows.

## Non-goals

- The hero / homepage redesign (separate project, prototype kept in the brainstorm session).
- Multi-user / SaaS. The site stays single-owner (`OWNER_EMAIL`).
- A second database. The owner chose to seed the one Supabase database the public site reads.
- New product features in `/me`.

## Anti-goals (would be a failure even if it "works")

- Demo data overwriting or deleting any row the owner created.
- `seed:clean` deleting a real row through a foreign-key cascade.
- Demo data left on the public site when it is shared with a recruiter, with no way to tell.
- Tests that pass without touching the database (mocked sync proves nothing).

## Constraints

- Architecture in `CLAUDE.md` holds: UI → action → `requireUserId()` → Zod → service →
  repository; every repository query filters by `userId`; aggregates derived, never stored;
  meal items store nutrition snapshots.
- `db:push` only, no migrations. This design needs **no schema change**.
- Health dates use the owner's timezone (`todayInUserTz`, default `Asia/Jakarta`); tasks and
  calendar use UTC. Seed data must follow the same rule per domain.
- Rich text is Tiptap JSON that must pass `validateDoc`. Never raw HTML.
- Secrets stay in `.env.local`; scripts print variable names and the database host only.
- The database is currently unreachable from the dev machine (DNS failure to `supabase.co`).
  Nothing in this design can be run against the database until that is fixed.

## Part 1 · Sync fixes

Mapped with Serena (every exported action in `src/features/**/actions.ts`):

| Workspace mutation | Public surface | Today |
|---|---|---|
| Profile basics, photos, experience, education, skills, links | Home, About, CV, CV PDF, Privacy | `revalidateSiteData()` ✅ |
| Articles: save, status, delete, restore | `/articles`, detail, home, feed, sitemap | ✅ |
| Projects: save, status, featured, reorder, delete, restore | `/projects`, detail, home, nav "Projects" | `revalidateSiteData()` ✅, but sitemap not refreshed |
| Testimonials: all mutations | Home | `revalidatePath("/")` only |
| Tasks, calendar, career, journal, health, inbox | private | revalidate their `/me` paths ✅ |

Fixes:

1. **Sitemap and feed.** `sitemap.ts` and `feed.xml/route.ts` set their own
   `revalidate = 3600` and read through services, not through `SITE_TAG`. Next 14 docs
   (checked via Context7, v14.2.35) do not state that `revalidatePath("/", "layout")` covers
   route handlers. Add `revalidatePath("/sitemap.xml")` and `revalidatePath("/feed.xml")` to
   `revalidateSiteData()` so every public-visible change refreshes them; then remove the now
   duplicate calls from the article actions.
2. **Testimonials** call `revalidateSiteData()` like every other public-visible domain.
3. **`getPublishedTestimonials`** goes through `publicRead()` so a failure is reported via
   `reportError` instead of swallowed silently. Behaviour otherwise unchanged (empty on failure).

## Part 2 · E2E: workspace mutation → public page

Playwright (already configured, `pnpm test:e2e`, dev server on 3001).

**Signing in.** Google OAuth cannot be automated. Auth uses the JWT strategy
(`src/server/auth/config.ts`), so a test fixture mints a session cookie for the `OWNER_EMAIL`
user with `encode` from `next-auth/jwt` (`@auth/core/jwt`) and `AUTH_SECRET`, salted with the
session cookie name, and adds it to the browser context. Only for local runs: the fixture
refuses to run when `PLAYWRIGHT_BASE_URL` is not localhost.

**Driving changes through the UI**, not the database, so the whole chain is exercised.
Each spec creates its own uniquely named records and deletes them in `afterEach`.

**Running against the live database (owner accepted).** There is one database, so test records
are briefly visible on the public site. Mitigations:
- Every test record's title starts with `E2E · ` and its slug with `e2e-`.
- Records are created as drafts and published only for the assertion, then deleted.
- A Playwright `globalTeardown` sweeps any leftover `E2E · ` / `e2e-` rows for the owner
  (through the same delete actions' repositories, scoped by `userId`) in case a test died midway.
- The sync spec is excluded from CI (`test.skip` when `CI` is set); it runs only when the owner
  runs `pnpm test:e2e` locally.

Specs (one file, `e2e/admin-public-sync.spec.ts`):

1. Project: create → publish → appears on `/projects`, its detail page, and nav shows
   "Projects"; unpublish → gone from list, detail returns 404.
2. Article: publish → on `/articles`, detail, `feed.xml`, `sitemap.xml`; back to draft → gone.
3. Testimonial: publish → on home; unpublish → gone.
4. Profile: edit headline and add an experience → visible on home, About and `/cv`.
5. Featured project → appears in the home "work" section; unfeature → gone.

Each assertion reloads the public page (no client cache) and checks content, not just status.

## Part 3 · Demo data

### Commands

- `pnpm db:seed` → inserts the demo dataset for the owner.
- `pnpm db:seed:clean` → removes exactly the demo dataset.

Both are TypeScript scripts in `scripts/seed/`, run with `tsx` (added as a dev dependency;
plain Node 24 cannot resolve the schema's extension-less imports). They load `.env.local`,
use `DIRECT_URL` (session pooler) with their own `postgres` client, and import the Drizzle
schema directly. They do not import `src/server/*` (avoids `server-only` and env side effects).

### Safety

- **Marking.** Every demo row gets a deterministic UUID with the fixed prefix `de5eed00-`
  (valid hex), e.g. `de5eed00-0000-4000-8000-000000000001`. No schema change, and the prefix
  is visible in Drizzle Studio.
- **Insert-only.** Inserts use `onConflictDoNothing` on the fixed ids, so re-running the seed
  is a no-op for rows that already exist. The seed never updates or deletes an existing row.
  If the owner has no `profile` row yet, the seed does not create one (the real profile is the
  owner's to write); experience, education, skills and links are added alongside the owner's.
- **Owner.** Looked up by `OWNER_EMAIL` in `user`. Missing → abort before writing anything.
- **Confirmation.** Both commands print the database host and row counts per table, then
  require `--yes` (or an interactive "yes") before writing.
- **Cascade guard for clean.** Before deleting, `seed:clean` checks every foreign key that
  points at a demo row from a row whose id is *not* demo-prefixed (for example a real
  application attached to a demo company, which would cascade-delete the real application).
  If any exist, it lists them and aborts; the owner detaches them first.
- **Order.** Clean deletes children before parents across all tables, so no cascade is relied on.
- **Public visibility.** While demo data exists, `/me` overview shows a small notice
  "Demo data is loaded · remove before sharing" with the clean command. The public site shows
  nothing (it must look real to test realism), so the notice is the reminder.

### Contents (English, Indonesian context, dates relative to the day the seed runs)

Public:
- Experience 4, education 2, skills ~18 across data / api / ui / ml / ops, social links
  (GitHub, LinkedIn), all appended after the owner's own rows.
- Projects 5: 3 published (1 featured), 1 draft, 1 archived; each with links, technologies,
  and a Tiptap case study with problem / role / stack / outcome.
- Articles 6 with tags: 4 published across the last 3 months, 1 draft, 1 in trash.
- Testimonials 5: 4 published, 1 hidden.
- Contact messages 6: mix of read / unread, one in trash.

Private:
- Tasks ~25 across statuses and priorities, some overdue, some done this week, with subtasks.
- Calendar ~15 events over the past and next 3 weeks, including interview events.
- Career: 8 companies, 10 applications across every status, status history, contacts,
  timeline notes, 4 interviews (linked to calendar events).
- Journal: 30 days with mood and short entries, a few gaps.
- Health: health profile only if the owner has none; 60 days of weight; 6 body measurements;
  a food library of ~20 foods; 21 days of meals with snapshotted meal items; water entries;
  4 routines and 12 workouts with sets (so PRs and volume charts have data).

### Images (owner chose generated placeholders)

- The seed generates abstract raster placeholders itself (no new image dependency): a PNG
  encoder over Node's built-in `zlib`, drawing a two-tone gradient with a few geometric bands
  per item, colours taken from the Fronter palette so they sit naturally on the site. No text
  is drawn into the images; titles stay in HTML.
- Sizes: project covers and gallery 1600×1000, article covers 1600×900. One image per project
  cover, 2 gallery images for the featured project, one per published article.
  Profile and About photos are **not** generated (a fake face on the owner's portfolio is
  misleading); they stay as the owner set them.
- Upload goes to the `public-media` bucket under the key prefix `de5eed00/` with the server
  storage credentials from `.env.local`, then a `media` row (demo-prefixed id, status `ready`,
  real byte size and mime type) is inserted. The bytes must pass the app's own `sniffMime` and
  size rules, so the builder reuses `src/features/media/rules.ts` (pure, no server imports).
- `seed:clean` removes the storage objects under `de5eed00/` after deleting the rows.
- Supabase's CDN can serve a deleted public image for up to an hour (CLAUDE.md gotcha 8);
  acceptable for demo data.

## Verification

- `pnpm check` and `pnpm build` pass.
- Unit tests for the pure parts of the seed: id generator (prefix, uniqueness), date helpers
  (UTC vs owner timezone), and the cascade-guard query builder.
- Against the database (once reachable): seed → row counts match the plan; seed again → zero
  new rows; Playwright inspection of every public page and every `/me` section at 1440 and
  390 px; `seed:clean` → zero demo-prefixed rows left and owner row counts unchanged
  before/after (snapshot of counts per table taken by the script).
- `pnpm test:e2e` including the new sync spec.

## Left to the builder

- Exact copy of demo content, as long as it is plausible and English.
- File layout inside `scripts/seed/`.
- Selector strategy in the E2E spec (prefer roles and labels).

## Decided by Claude (owner can override)

- No schema change; demo rows marked by UUID prefix.
- `tsx` added as a dev dependency.
- Demo notice shown only in `/me`, not on the public site.
- Sitemap/feed fix done inside `revalidateSiteData()`.
- E2E runs against the live database with the mitigations above (owner accepted the
  recommendation).
- Placeholder images are abstract and text-free; no generated profile photos.
- Seed health dates use `Asia/Jakarta` (the app default), since a script has no `tz` cookie.
