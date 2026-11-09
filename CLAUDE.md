# Personal OS — working notes for AI agents

A single-owner personal website plus a private workspace, built from a frozen written
specification (`personal-os-master-specification.pdf`). Read that PDF before proposing
anything that changes product scope.

- **Public site:** Home, About, CV, Projects, Articles, Contact, Privacy.
- **Private workspace** at `/me`: Overview, Tasks, Calendar, Career, Health, Journal,
  Articles, Projects, Testimonials, Inbox, Media, Settings.
- One owner only. The Google account in `OWNER_EMAIL` is the sole account that can sign in,
  and owns all content.

Scale: ~24,400 lines, 40 routes, 131 components, 67 unit tests in 8 files.

## Stack

Next.js 14.2.35 (App Router) · TypeScript · Drizzle ORM 0.45 + postgres-js · Supabase Postgres ·
Zod 4 · NextAuth v5 beta (Google) · Bootstrap 5 with the purchased **Fronter** template SCSS ·
Tiptap 2 · Recharts 3 · FullCalendar · dnd-kit · @react-pdf/renderer · Vitest.

## Commands

```bash
pnpm install
pnpm exec next dev -p 3001   # NOT `pnpm dev` — see the port gotcha below
pnpm check                   # typecheck + lint + tests; run before claiming done
pnpm typecheck               # tsc --noEmit
pnpm test                    # vitest run
pnpm build                   # stop the dev server and delete .next first
pnpm db:push                 # apply schema changes (additive only)
```

## Non-negotiable architecture

```
UI → Server Action → requireUserId() → Zod safeParse → service → repository → DB
                                                     → revalidatePath() → ActionResult<T>
```

- **Every repository query filters by `userId`.** No exceptions. This is the only thing
  separating the owner's data from anyone else's.
- **Every mutating action** calls `requireUserId()` first, then validates input with
  `safeParse`, then returns `ActionResult<T>` (`{ ok: true, data }` or `{ ok: false, error }`).
  Middleware also guards `/me/:path*`, but never rely on it alone.
- **Services own transactions.** Multi-row writes are atomic.
- **Aggregates are derived, never stored** — weekly averages, macro totals, training volume,
  personal records, streaks are all computed from raw rows.
- **Meal items store nutrition snapshots** so editing a food never rewrites logged history.
- Public reads live in `src/lib/data/*` and only ever return published, public-safe rows.

Layout: `src/db/schema/`, `src/server/repositories/`, `src/server/services/`,
`src/features/<domain>/{schema,actions}.ts`, `src/components/{shared,layout,me}/`,
`src/lib/data/` (public read models).

## Use these before writing new markup

| Component                    | For                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `shared/DialogShell`         | Every modal — backdrop, focus trap, Escape, scroll lock, labelled heading, close button |
| `shared/ConfirmDialog`       | Destructive confirmation, with a spinner while it runs                                  |
| `shared/EmptyState`          | "Nothing here yet" (`actionHref` to navigate, `onAction` for in-place)                  |
| `shared/PageSkeleton`        | A route's `loading.tsx` — variants `cards` / `list` / `detail` / `board`                |
| `me/WorkspaceError`          | A workspace route's `error.tsx` — pass `what` ("your tasks")                            |
| `me/MePageHeader`            | Workspace page title block, optional back link                                          |
| `ToastProvider` / `useToast` | Confirmations and failures, optional Undo                                               |
| `hooks/useDialogA11y`        | Only if you need a dialog that `DialogShell` cannot frame                               |

**Colours are tokens, never hex in `.tsx`.** `_variables.scss` holds the template palette;
`_me-shell.scss` republishes what React needs as `var(--app-primary)`, `--app-primary-soft`,
`--app-surface`, `--app-border`, `--app-on-primary-soft`. Chart colours come from
`src/lib/chart-theme.ts`. Exceptions that genuinely cannot use CSS variables:
`cv/download/CvDocument.tsx` (react-pdf) and `global-error.tsx` (renders its own `<html>`).

## Design constraint

The visual design is the Fronter Bootstrap template, chosen at the start of the project and
**fixed**. The workspace deliberately reuses the public site's tokens so `/me` reads as the
same site, not a separate admin panel. Do not introduce another design system, a CSS framework,
a component library, or a redesign. Polish within the template.

`Fronter_ReactJs/` is the purchased template kept locally as reference only. It is
git-ignored and must not be committed or redistributed.

## Failure behaviour — two deliberate, opposite rules

- **Public list pages degrade.** Home, `/projects`, `/articles` read through `publicRead()`
  in `src/lib/data/site-cache.ts`. If the database is unreachable the section is omitted and
  the page still renders. This also keeps `next build` from failing during prerender, so a
  database hiccup never blocks a deploy.
