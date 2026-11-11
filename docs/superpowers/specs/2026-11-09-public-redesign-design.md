# Public site redesign: hero C v3 and every public page

Date: 2026-11-09 · Status: owner decisions folded in, awaiting approval
Prototypes (approved, open in a browser): `docs/superpowers/specs/assets/2026-11-09-public-redesign/`
- `hero-c-v3-prototype.html` — the home hero, including all five motions
- `pages-articles-projects.html` — Articles option **B** (chosen), article detail, Projects
- `pages-about-cv-contact.html` — About, CV, Contact

## Why

The site has three jobs for one owner:
1. **Portfolio** for HR and recruiters: in 30 seconds they should understand "full stack + data"
   and see proof.
2. **Writing**: a blog of articles. The daily journal stays private in `/me` (owner decision).
3. **Workspace** `/me`: the owner's private tools. **Unchanged** by this project.

Today the public pages read as the Fronter template with content poured in: centred "Hi, I'm"
hero, stock photos, percentage skill bars, uniform card grids. The owner wants it distinctive,
less rigid, and not "AI slop", while staying the same site.

## Goals

- Implement hero C v3 on the home page as prototyped ("résumé as a query").
- Redesign Articles (list + detail), Projects (list + detail), About, CV and Contact in one shared
  visual language derived from the hero.
- Every motion explains something (cause → result, relationship, state change); nothing loops for
  decoration.
- Real data only: every number, row and timing shown comes from the database at render time.

## Non-goals

- `/me` workspace UI, except the two small editors under "New data" (owner approved both).
- Dark mode, 3D beyond the hero console's CSS tilt, WebGL/Three.js, cursor effects, parallax,
  scroll-reveal on every section, particle or grid backgrounds.
- New URLs: `/projects`, `/articles`, `/about`, `/cv`, `/contact` keep their paths (SEO, links
  already shared).
- A public journal.

## Anti-goals (failure even if it "works")

- Anything that reads as AI-generated: eyebrow chip over a giant headline, pulsing dots, decorative
  grids, macOS window dots, three equal cards, rotating taglines, fake metrics.
