# Public Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement hero C v3 on the home page and redesign Projects, Articles, About, CV and Contact in one shared visual language. Add the two small data sources this needs: profile highlights and project outcome.

**Architecture:**
- Public pages stay server components reading `src/lib/data/*` through `publicRead`.
- New shared styling lives in one SCSS partial built on Fronter tokens.
- The hero console is one client component fed by a cached server read that times its own queries.
- New data follows the existing action → Zod → service/repository path, filtered by `userId`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Drizzle + postgres-js, Bootstrap 5 + Fronter SCSS, Vitest, Playwright (+ axe).

**Spec:** `docs/superpowers/specs/2026-11-09-public-redesign-design.md`
**Prototypes (visual reference, match them):** `docs/superpowers/specs/assets/2026-11-09-public-redesign/`

## Global Constraints

- Fronter tokens only. No hex in `.tsx` (exceptions per CLAUDE.md). New SCSS uses `$primary #2a52c3`, `$dark #3c4858`, `$secondary #5a6d90`, `$success`, `$light`, and the existing `_me-shell` a11y tokens.
- One added font: **JetBrains Mono 400/600**, `@import` in `_variables.scss` next to Poppins.
- Navigation labels: `Work` (→ `/projects`), `Writing` (→ `/articles`), `About`, `CV`, `Contact`. No URL changes.
- Banned (spec anti-goals):
  - eyebrow chip above a giant headline, pulsing dots, grid/particle backgrounds, macOS dots;
  - three equal cards, rotating taglines;
  - percentage skill bars;
  - stock photos as fallbacks;
  - `Math.random()` or any invented number.
- Layer vocabulary: lower-cased `skill.category` values (demo: `data`, `api`, `ui`, `ml`, `ops`).
- Every motion has a `prefers-reduced-motion` still path; content is visible without JS.
- Public list pages degrade via `publicRead`; detail pages keep throwing on outage (CLAUDE.md).
- Schema changes are additive only (`pnpm db:push`), and the demo seed (`scripts/seed`) gains matching rows.
- Branch `feat/public-redesign` (from `develop`); commits carry no Claude attribution.

## Review Focus

1. Owner with **no highlights, no skills, no published projects** → the hero still renders: empty-state rows such as `0 rows` and a hint, never a crash or a fake row (Task 6 test).
2. A project whose technologies match **no skill** → it shows no layer chips and is excluded only from layer-filtered views, still listed under "all" (Task 4 test).
3. An article or project **without a cover** → typographic block; zero requests to `/images/blog/` or `/images/portfolio/` (Task 5 test).
4. **Database down** → home and lists render without the console data (the console shows "Database unavailable" instead of rows); detail pages still error, not 404 (Task 6 test).
5. **Phone (390 px) + reduced motion** → hero console flat, no horizontal overflow, all rows visible immediately (Task 7 test).

---

### Task 1: Shared language: font, partial, navigation labels

**Files:**
- Modify: `src/styles/legacy/scss/_variables.scss` (add the JetBrains Mono `@import`)
- Create: `src/styles/legacy/scss/_public.scss`; import it in `style.scss` before `me-shell`
- Modify: `src/components/layout/PersonalNavbar.tsx` (labels)
- Test: `e2e/public-ui.spec.ts` (extend)

**Interfaces:**
- Produces these CSS classes, used by later tasks:
  - `.font-mono`
  - `.path-label` (mono, `$primary`, 12px)
  - `.layer-chip`, plus `.layer-chip--ml` and `.layer-chip--active`
  - `.reading-col` (max-width 68ch)
  - `.surface-console` (navy console surface + text colours)
  - `.mono-meta` (mono, 12px, a11y-muted)

- [ ] **Step 1: Failing test:** `test("navigation uses Work and Writing labels")` asserts that the nav has links named `Work` → `/projects` and `Writing` → `/articles`, and none named `Projects` or `Articles`. Seed data must be present for both to show.
- [ ] **Step 2: Run** `pnpm exec playwright test e2e/public-ui.spec.ts -g "Work and Writing"`. Expected: FAIL.
- [ ] **Step 3: Implement.** Labels in `navItems`. Add the font import and the partial with the classes above, values from the prototypes' CSS.
- [ ] **Step 4: Run** the same test (PASS) and `pnpm check`.
- [ ] **Step 5: Commit** `feat(public): shared mono/layer language and Work/Writing labels`.