- **Public detail pages do not lie.** `/articles/[slug]` and `/projects/[slug]` deliberately
  do **not** swallow database errors. `null` means "no such item" → 404; an outage must
  surface as a server error. Turning an outage into a 404 would tell search engines that real
  articles had been deleted. Do not "fix" this by wrapping them in `publicRead`.

In the workspace, `me/ActionErrorWatcher` catches Server Actions that fail by _throwing_
instead of returning `{ ok: false }`. Most components call actions without `try/catch`, so
without it a failed click silently does nothing.

## Caching

Public site data is cached for 5 minutes via `unstable_cache` tagged `SITE_TAG`
(`src/lib/data/site-cache.ts`). Any action that changes what visitors see must call
`revalidateSiteData()`. Caches wrap the _inside_ of `publicRead` so a failure is never cached.

## Gotchas that will cost you an hour

1. **Dev port must be 3001.** `.env.local` sets `AUTH_URL=http://localhost:3001` and that URL
   is registered as the Google OAuth redirect. Plain `pnpm dev` starts on 3000 and sign-in
   breaks. Use `pnpm exec next dev -p 3001`.
2. **Stale `.next` causes runtime errors on every page.** Stop the dev server,
   `rm -rf .next`, rebuild. Never run `pnpm build` with a dev server running.
3. **`next/og` / `ImageResponse` crashes on Windows** (`path.join` on a `file://` URL). All
   such routes were removed; OG images are static files in `public/`. Do not reintroduce them.
4. **Client components must not import server modules** — it pulls `postgres` into the browser
   bundle ("Can't resolve 'net'"). Keep shared types in pure files, e.g.
   `src/features/projects/format.ts`.
5. **`db:push` only; there are no migration files.** `src/db/migrations/` is empty. Keep schema
   changes additive so the push stays non-interactive. Production needs real migrations first.
6. **Supabase free tier pauses** after about a week of inactivity. The symptom is
   `tenant/user postgres.<ref> not found`. Resume the project in the Supabase dashboard.
7. Use `DIRECT_URL` (Session pooler) for drizzle-kit, `DATABASE_URL` (transaction pooler,
   `prepare: false`) at runtime. The raw direct host is IPv6-only and fails on IPv4 networks.
8. Deleting a public image removes it immediately, but Supabase's CDN can serve a cached copy
   for up to an hour.

## Conventions

- Comments explain _why_, not what. Match the density of the surrounding file.
- Dates: Health uses `todayInUserTz()` with a `tz` cookie (falls back to `Asia/Jakarta`).
  Tasks and Calendar predate this and use UTC. Do not mix them.
- Rich text is validated Tiptap JSON (`features/content/richtext.ts` → `validateDoc`) rendered
  by our own React renderer. **Never render raw HTML.**
- Uploads: browser → Supabase via a one-time signed URL for a server-chosen key, then the
  server re-reads the bytes and verifies the real type (`sniffMime`). SVG is refused.
- Secrets never leave `.env.local`. `src/server/env.ts` validates the environment at startup
  and reports variable _names_ only, never values.

## Before you say a task is done

Run `pnpm check`. For anything touching rendering, also `pnpm build`. Report failures with the
actual output. There is no browser automation in this repo, so UI changes cannot be visually
verified by an agent — say so rather than implying you saw them work.

See `docs/PROJECT-STATUS.md` for what is built, what is pending, and open issues.

# AI ENGINEERING INSTRUCTIONS

## Mandatory Engineering Protocol

Before performing any planning, implementation, refactoring, debugging, or technical changes:

1. Read `FULLSTACK_ENGINEERING_MASTER_PROTOCOL.md` completely.
2. Treat it as the primary engineering execution and tool orchestration guideline for this project.
3. Inspect the currently available plugins, skills, and MCP tools.
4. Use relevant installed capabilities according to their documented functionality.
5. Never assume a tool is available without verifying its availability in the current environment.

## Document Responsibilities

- `CLAUDE.md` defines the project blueprint, product requirements, architecture decisions, design direction, and development objectives.
- `FULLSTACK_ENGINEERING_MASTER_PROTOCOL.md` defines how engineering work must be planned, executed, tested, and verified.

Both documents must be followed together.

## Conflict Resolution

If instructions conflict:

1. Follow applicable system and developer instructions.
2. Preserve explicit project requirements and approved architectural decisions.
3. Follow the engineering protocol for implementation methodology.
4. If a significant conflict remains, explain it before making potentially disruptive changes.

## Planning vs Implementation

- When asked to plan, analyze the project blueprint and produce or update the development plan without implementing code.
- When asked to implement, follow the approved project plan and engineering protocol.
- Never assume that permission to plan also means permission to modify application code.

## Tool Utilization

The installed plugin and MCP ecosystem is an available engineering resource.

Inspect and use relevant capabilities instead of unnecessarily performing specialized tasks manually.

Do not invoke every plugin indiscriminately.

Do not claim successful tool usage or verification without actual evidence.