- A displayed number or timing that is not real (the v1 prototype's `Math.random()` ms was rejected).
- An HR visitor on a phone seeing anything broken, cut off or unreadable.
- Losing WCAG AA (current `e2e/accessibility.spec.ts` must stay green, with data loaded).

## Constraints

- Fronter template is fixed (CLAUDE.md): reuse its tokens (`$primary #2a52c3`, `$dark #3c4858`,
  `$secondary #5a6d90`, `$success`, `$light`), Poppins/Roboto, Bootstrap utilities, `_me-shell`
  tokens. No new CSS framework or component library. Colours are tokens, never hex in `.tsx`.
- One new font: **JetBrains Mono** (400/600) for the "data" accent (query text, dates, chips,
  labels), loaded the same way the template loads Poppins (Google Fonts `@import` in
  `_variables.scss`).
- Public failure rules stay: list pages degrade through `publicRead`, detail pages never turn an
  outage into a 404.
- `prefers-reduced-motion`: every movement has a still alternative; content is visible without JS.
- Next.js 14 App Router; client components never import server modules.

## The shared language

- **Mono accents**: path-like section labels (`~/work`, `~/writing`), ISO dates, read times, layer
  chips, query text.
- **Layers** as the organising idea everywhere: `data · api · ui · model · ops`. The labels come from
  the owner's skill categories (`skill.category`), lower-cased.
- **Asymmetry over grids**: one featured item large, the rest smaller or listed.
- **Light surfaces** (`$light` / white) with the dark navy console as the only dark element, used
  for the hero console and code blocks.
- Navigation labels: **Work · Writing · About · CV · Contact** (paths unchanged).

## Pages

### Home
1. **Hero C v3** exactly as the prototype:
   - Name (three lines, mask-up reveal) and a one-sentence positioning line built from `headline`.
   - CTAs "See my work" / "Download CV" and a **"Show in plain language"** switch.
   - Console header: `<site host> / postgres · read-only`.
   - Tabs `profile.sql`, `stack.sql`, `projects.sql`, each running a fixed, read-only query
     server-side:
     - `profile.sql` → the owner's **highlights** (see New data) plus `status` from `availableForWork`;
     - `stack.sql` → skills grouped by category;
     - `projects.sql` → published projects, featured first, with their derived layers and outcome.
   - Footer: row count and **the real query time measured when the page was rendered**, labelled
     honestly (e.g. `✓ 31 ms · 3 min ago`). The cache can be up to 5 min old, so "ago" is shown.
   - Note under the console: "This panel queries this site's own database each time the page is
     rebuilt."
2. **Selected work**: same layout as the Projects page's featured block (top 3).
3. **Latest writing**: the newest 3 articles in the Articles B style (one large + two listed).
4. **Experience** timeline: kept, restyled with mono dates.
5. **Contact** block: the same as the Contact page's left column, linking to `/contact`. Remove
   the template's availability banner and the percentage skill section from the home page.

**The five motions** (prototype is the reference):
1. Execution: Run → `executing…` + one progress sweep → rows.
2. Tab switch: old rows exit upward fast, new rows enter, the tab underline slides.
3. Plain-language toggle: the key column slides out, the SQL blurs into a sentence.
4. Cross-highlight: hovering or focusing a `stack.sql` row lights the projects using that layer,
   dims the rest, and the Work header shows `WHERE layer = '…'`.
5. Row → case study: clicking a `projects.sql` row morphs it into its Selected-work card via the
   View Transitions API (root cross-fade disabled; scroll + highlight fallback elsewhere).

Plus the name reveal, count-up of numeric values, and a subtle CSS 3D tilt on fine pointers only.
On phones the console is flat and full width.

### Projects (`/projects`)
- Light header `~/work` with "Things I shipped, by the layers I built."
- Layer filter chips (all / data / api / ui / model / ops). Only layers present in projects are shown.
- One featured project large (cover, layer chips, title, outcome number), the rest as smaller cards
  in an asymmetric grid. No uniform 3-column grid.
- Empty state stays honest.

### Project detail (`/projects/[slug]`)
- Mono meta line (dates, client, role), title, summary, layer chips, an **outcome** callout, the
  gallery, then the case-study body in the article reading column; links; prev/next.

### Articles (`/articles`): option B, editorial
- Latest article large: cover, mono meta (`LATEST · date · n min`), title, excerpt.
- "Earlier" list beside it: title + mono date · tag.
- Below: the remaining articles as a dated list, plus tag filter and search (existing behaviour kept).
- **No cover**: a typographic block (title set large on a soft-primary surface), never an empty
  image box.

### Article detail (`/articles/[slug]`)
- One reading column (~68 characters), a mono meta line, and a title.
- Sticky "On this page" table of contents from `extractHeadings`, highlighting the section in view
  (IntersectionObserver). Hidden below `lg`.
- Code blocks in the console style. Tags as chips. Related / prev-next kept.

### About (`/about`)
- Photo (with the existing initials fallback) and a mono **"now"** block:
  - the current role from the experience with no end date;
  - the location;
  - availability from `availableForWork` / `availabilityNote`.
- Story: the summary split into short paragraphs under small headings.
- "What I work with": skills grouped by layer as chips. **Percentage bars are removed.**
- Experience timeline (shared component).

### CV (`/cv`)
- A paper-like sheet on a soft background, matching the downloadable PDF's structure:
  - experience with achievements on the left;
  - education and "proof" on the right (the owner's highlights);
  - a sticky "↓ PDF" button.
- Print stylesheet: the sheet only, no navigation.

### Contact (`/contact`)
- Left column:
  - a specific call ("Hiring, a project, or a question about a post?");
  - a reply-time line;
  - mono rows for email, LinkedIn and GitHub (from `links`), and status.
- Right column: the existing contact form, unchanged in behaviour.

### Privacy and 404
- Restyled with the same header and label language; content unchanged.

## New data (small `/me` additions, approved by the owner)

1. **Profile highlights**: the rows behind `profile.sql`, written by the owner, never hard-coded.
   - New table `profile_highlight` (additive, `db:push`): `id`, `user_id`, `metric` (short key,
     e.g. `gpa`), `value` (display text, e.g. `3.92 /4.00`), `note` (plain-language line),
     `position`.
   - Edited in `/me/settings/profile` as a new "Highlights" tab, using the same list editor pattern
     as Skills, and the same architecture (action → Zod → service → repository filtered by `userId`).
   - Shown in the hero (`profile.sql`) and on the CV ("proof").
   - The demo seed gets matching rows.
2. **Project outcome**: one optional line per project (e.g. "7% median error · 40 cooperatives").
   - New nullable column `project.outcome` (additive). One input in the project editor's Details card.
   - Shown on project cards, in the project detail callout and in `projects.sql`.
   - The demo seed fills it.

**Derived, no storage**:
- A project's layers = the categories of the owner's skills whose names appear in the project's
  `technologies` (case-insensitive).
- The current role = the experience with `endDate = null`.

## Verification

- Unit tests:
  - the layer derivation;
  - the query-runner shape (rows, timing);
  - highlights validation;
  - outcome validation.
- E2E (Playwright, data seeded):
  - each page renders at 1440 and 390 px with no overflow and no console errors;
  - hero tabs, plain-language toggle (`aria-checked`), cross-highlight, row → case study, all with
    reduced motion too;
  - the article TOC highlights the section in view;
  - Articles without a cover show the typographic block;
  - `e2e/accessibility.spec.ts` stays green with data;
  - the existing public/sync specs stay green, with selectors updated where markup changed.
- Visual check against the prototypes via screenshots. Impeccable detector on changed UI files:
  only the template's Roboto may remain flagged.
- `pnpm check`, `pnpm build`.

## Delivery

- Branch `feat/public-redesign` from `develop`, PR into `develop`.
- Built in independently reviewable steps (shared language and fonts → home → projects →
  articles → about/CV/contact → highlights/outcome data), each green before the next.

## Decided by Claude (owner can override)

- Navigation labels "Work" and "Writing" with unchanged URLs.
- JetBrains Mono as the one added font, loaded like the template's fonts.
- Query time shown with its age ("3 min ago") because public data is cached for up to 5 minutes.
- Remove from home: the percentage skill bars and the template availability banner.
- Project layers derived from technologies ↔ skill categories rather than stored.