---

### Task 2: Profile highlights (data + `/me` tab)

**Files:**
- Modify: `src/db/schema/profiles.ts`. Add `profileHighlights = pgTable("profile_highlight", { id uuid pk defaultRandom, userId userRef, metric text notNull, value text notNull, note text, position integer notNull default 0 })`.
- Modify: `src/server/repositories/profile-repository.ts`:
  - add `createHighlight`, `updateHighlight`, `deleteHighlight`, all scoped by `userId`;
  - include highlights in `fullProfile` and in `reorder` kinds.
- Modify: `src/features/profile/schema.ts`:
  - `highlightSchema = z.object({ metric: 1–40 chars matching /^[a-z0-9_]+$/, value: 1–60 chars, note: optional ≤140 })`;
  - add `"highlights"` to the reorder `kind` enum.
- Modify: `src/features/profile/actions.ts`:
  - `Kind` gains `"highlight"`;
  - the `handlers.highlight` entry;
  - export `createHighlight`, `updateHighlight`, `deleteHighlight`;
  - `ProfileData.highlights`.
- Create: `src/components/me/profile/HighlightsSection.tsx`, mirroring `SkillsSection` (DialogShell form, ConfirmDialog delete, reorder).
- Modify: `src/app/me/settings/profile/page.tsx`. Tab `{ key: "highlights", label: \`Highlights (${n})\` }` after Basics.
- Modify: `src/lib/data/profile.ts`. `Profile.highlights: { metric: string; value: string; note: string }[]`, ordered by position.
- Modify: `scripts/seed/data/public.ts`:
  - add `highlights` rows: `gpa`, `ip_rights`, `publications`, `team_led`, with values and notes from the prototype;
  - add the demo domain `profile_highlight`, `toTables`/`INSERT_ORDER` entries, and `TABLES` mapping.
- Run: `pnpm db:push`. Additive table; the run should be non-interactive.
- Test: `src/features/profile/schema.test.ts` (new or extend), `scripts/seed/plan.test.ts` (coverage test already enforces the new table).

**Interfaces:**
- Produces:
  - `Profile.highlights`;
  - `createHighlight(input: unknown): Promise<ActionResult<{ id: string }>>` and its update/delete siblings;
  - DB table `profile_highlight`.

- [ ] **Step 1: Failing tests:**
  - `highlightSchema` accepts `{ metric: "gpa", value: "3.92 /4.00", note: "Summa Cum Laude" }`;
  - it rejects metric `"GPA!"`, an empty value, and a 61-char value;
  - the seed `every seeded table appears in INSERT_ORDER` fails until the table is wired.
- [ ] **Step 2: Run** `pnpm test`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the files above. Run `pnpm db:push`.
- [ ] **Step 4: Run** `pnpm check` (PASS). Manual: add, edit, reorder and delete a highlight in `/me/settings/profile`, and confirm `/me` still loads.
- [ ] **Step 5: Commit** `feat(profile): owner-editable highlights`.

---

### Task 3: Project outcome

**Files:**
- Modify: `src/db/schema/projects.ts`. Add `outcome: text("outcome")` (nullable).
- Modify: `src/features/projects/schema.ts`. Add `outcome: optText(140)` to `saveProjectSchema` and the DTO.
- Modify: `src/server/services/project-service.ts` and `project-repository.ts`. Pass `outcome` through save, snapshot and restore.
- Modify: `src/components/me/projects/ProjectEditor.tsx`. Input `id="p-outcome"`, label "Outcome (one line, e.g. 7% median error · 40 cooperatives)", placed in the Details card.
- Modify: `src/features/projects/format.ts`. `Project.outcome: string | null`. Update `toProject` in `src/lib/data/projects.ts`.
- Modify: `scripts/seed/data/public.ts`. Outcome for each demo project, from the prototype.
- Run: `pnpm db:push`.
- Test: `src/features/projects/projects.test.ts` (extend).

**Interfaces:**
- Produces: `Project.outcome: string | null`, and the `outcome` field in save payloads.

