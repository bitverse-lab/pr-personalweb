# Personal OS

A personal website (Home, About, CV, Projects, Articles, Contact) plus a private `/me` workspace: tasks and calendar, career tracking, health (weight, nutrition, workouts), journal, articles, projects (portfolio), media and profile/CV. Single owner, Google sign-in.

**Stack:** Next.js 14 (App Router) · TypeScript · Drizzle ORM + PostgreSQL (Supabase) · Zod · NextAuth v5 · Supabase Storage · Tiptap · Recharts · Bootstrap 5 (Fronter template SCSS).

Architecture: `UI → Server Action → requireUserId → Zod → service → repository → DB`. Every query is scoped by `userId`; public queries only ever return published or public-safe data.

## Getting started (for new developers)

**You need:** Node.js 20.9+ (`.nvmrc` pins 22, so `nvm use` works), [pnpm](https://pnpm.io/installation) (`corepack enable` picks the right version automatically), and free accounts for Supabase and Google Cloud.

```bash
git clone <repo-url> && cd <repo-folder>
pnpm install
cp .env.local.example .env.local   # Windows PowerShell: Copy-Item .env.local.example .env.local
# fill in .env.local (see "Where each value comes from" below)
pnpm db:push                        # create the tables in your database
pnpm dev                            # http://localhost:3000
```

Then open `/login` and sign in with the Google account set as `OWNER_EMAIL`. If something is missing, the app stops at startup with a list of the variable names that need fixing (never their values).

### Where each value comes from

1. **Database (Supabase).** Create a project, then *Project Settings → Database*. `DATABASE_URL` = pooled connection (transaction mode, port 6543); `DIRECT_URL` = Session pooler string (port 5432). Use your own project for development, never the production one.
2. **Google sign-in.** Google Cloud Console → *APIs & Services → Credentials → OAuth client ID (Web)*. Add `http://localhost:3000/api/auth/callback/google` as an authorised redirect URI, then copy the client ID/secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.
3. **`AUTH_SECRET`.** `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
4. **`OWNER_EMAIL`.** The Google account that may enter `/me`. Every developer uses their own local database, so each can set their own address.
5. **Optional:** `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` enable uploads; `RESEND_*` enables contact-form emails; analytics variables. The app runs without them.

### Before you open a pull request

```bash
pnpm check    # typecheck + lint + unit tests (the same as CI)
```

Conventions: keep the layering `UI → Server Action → requireUserId → Zod → service → repository`; every query must filter by `userId`; add schema changes additively so `pnpm db:push` stays non-interactive. Never commit `.env.local` or any secret. `personal-os-master-specification.pdf` is the product spec.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase pooled connection (runtime) |
| `DIRECT_URL` | Supabase **Session pooler** string (migrations only; the raw direct host is IPv6-only) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client |
| `AUTH_SECRET` | Random 32-byte secret for session tokens |
| `AUTH_URL` | Base URL of the app |
| `OWNER_EMAIL` | The only Google account allowed into `/me`, and the owner of all public content |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | File uploads (Supabase Storage). **Secret, server-only.** |
| `RESEND_API_KEY` / `CONTACT_TO` / `CONTACT_FROM` | Optional: email a notification for each contact-form message (Resend). Without them, messages still land in the `/me` inbox. **API key is secret.** |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` / `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Optional cookie-free visitor statistics for the public site (use one). Public values, not secrets. Never loads in development or inside `/me`. |
| `SITE_URL` | Public URL of the deployed site (sitemap, robots, social links) |

`.env*.local` is git-ignored. Never commit or share the service-role key.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev, production build, production server |
| `pnpm check` | Typecheck + lint + tests in one go (what CI runs) |
| `pnpm lint` | ESLint (only `<img>` warnings from the template are expected) |
| `pnpm test` | Vitest unit tests (calculations, validation, upload rules) |
| `pnpm db:push` | Apply schema changes to the database (renames/drops need a TTY prompt, so prefer additive changes) |

Run `pnpm build` with the dev server stopped and `.next` deleted; a concurrent dev server corrupts the build cache.

## File storage

Uploads use two Supabase Storage buckets, created automatically on first upload:

- `public-media`: images (JPG/PNG/WebP/GIF, ≤ 5 MB). Public URLs, unguessable keys.
- `private-docs`: application documents (PDF/DOCX, ≤ 10 MB). Never public; opened through 60-second signed links.

Deleting an image removes the file immediately, but Supabase's CDN can keep serving a cached copy of a public image for up to an hour.

Uploads go browser → Supabase directly via a one-time signed URL for a server-chosen key. The server then re-reads the stored bytes and verifies the real file type before the file can be used. SVG and other active content are refused.

## Startup checks

`src/server/env.ts` validates the environment when the server first touches the database: required variables must be present and well-formed, the two Supabase storage variables must be set together, and a clear list of problems (variable names only, never values) is shown otherwise.

## Security notes

- **Known dependency advisories.** `pnpm audit --prod` still reports issues in `next@14.2.35` (fixed only in Next 15+) and Tiptap 2. Mitigations in place: the built-in image optimizer (`/_next/image`) is disabled, stored rich-text documents reject prototype-pollution keys, and `postcss` is overridden to a patched version. The Windows-only remote-code-execution advisory does not apply to Linux hosts. Upgrading to Next 15+ is the proper fix and is planned after browser end-to-end tests exist.

- All `/me` routes are behind middleware, and **every server action independently calls `requireUserId()`**.
- Rich text is stored as validated JSON (whitelisted nodes, `http(s)`/`mailto` links, `http(s)` images) and rendered as React elements. There is no raw HTML rendering anywhere.
- `/me/settings/data/export` downloads all of your records as one JSON file (auth required, never cached). Login tokens are never included.
- Security headers (`nosniff`, frame denial, referrer/permissions policy, HSTS) are set in `next.config.mjs`. `/me` and `/login` are `noindex` and `no-store`.
- A strict Content-Security-Policy is **not** enabled yet: the template's inline styles and the YouTube modal need a tuned policy. Add one (start with report-only) before launch if desired.
- There is no rate limiting. It is a single-owner app behind Google sign-in; add it (e.g. at the host/WAF) if the public contact or download endpoints become abused.

## SEO and sharing

- Site name, favicon (`public/icon.svg`), and the default 1200×630 preview (`public/og-default.png`) are static; the name comes from your profile. Articles and projects use their own cover image as the preview when they have one.
- `robots.txt`, `sitemap.xml` (pages, articles, projects) and an RSS feed at `/feed.xml`. Canonical URLs and JSON-LD (Person, Article, CreativeWork) are set automatically.
- `next/og` (dynamic image generation) is **not** used: in Next 14 it builds a broken font path on Windows.

## Public features at a glance

- **Articles:** table of contents (3+ headings), anchor links, reading-progress bar, share buttons (LinkedIn, X, WhatsApp, email, copy link, native share), older/newer navigation, related articles, RSS.
- **Projects:** search, category and technology filters, image lightbox, previous/next project.
- **Testimonials:** managed in `/me/testimonials`; only published ones show on the home page.
- **Analytics:** optional Plausible or Umami (cookie-free); off unless configured.

## Contact form

Visitors send messages from `/contact` and the home page. Every message is saved to the database and appears in **`/me/inbox`** (with an unread badge and Reply/Delete/Undo); if `RESEND_API_KEY` is set you also get an email. Spam protection: a hidden honeypot field, a minimum fill time, and a limit of 3 messages per sender per hour and 30 per day. Senders are identified only by a salted IP hash, never the raw address. Message text is stored and shown as plain text.

## Privacy notice

`/privacy` is generated from the real configuration (it mentions email delivery or analytics only when they are switched on) and is linked from the contact form and the footer. It is a plain-language description of what the site does, not legal advice.

## Public site behaviour

Until a name is saved in **Profile & CV**, public pages show a neutral "being set up" state. Once filled in, the navbar, footer, hero, About, CV, contact details and "Available for work" badge all come from your profile, and menu items for Projects and Articles appear only when something is published.

## Accessibility

- `next lint` runs `eslint-plugin-jsx-a11y` (recommended set). Three rules are off on purpose and documented in `.eslintrc.json`: dialog panels stop click propagation, and dialogs move focus to their first field; keyboard users have Escape, a Tab focus trap and Cancel buttons.
- Every page has one `<h1>`, a `<main>` landmark and a "Skip to main content" link; the mobile menu closes with Escape; keyboard focus always shows a ring (`:focus-visible`).
- Text colours meet WCAG AA (4.5:1): the template's light success/warning/info tones are darkened globally in `_me-shell.scss`, chart labels use `#5f6368`.
- Not yet covered: a screen-reader pass and automated axe/Playwright checks in a real browser.

## Workspace shortcuts

`Ctrl/⌘ + K` opens global search and commands (tasks, events, applications, articles, projects, journal, files; plus quick actions). `c` on the Overview jumps to Quick capture.

## Backups (a database backup alone is not enough)

1. **Database:** on a paid Supabase plan enable daily backups/PITR. On any plan you can take a manual dump with the Session pooler string:
   `pg_dump "$DIRECT_URL" --no-owner --format=custom -f backup-$(date +%F).dump`
2. **Files:** the two storage buckets are separate from the database. Download them periodically (Supabase dashboard → Storage, or the S3-compatible endpoint), or a restore will have rows pointing at missing files.
3. **Verify** a restore now and then: load the dump into a scratch database and confirm row counts and that a few uploaded files open.

## Deployment checklist

- [ ] Set all environment variables on the host (including `SITE_URL` and the production `AUTH_URL`).
- [ ] Add the production URL to the Google OAuth client's authorised redirect URIs (`<url>/api/auth/callback/google`).
- [ ] `pnpm db:push` against the production database.
- [ ] Confirm `OWNER_EMAIL` is correct, then sign in once so the profile row exists.
- [ ] Fill in **Profile & CV** so the public pages stop showing the template's placeholder content.
- [ ] Check `/robots.txt`, `/sitemap.xml`, and that `/me` redirects to `/login` when signed out.
- [ ] Run `pnpm lint`, `pnpm test` and `pnpm build`.

## Known limits and deferred work

Google Calendar sync, recurring events, article revision history, multi-user roles, progress photos, and Playwright end-to-end tests.
