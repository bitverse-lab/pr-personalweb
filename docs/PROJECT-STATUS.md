# Personal OS — project status and handoff

Last updated: 10 November 2026 (work of 9 November recorded in section 5a). Written for whoever picks this project up next, human or AI.
For architecture rules and day-to-day conventions, read `CLAUDE.md` first; this file is the
story of how the project got here and what is left.

---

## 1. What this is

A personal website and private workspace for one person (the repository owner), built to a
frozen written specification: `personal-os-master-specification.pdf` in the repository root.
That PDF is the source of truth for product scope. Features added beyond it were explicitly
requested by the owner and are recorded in section 4.

The public half is a portfolio a recruiter might visit. The private half at `/me` is a
personal operating system: tasks, calendar, job applications, health and fitness logging,
journal, writing, projects and files.

**GitHub:** `bitverse-lab/pr-personalweb` · branch `main`

## 2. Current state

| | |
| --- | --- |
| Feature work | **Complete.** Every planned module is built. |
| Verification | Re-run on 10 November 2026 on `feat/public-redesign` (`338a5e8`): `pnpm check` passes — typecheck clean, lint clean, **151 unit tests in 27 files** pass. `pnpm build` was **not** re-run since the redesign (it last passed on 24 October, with existing dependency and `<img>` warnings). Playwright was not re-run either. |
| Browser testing | Public routes and signed-in workspace pages checked; overview mobile layout, calendar controls, and article/project previews verified. Manually tested article/project publish-to-public flows against the current Supabase project using owner-approved E2E content, then removed the marked records and confirmed list, detail, RSS, and sitemap cleanup. Playwright covers public-route smoke tests, the signed-out `/me` redirect, WCAG 2.1 A/AA scans, public scroll-reveal behavior, and Projects hydration (20 tests pass). Authenticated flows, contact submission and other mutation flows remain untested. No screen-reader/manual accessibility audit yet. Inbox and Media pagination boundaries are unit-tested, but current data is below page size. |
| Branches | Checked against the remote on 10 November 2026. `main` and `production` are identical on local and remote and hold PR #1 and PR #2. The public redesign (PR #3) is merged into **`origin/develop`** only, not `main`. `338a5e8` exists only on `origin/feat/public-redesign`; it is not in `origin/develop`. Local `develop` is 16 commits behind `origin/develop` (run `git pull`). `feat/docker` exists only on this machine — it is not on the remote. See section 5a. |
| Deployment | Not deployed. A Docker image and `compose.yaml` exist on `feat/docker` (unmerged). CI runs typecheck, lint, unit tests, and non-mutating Playwright smoke tests. An initial Drizzle baseline is prepared but not applied; hosting, monitoring and backups remain outstanding. |
| Real content | Setup is incomplete. Existing published content remains; two pre-existing records identified by the owner as test content remain as drafts. Temporary E2E article/project records were removed after verification. |
| Database | Supabase has been resumed; local public-page reads returned successfully. |

### Before production

Local development is unblocked. Complete the manual browser round, establish a safe migration
baseline for the populated Supabase database, and configure hosting, monitoring and backups
before production.

## 3. What is built

**Public site:** `/` (hero, skills, experience, selected projects, latest articles,
testimonials, CTA), `/about`, `/cv` (plus a generated PDF at `/cv/download`), `/projects` and
`/projects/[slug]` with search and technology filters, `/articles` and `/articles/[slug]` with
table of contents, share buttons, reading progress and previous/next, `/contact`, `/privacy`,
`/login`, plus `/feed.xml`, `/sitemap.xml`, `/robots.txt` and JSON-LD.

The home-page hero and About section now support separate photos. The existing profile photo
remains the hero photo; About falls back to it until a dedicated About photo is uploaded in
Profile & CV → Basics. The additive database column has been applied to the configured Supabase
database, and the earlier uploaded photo remains unchanged.

**Workspace (`/me`):**

- **Overview** — quick capture (task, weight, meal, water, note, job lead), setup checklist,
  productivity heatmap and trend, mini calendar, per-module summary cards.
- **Tasks** — CRUD with priority, tags, due dates, subtask checklists, kanban board, search,
  keyboard shortcuts, Undo on delete.
- **Calendar** — FullCalendar month/week/day, drag-and-drop scheduling, event colours.
- **Career** — application pipeline (Wishlist → Offer) as board and list, per-application
  workspace with timeline, contacts, interviews (synced to the calendar) and private documents.