- [ ] **Step 1: Failing test:** `saveProjectSchema` accepts `outcome: "7% median error · 40 cooperatives"` and rejects a 141-char outcome.
- [ ] **Step 2: Run** `pnpm test src/features/projects`. Expected: FAIL.
- [ ] **Step 3: Implement**, then run `pnpm db:push`.
- [ ] **Step 4: Run** `pnpm check` (PASS). Run the existing project sync spec: `pnpm exec playwright test e2e/admin-public-sync.spec.ts -g "published project"` (PASS).
- [ ] **Step 5: Commit** `feat(projects): one-line outcome`.

---

### Task 4: Derivations: project layers, current role

**Files:**
- Create: `src/features/projects/layers.ts` (pure)
- Test: `src/features/projects/layers.test.ts`

**Interfaces:**
- Produces:
  - `layersOf(technologies: string[], skills: { name: string; category: string | null }[]): string[]`: lower-cased categories of skills whose name equals a technology, case-insensitive, unique, in skill order.
  - `layerSet(projects: { technologies: string[] }[], skills): string[]`: the union, used for filter chips.
  - `currentRole(experience: { role: string; company: string; endDate: string | null }[]): { role: string; company: string } | null`.

- [ ] **Step 1: Failing tests:**
  - `layersOf(["PostgreSQL","FastAPI","PyTorch"], [{name:"postgresql",category:"Data"},{name:"FastAPI",category:"API"},{name:"PyTorch",category:"ML"}])` → `["data","api","ml"]`;
  - unknown technologies → `[]`;
  - a skill with `category: null` is ignored;
  - `currentRole` returns the entry with `endDate === null`, otherwise `null`.
- [ ] **Step 2: Run** `pnpm test src/features/projects/layers`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(projects): derive layers from technologies and skills`.

---

### Task 5: No stock-photo fallbacks; `CoverBlock`

**Files:**
- Modify:
  - `src/lib/data/articles.ts`, `src/lib/data/projects.ts`: delete `fallbackImage`. Set `image: coverUrl ?? null`.
  - `Article.image: string | null`, `Project.image: string | null`.
- Create: `src/components/shared/CoverBlock.tsx`.
  - Props: `{ src: string | null; title: string; className?: string; ratio?: "16/9" | "16/10" }`.
  - With an image: `FallbackImage` (fallback = the typographic block).
  - Without one: the typographic block (title in Poppins 700 on a soft-primary surface).
- Modify: every consumer of `.image`, found with `grep -rn "\.image\b" src/app src/components/shared`.
- Test: `e2e/public-ui.spec.ts` (extend)

**Interfaces:**
- Produces: `CoverBlock`.
- Consumes: `FallbackImage` (existing).

- [ ] **Step 1: Failing test:** `test("no page requests template stock photos")`. Record requests on `/`, `/projects`, `/articles` and expect none to match `/\/images\/(blog|portfolio)\//`.
- [ ] **Step 2: Run** it. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the test and `pnpm check`. Expected: PASS.
- [ ] **Step 5: Commit** `fix(public): typographic cover instead of template stock photos`.

---

### Task 6: Console data (server)

**Files:**
- Create: `src/lib/data/console.ts`
- Test: `src/lib/data/console.test.ts`

**Interfaces:**
- Consumes: `Profile` (highlights, skills, availableForWork, availabilityNote), `Project` (outcome, technologies), `layersOf`.
- Produces:
  - `type ConsoleTable = { name: "profile.sql" | "stack.sql" | "projects.sql"; sql: string; plain: string; columns: [string, string, string]; rows: { key: string; value: string; note: string; layers?: string[]; slug?: string }[] }`
  - `type ConsoleData = { host: string; tables: ConsoleTable[]; ms: number; measuredAt: string } | null`
  - `buildConsoleTables(input: { highlights; available: boolean; availabilityNote: string; skills; projects }): ConsoleTable[]` (pure). SQL text and plain sentences are copied from the prototype.
  - `getConsoleData(): Promise<ConsoleData>`:
    - wraps the three reads in `unstable_cache` (tag `SITE_TAG`);
    - measures `performance.now()` around the reads inside the cached function and stores `ms` and `measuredAt` (ISO);
    - is wrapped in `publicRead("the hero console", …, null)`;
    - `host` comes from `SITE_URL`, else `AUTH_URL`, else `"localhost"`, hostname only.

