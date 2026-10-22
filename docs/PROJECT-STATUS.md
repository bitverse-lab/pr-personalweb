# Personal OS — project status and handoff

Last updated: 22 October 2026. Written for whoever picks this project up next, human or AI.
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
| Verification | `pnpm check` (typecheck + lint + 67 tests) and `pnpm build` all pass. |
| Browser testing | **Never done.** No page has been looked at by a human or an agent. |
| Deployment | Not deployed. No hosting, no CI, no migrations, no monitoring, no backups. |
| Real content | Not filled in. Public pages show the neutral "being set up" placeholder. |
| Database | Supabase project is **paused** (free tier, inactivity). Resume it before any work. |

### Immediate blockers

1. **The last session's work is uncommitted.** 81 modified files and 11 new files sit in the
   working tree; `origin/main` still points at the initial commit. Anyone cloning the
   repository today gets none of it. Commit and push before doing anything else — otherwise
   the audit described in section 5 will be silently lost or redone.
2. **Supabase is paused.** Symptom: `tenant/user postgres.<ref> not found`. Resume it in the
   Supabase dashboard. Nothing that touches data can be tested until then.

## 3. What is built

**Public site:** `/` (hero, skills, experience, selected projects, latest articles,
testimonials, CTA), `/about`, `/cv` (plus a generated PDF at `/cv/download`), `/projects` and
`/projects/[slug]` with search and technology filters, `/articles` and `/articles/[slug]` with
table of contents, share buttons, reading progress and previous/next, `/contact`, `/privacy`,
`/login`, plus `/feed.xml`, `/sitemap.xml`, `/robots.txt` and JSON-LD.

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

## 5. The October audit (uncommitted)

A full-codebase audit and upgrade was carried out in the previous session. Net effect:
81 files changed, 11 added, **+1215 / −1353 lines** — it removed more code than it added.

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

## 6. Open issues

1. **Nothing has been seen in a browser.** This is the single biggest risk. The 18 migrated
   dialogs compile and are type-correct, but no one has watched one open. Check them first:
   Tasks, Calendar, Career, Health (nutrition and workouts), Profile, Media, Testimonials.
2. **`/articles/[slug]` status anomaly.** While the database is down it returns HTTP 200 with
   the 404 page body, whereas the structurally identical `/projects/[slug]` correctly returns
   404 or 500. Cause not found; needs a live database to diagnose. A soft 404 would let search
   engines index non-existent article URLs.
3. **The "newer article" previous/next link on article pages has never been confirmed working.**
   The "older" direction was verified; the newer direction was not.
4. **No pagination anywhere.** Every list loads all rows. Fine for one person today; Inbox and
   Media will outgrow it.
5. **Dependency advisories.** `pnpm audit --prod` reported 24 findings at last check: 23 in
   `next@14.2.35` (fixed only in Next 15+, which needs React 19 compatibility work) and 1 in
   Tiptap 2. Mitigations in place: the image optimizer is disabled
   (`images.unoptimized: true`), a prototype-pollution guard in `validateDoc`, and a PostCSS
   override in `pnpm-workspace.yaml`.
6. No Content-Security-Policy. No screen-reader pass or automated axe checks.

## 7. What to do next, in order

1. **Commit and push the audit work.** See section 2.
2. **Resume the Supabase project.**
3. **Manual test round** in a desktop browser and on a phone: every workspace page, every
   dialog, the contact form, and the two issues in section 6 (items 2 and 3).
4. **Fill in real content** — Profile & CV, photo, first project, first article, testimonials.
   The public site shows placeholders until a name is saved.
5. **Replace `db:push` with tracked Drizzle migrations.** `src/db/migrations/` is empty, which
   is acceptable for local development and not acceptable for production.
6. **Add CI.** `.github/workflows/ci.yml` exists and runs install, typecheck, lint and tests on
   push to `main` and on pull requests. Confirm it goes green after the first push. `pnpm build`
   is deliberately not in CI because prerendering needs a database.
7. **Deploy to Vercel:** set every environment variable including `SITE_URL` and the production
   `AUTH_URL`, add `<url>/api/auth/callback/google` to the Google OAuth client's authorised
   redirect URIs, run migrations, then check `/robots.txt`, `/sitemap.xml` and that `/me`
   redirects to `/login` when signed out. Pick a function region near the Supabase region.
8. **Then, in rough priority order:** scheduled backups of both the database *and* the two
   storage buckets (a database dump alone cannot restore the site), error monitoring
   configured to keep journal, health and contact content out of its reports, Playwright
   end-to-end tests, the Next 15 upgrade, a report-only CSP, and a screen-reader audit.

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