- **Health** — weight with weekly/monthly averages and 7-day moving average, nutrition with a
  food library seeded with Indonesian staples, water, workout logger with rest timer and
  personal records, routines, exercise library, body measurements, goals with BMR/TDEE.
- **Journal** — daily entries, mood, tags, calendar view, streak, prompts, on-this-day.
- **Articles** — Tiptap editor with autosave, draft/publish/archive, SEO fields.
- **Projects** — case studies with cover and gallery.
- **Testimonials** — publish, hide, reorder; shown on the home page.
- **Inbox** — contact-form messages with search, read/unread, Undo on delete.
- **Media** — Supabase Storage library with usage tracking.
- **Settings** — Profile & CV editor, Account, Data (full JSON export).
- **Global search** — `Ctrl/⌘ + K` command palette across every module.

## 4. Decisions worth knowing

- **The design is fixed.** The Fronter Bootstrap template was chosen at the start and must not
  be replaced or redesigned. The workspace intentionally reuses the public site's tokens so
  `/me` reads as the same site rather than a separate admin panel. The owner has restated this
  constraint explicitly.
- **Health was deliberately expanded past the specification** at the owner's request, to the
  depth of a real gym app: the spec's single `exercise_entries` table became `workouts` +
  `workout_sets` plus exercises, routines, body measurements and water. Metric units only.
- **No external food or exercise API.** Starter catalogues are seeded per user and fully
  editable (`server/services/seed-foods.ts`, `seed-exercises.ts`).
- **JWT sessions, not database sessions.** Middleware runs on the Edge runtime and cannot
  reach Postgres, so the session must be self-contained.
- **Timezone split.** Health is date-sensitive and uses `todayInUserTz()` with a `tz` cookie.
  Tasks and Calendar predate that and use UTC. Left as-is on purpose; do not mix them.
- **`next/og` was abandoned** because `ImageResponse` crashes on Windows. OG images are static
  files in `public/`.
- **Public failure handling is asymmetric on purpose** — list pages degrade, detail pages
  return real errors. `CLAUDE.md` explains why; do not "simplify" it.

## 5. The October audit (committed)

A full-codebase audit and upgrade was committed as `07377b8`. Net effect: **+1215 / −1353
lines** — it removed more code than it added.

**Found and fixed**

| Severity | Problem | Fix |
| --- | --- | --- |
| P0 | The entire public site returned **500** when the database was unreachable, and `next build` failed, blocking deploys | `publicRead()` — list pages degrade gracefully. Verified: with the database fully down, `pnpm build` succeeds and all 11 public routes return 200 |
| P0 | 49 of 50 components called Server Actions with no `try/catch`; a throw (expired session, outage) made the click silently do nothing | `me/ActionErrorWatcher` — detects an expired session, offers to sign in again, otherwise explains the failure |
| P1 | All 19 dialogs had no visible close button (no Escape key on a phone) and did not lock page scroll | `shared/DialogShell`; 18 dialogs migrated |
| P1 | Inbox had no search | Client-side search over name, email, subject and body |
| P2 | The same chart colours redeclared in 7 files under 4 different names; 55 hex values hardcoded in TSX | `src/lib/chart-theme.ts` plus CSS custom properties published from SCSS |
| P2 | 13 near-identical `error.tsx` files; 13 `loading.tsx` files that were bare spinners | `me/WorkspaceError` and `shared/PageSkeleton` (4 variants); each route file is now ~5 lines |
| P2 | Destructive confirmations gave no feedback while running | Spinner and "Working…" state |

Also: toast roles corrected (`status` for success, `alert` for failure), `EmptyState` gained a
button action, the public error page gained the site header and footer, a missing select label,
and a heatmap table made scrollable on narrow screens.

An earlier session in the same week fixed performance: public site data was being re-read on
every request (about 8 sequential Supabase queries, ~200 ms per round trip) even inside `/me`,
which put a ~600 ms floor under every page. Caching it for 5 minutes took `/articles` from
750–2000 ms to ~50 ms and most workspace pages from ~600 ms to ~240 ms. Navigation feedback
was added at the same time: a top progress bar, page fade, optimistic sidebar highlighting,
button press states and skeleton loaders.

## 5a. 9 November 2026 — demo data, public fixes, Docker, public redesign