- [ ] **Step 1: Failing tests:**
  - `profile.sql` rows equal the highlights in order, plus a final `status` row: `open` when available, `not looking` otherwise;
  - `stack.sql` groups skills by lower-cased category, value = first skill name, note = all names joined with ", ";
  - `projects.sql` rows have `slug`, `layers` (via `layersOf`) and note = outcome or summary;
  - with all-empty input every table has `rows: []` (Review Focus 1);
  - `getConsoleData` returns `null` when the reader throws (mock repository; Review Focus 4).
- [ ] **Step 2: Run** `pnpm test src/lib/data/console`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(home): timed, cached console data from the owner's own tables`.

---

### Task 7: Home: hero C v3 and sections

**Files:**
- Create: `src/components/home/QueryConsole.tsx` (client: tabs, run, plain toggle, cross-highlight, row → case study, tilt).
- Create: `src/components/home/HeroC.tsx` (name reveal, positioning line, CTAs, plain switch wiring).
- Create: `src/components/home/SelectedWork.tsx`, shared with Task 8. Featured large + 2 smaller cards with `data-layers` and `id="case-<slug>"`.
- Modify: `src/app/HomeView.tsx` and `src/app/page.tsx`:
  - replace the hero; keep Experience (restyled: mono dates via `.mono-meta`) and Contact (the Contact page's left column + a link to `/contact`);
  - add "Latest writing" (Articles B style, 3 items);
  - remove the typing animation, the skill bars, the availability banner, `heroOverlayImage`, `dotsImage`, `ctaImage`;
  - `page.tsx` passes `getConsoleData()`.
- Modify: `_public.scss` with console, hero and motion styles from `hero-c-v3-prototype.html`, including the reduced-motion block, `::view-transition-*` rules (root animation none), and the flat console below 920px.
- Test: `e2e/home-hero.spec.ts` (new), run with the seed loaded.

**Interfaces:**
- Consumes: `ConsoleData` (Task 6), `Profile`, `Project[]`, `Article[]`, `CoverBlock`, `layersOf`.
- Produces: `SelectedWork({ projects, skills })`, reused by Task 8.

- [ ] **Step 1: Failing tests** (`e2e/home-hero.spec.ts`):
  - the console shows `profile.sql`, `stack.sql` and `projects.sql` tabs; after load the footer matches `/\d+ rows/` and `/\d+ ms · (just now|\d+ min ago)/` (age from `measuredAt`; never a made-up time);
  - clicking `stack.sql` changes the rows and moves `aria-selected`;
  - the plain switch sets `aria-checked="true"` and hides the key column;
  - hovering the `ml` row gives the matching cards `.lit` and the others `.dim`, and the work header shows `WHERE layer = 'ml'`;
  - clicking a `projects.sql` row scrolls its `#case-<slug>` into view and focuses its heading;
  - at 390px with `reducedMotion: "reduce"`: `scrollWidth <= clientWidth`, the console transform is `none`, and all rows are visible within 500ms (Review Focus 5);
  - no `.home-portrait`, `progress` bar, or typing animation remains.
- [ ] **Step 2: Run** `pnpm db:seed --yes && pnpm exec playwright test e2e/home-hero.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement**, matching the prototype's timings (150–300ms state, 500–800ms focal, `cubic-bezier(.16,1,.3,1)`).
- [ ] **Step 4: Run** the spec and `e2e/accessibility.spec.ts` (PASS). Take screenshots at 1440 and 390 and compare them against the prototype.
- [ ] **Step 5: Commit** `feat(home): hero C v3 query console and redesigned sections`.

---

### Task 8: Projects list + detail

**Files:**
- Modify: `src/app/projects/ProjectsView.tsx`:
  - `~/work` header;
  - layer filter chips from `layerSet`;
  - `SelectedWork` for the first 3;
  - remaining projects in an asymmetric grid;
  - remove the masonry and lightbox list markup.
- Modify: `src/app/projects/[slug]/page.tsx`:
  - mono meta line, layer chips, outcome callout, gallery;
  - body in `.reading-col`;
  - links; prev/next.
- Modify: `e2e/public-smoke.spec.ts`. Replace the masonry/`#portfolio` assertions with the new markup.
- Test: `e2e/projects.spec.ts` (new, seeded)

- [ ] **Step 1: Failing tests:**
  - the featured card is wider than the others;
  - clicking the `ml` chip shows only cards whose `data-layers` contains `ml`, and clicking "all" restores every card (Review Focus 2: a project with no layers is still shown under "all");
  - the detail page shows the outcome callout text from the seed;
  - no horizontal overflow at 390px.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the spec, `public-smoke` and `accessibility`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(projects): case studies by layer`.

---

### Task 9: Articles list (B) + detail

**Files:**
- Modify: `src/app/articles/page.tsx` and its view:
  - latest article large via `CoverBlock`, with mono meta `LATEST · <date> · <n> MIN`;
  - an "Earlier" list of 3;
  - then the remaining articles as a dated list;
  - existing search and tag filter kept.
- Modify: `src/app/articles/[slug]/page.tsx`:
  - `.reading-col` body, mono meta;
  - TOC from `extractHeadings`;
  - code blocks get `.surface-console`.
- Create: `src/components/shared/TableOfContents.tsx` (client; IntersectionObserver; sets `aria-current="true"` on the active link; hidden below `lg`).
- Test: `e2e/articles.spec.ts` (new, seeded)

- [ ] **Step 1: Failing tests:**
  - `/articles` shows exactly one element with `data-latest` containing the newest seed article title;
  - an article seeded without a cover renders the typographic block (Review Focus 3);
  - on article detail, after scrolling to the second H2 its TOC link has `aria-current="true"`;
  - no overflow at 390px.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the spec, `accessibility` and the sync spec's article test. Expected: PASS.
- [ ] **Step 5: Commit** `feat(articles): editorial list and reading layout with live contents`.

---

### Task 10: About, CV, Contact, Privacy, 404

**Files:**
- Modify: `src/app/about/page.tsx`:
  - "now" block via `currentRole` + location + availability;
  - story paragraphs;
  - skills grouped by layer as `.layer-chip`;
  - experience timeline.
- Modify: `src/app/cv/page.tsx`. Sheet layout + `@media print` rules in `_public.scss` (hide nav, footer and buttons). Highlights shown as "proof".
- Modify: `src/app/contact/page.tsx` and `src/components/shared/ContactSection.tsx`. Left column copy from the prototype + mono rows from `links` + status; the form is unchanged.
- Modify: `src/app/privacy/page.tsx`, `src/app/not-found.tsx`. Header and label language only.
- Modify: `src/components/me/profile/ExperienceSection.tsx`. Fix the helper copy to "They appear on your CV and home page."
- Test: `e2e/pages.spec.ts` (new, seeded)

- [ ] **Step 1: Failing tests:**
  - `/about` shows the current role company from the seed (`Nusantara Data Labs`) in the now block, and has no `.progress` element;
  - `/cv` under `page.emulateMedia({ media: "print" })` hides `#topnav`;
  - `/cv` lists a highlight value (`3.92 /4.00`);
  - `/contact` shows the status line and the form still submits validation errors on empty submit.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the spec, `accessibility`, `public-ui` and the sync spec's experience test. Expected: PASS.
- [ ] **Step 5: Commit** `feat(public): about, CV sheet, contact in the shared language`.

---

### Task 11: Whole-site verification

No new code unless a check fails (then TDD as usual).

- [ ] `pnpm db:seed --yes`.
- [ ] `pnpm exec playwright test`: every spec, including sync and accessibility, passes.
- [ ] Screenshots of `/`, `/projects`, a project, `/articles`, an article, `/about`, `/cv` and `/contact` at 1440 and 390, compared against the prototypes.
- [ ] Run the Impeccable `detect` on every changed `.tsx`/`.scss`. Only the template's Roboto may remain flagged.
- [ ] `pnpm db:seed:clean --yes`. Then, on the clean database, `e2e/public-smoke.spec.ts` and `e2e/accessibility.spec.ts` pass (empty states).
- [ ] `pnpm check`, stop the dev server, delete `.next`, then `pnpm build`.
- [ ] Final whole-branch review, then a PR `feat/public-redesign → develop`.