One day of work across four branches, 38 commits (including 3 merges) between 12:43 and 22:31 (WIB).
Verification status is in section 2: `pnpm check` passes (151 unit tests); `next build` and
Playwright were not re-run. This file previously said 77 unit tests; the count is now 151, and
there are 39 `page`/`route` files under `src/app`. `CLAUDE.md` still says "67 unit tests in 8 files" and is stale.

Timeline (WIB, 9 November): 12:43–14:36 sync and demo data → 14:47–15:01 UI fixes →
15:07–15:13 Docker → 17:03–22:25 redesign → 22:31 CI follow-up commit.

**Demo data and admin→public sync** — PR #1, merged to `main`.
Design and plan: `docs/superpowers/specs/2026-11-09-admin-public-sync-and-demo-data-design.md`,
`docs/superpowers/plans/2026-11-09-admin-public-sync-and-demo-data.md`.

- `pnpm db:seed` loads deterministic demo content, public and workspace, with generated
  placeholder PNGs. `pnpm db:seed:clean` removes it, with a cascade guard. Re-runs are
  idempotent and keep rows the owner has edited.
- `/me` shows a notice while demo data is loaded.
- Sitemap and feed now refresh on every public change; testimonials use the site-cache helper.
- Dev reuses one postgres client across module reloads.
- Playwright test proving workspace edits reach the public site. It touches the live database,
  so it is skipped in CI; run it locally with `pnpm test:e2e`.

**Public UI fixes** — PR #2, merged to `main` and `production`.

- One-row mobile header; Escape closes the menu; one site name in page titles; portrait
  fallback; light projects hero.
- Testimonial author names and project filters meet WCAG AA contrast.

**Docker** — branch `feat/docker`, local only, not pushed or merged.

- `Dockerfile`, `compose.yaml`, `.dockerignore`, README section. Standalone Next output is
  enabled only inside the image, so local `next build` is unchanged.

**Public redesign** — PR #3, merged to `develop`, not yet in `main`.
Spec, plan and approved HTML prototypes:
`docs/superpowers/specs/2026-11-09-public-redesign-design.md`,
`docs/superpowers/plans/2026-11-09-public-redesign.md`, `docs/superpowers/specs/assets/`.

- Stays inside the Fronter constraint: same tokens, Poppins/Roboto, Bootstrap utilities.
  The only addition is JetBrains Mono for a shared mono "layer" label language.
- Home: "query console" hero fed by timed, cached reads of the owner's own tables; Selected
  Work, Latest Writing, one-column experience. Percentage skill bars and the template
  availability banner were removed.
- Projects: case studies grouped by layer, derived from technologies and skills; one-line
  outcome field.
- Articles: editorial list and a reading layout with live table of contents.
- About, CV sheet and Contact restyled to match. Template stock photos replaced by
  typographic covers. Profile highlights are owner-editable.
- Follow-up fixes: readable small buttons, CV line length, aligned fact links, name visible
  without JS, rows survive a cancelled tab switch, quieter live region.
- After the merge, `338a5e8` made E2E tests that assert on the demo dataset skip in CI,
  where the database is unreachable by design.

## 5b. 11 November 2026 — redesign brief (`docs/REDESIGN-BRIEF.md`)

Built in brief order, each on its own stacked branch and PR:

- **/proof** (idea 4): CI writes test counts, route sizes and job health to `site_metric`;
  the page links every number to the run that produced it. See `docs/PROOF.md`.
- **Live SQL console** (idea 2): "Make it live" loads PGlite in a worker with the public
  snapshot from `/api/snapshot`; 5 s timeout, 500-row cap, writes stay in the browser.
- **/match** (idea 1): a pasted job description is matched to evidence by tool, by area and,
  opt-in, by meaning (MiniLM in the browser). The text never leaves the page.
- **Craft** (idea 8): installable PWA with offline reading (`public/sw.js`, production only;
  never touches `/me`, `/login`, `/api`) and a designed dark theme for the public site
  (`_dark.scss`, tokens in `_public.scss`, `src/lib/theme.ts`; `/me` stays light). The axe
  suite runs in both themes.
- Skipped for now: idea 3 (needs the owner's trained models), idea 5 (needs a real incident;
  the queue article is demo data), bilingual copy (must be written by the owner).

## 6. Open issues

1. **Workspace browser testing is incomplete.** The 18 migrated dialogs compile and are
   type-correct, but have not been opened in a browser. Check Tasks, Calendar, Career, Health
   (nutrition and workouts), Profile, Media and Testimonials on desktop and mobile.
2. **The "newer article" previous/next link has never been confirmed working.** The "older"
   direction was verified; the newer direction was not.
3. **No pagination anywhere.** Every list loads all rows. Fine for one person today; Inbox and
   Media will outgrow it.
4. **Dependency advisories.** `pnpm audit --prod` reported 24 findings at last check: 23 in
   `next@14.2.35` (fixed only in Next 15+, which needs React 19 compatibility work) and 1 in
   Tiptap 2. Mitigations in place: the image optimizer is disabled
   (`images.unoptimized: true`), a prototype-pollution guard in `validateDoc`, and a PostCSS
   override in `pnpm-workspace.yaml`.
5. No Content-Security-Policy or screen-reader pass. Automated axe-core checks now cover the public pages and enforce WCAG 2.1 A/AA rules in Playwright/CI. Application error logs are privacy-sanitized, but no external monitoring provider is configured.

## 7. What to do next, in order

0. **Settle the branches** (section 5a), in this order:
   1. `git checkout develop && git pull` to bring local `develop` up to date.
   2. Merge `feat/public-redesign` into `develop` so `338a5e8` lands there.
   3. Stop any dev server, delete `.next`, run `pnpm build`, and run `pnpm test:e2e` locally.
   4. Decide when the redesign goes to `main`/`production`.
   5. Push `feat/docker` (`git push -u origin feat/docker`) and merge it, or drop it.
1. **Manual test round** in a desktop browser and on a phone: every workspace page, every
   dialog, the contact form, and the newer-article navigation in section 6.
2. **Fill in real content** — Profile & CV, photo, first project, first article, testimonials.
   The public site shows placeholders until a name is saved.
3. **Adopt tracked Drizzle migrations safely.** An initial schema baseline has been generated
   under `src/db/migrations/`, but it has not been applied. It creates the current tables and is
   only suitable for a fresh database; do not run it against the populated Supabase instance.
   Before adopting migrations there, compare the live schema and establish a verified baseline.
4. **Confirm CI is green.** `.github/workflows/ci.yml` runs install, typecheck, lint and tests on
   push to `main` and on pull requests. Confirm it goes green after the first push. `pnpm build`
   is deliberately not in CI because prerendering needs a database.
5. **Deploy to Vercel:** set every environment variable including `SITE_URL` and the production
   `AUTH_URL`, add `<url>/api/auth/callback/google` to the Google OAuth client's authorised
   redirect URIs, run migrations, then check `/robots.txt`, `/sitemap.xml` and that `/me`
   redirects to `/login` when signed out. Pick a function region near the Supabase region.
6. **Then, in rough priority order:** implement scheduled backups of both the database and
   storage buckets `public-media` and `private-docs` (a database dump alone cannot restore the
   site). Owner preference: an external encrypted destination with 30 daily and 12 monthly
   restore points; provider is still undecided. Treat database dumps and private documents as
   sensitive, keep credentials out of logs, and rehearse restores in an isolated environment.
   Do not export or store backup contents without separate owner approval. Select and configure an
   error-monitoring provider only after reviewing its data-processing and retention settings;
   current application logs omit exception messages, stacks, SQL parameters, user identifiers,
   and request content. Also plan the Next 15 upgrade, use a report-only CSP, and complete a manual
   keyboard/screen-reader audit. Public Playwright smoke and automated accessibility checks are
   now in place; authenticated E2E still needs a safe test identity and data strategy.

## 8. Backlog

`docs/jira-backlog.csv` is importable into Jira: 11 epics and 53 issues with status, priority,
labels and parent links. It was generated by `docs/build_jira_csv.py`, which holds the item
list — edit the script and re-run it rather than editing the CSV by hand. It reflects the state
of 20 September 2026, so the items fixed by the October audit (section 5) are still listed as
open.

## 9. Where things live

| Path | Contents |
| --- | --- |
| `personal-os-master-specification.pdf` | Frozen product specification — the source of truth |
| `CLAUDE.md` | Architecture rules, conventions, gotchas. Read before writing code |
| `README.md` | Setup, environment variables, scripts, storage, failure behaviour, deployment checklist |
| `docs/PROJECT-STATUS.md` | This file |
| `docs/jira-backlog.csv`, `docs/build_jira_csv.py` | Jira import and its generator |
| `.env.local.example` | Every environment variable with a note on where its value comes from |
| `Fronter_ReactJs/` | Purchased template, local reference only, git-ignored, do not redistribute |
