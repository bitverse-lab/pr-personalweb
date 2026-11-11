# Redesign brief: proof, not claims

A brief for the agent that rebuilds the public site. Read it with `CLAUDE.md` and
`FULLSTACK_ENGINEERING_MASTER_PROTOCOL.md`.

## 0. Before you start

- **`CLAUDE.md` currently forbids a redesign** ("The visual design is the Fronter Bootstrap template …
  fixed"). The owner wants a total rework. Ask the owner to update that section first, and note
  in it what stays fixed (Bootstrap 5 + the existing tokens unless the owner decides otherwise).
  Do not work around the rule silently.
- Work on a branch off `feat/public-redesign` (it holds every recent change; `main` does not yet).
- Commits and PRs carry **no Claude attribution** (owner's standing rule).
- The site is **not deployed** yet. Ideas 1, 3 and 4 are worth far more once it is (Vercel,
  function region `sin1`, next to the Supabase project in Singapore).

## 1. The thesis

Recruiters are impressed by **evidence they can check**, not by effects. Every idea below only
makes sense for this owner: a full-stack developer with data/ML work (rice-yield forecasting, an
IndoBERT sentiment API), who taught database systems. If an idea could be pasted onto anyone's
portfolio, it is the wrong idea.

### Anti-slop rules (apply to everything)

1. **No decoration without information.** No gradient blobs, glassmorphism, particle fields,
   floating 3D shapes, "Hi, I'm a passionate developer" typewriters, emoji bullet lists.
2. **Every number has a source** the visitor can open (a query, a CI run, a commit, a paper).
   Never invent a metric, a hash that pretends to be real, or a testimonial.
3. **Replace the gradient project covers.** They are the most "template" thing on the site today.
   Use real screenshots, the system diagram, or a chart of the project's own data.
4. **Copy in the owner's voice**, specific and short. No adjectives about passion or innovation.
5. **One idea per section, and it explains something.** Motion that does not explain is removed.

### Non-negotiables

- Accessibility: WCAG 2.1 AA (the axe suite in `e2e/accessibility.spec.ts` must stay green), full
  keyboard use, `prefers-reduced-motion` respected (still frame, same information).
- Performance budget for the home page: LCP < 2.0 s on a mid-range phone, < 170 KB JS before any
  opt-in feature loads. Heavy features (WASM, models) load **only on explicit user action**, show
  their size before downloading, and never block first paint.
- Privacy: anything the visitor types (a job description, a review, SQL) stays in their browser
  unless they press a button that says it will be sent.
- Public pages degrade when the database is down (`publicRead`, see `CLAUDE.md`). New public
  features must too.
- Phone first: every feature has a working phone layout, not just a hidden one.

## 2. What already exists (reuse it)

| Piece | Where | Reuse for |
| --- | --- | --- |
| Query console (fixed read-only queries, real timing) | `src/components/home/QueryConsole.tsx`, `src/lib/data/console.ts` | Idea 2 grows out of it |
| Embedding cloud (Canvas 2D, built from real skills/projects) | `src/components/home/EmbeddingCloud.tsx` | Idea 7 animates it over time |
| Layers per project (skill categories) | `src/features/projects/layers.ts` (`layersOf`, `allLayers`, `toolsByLayer`) | Ideas 1, 6, 9 |
| Page transitions | `src/components/shared/ViewTransitionLinks.tsx`, `src/lib/view-transition.ts` | Keep |
| Site terminal (cmdk) | `src/components/shared/PublicTerminal.tsx`, `src/lib/data/terminal.ts` | Commands for new features |
| Git-log experience, review testimonials, INSERT contact form, query-plan nav | `src/components/home/*`, `src/components/shared/*` | Keep or restyle |
| CI, daily backup, Telegram digest | `.github/workflows/*.yml` | Idea 4 reads their results |
| Public data, cached and degrading | `src/lib/data/*` (`publicRead`, `SITE_TAG`) | Every public feature |

## 3. Build order

**4 → 2 → 1 → 3**, then the backlog. Cheapest-and-certain first, hardest-and-most-impressive last.
Ship each behind its own PR with tests; do not start the next until the previous one is green.

---

### Idea 4 — `/proof`: engineering quality you can verify

**What the visitor sees.** A page of live engineering facts, each linking to its source:
unit and e2e test counts and pass state (latest CI run), Lighthouse scores per key route, JS
bundle size per route, p50/p95 database latency measured by the site itself, last successful
backup (time + size), uptime of the scheduled jobs, schema version, dependency freshness.

**How.**
- A CI job (extend `ci.yml`) writes `proof.json`: vitest/playwright JSON reporters, `next build`
  output (route sizes), Lighthouse CI (`@lhci/cli`) on the preview URL, and `gh run list` results
  for Backup/Reminders. Publish it where the site can read it (a release asset, or a row in a
  `site_metric` table via a CI step with a write-only DB role).
- Latency: the site already times its console reads; keep a rolling sample (cheap table or Edge
  Config) and show p50/p95.
- Every tile links to the CI run / commit that produced it. Stale data shows its age, never hides it.

**Done when.** Numbers match the latest CI run; a failing run shows as failing (honesty is the
point); page works with the DB down (shows "last known" with timestamp); axe green.

---

### Idea 2 — A real SQL sandbox in the browser

**What the visitor sees.** The hero console gets a "Make it live" switch. Then it is a real
Postgres (PGlite, Postgres compiled to WebAssembly) loaded with a snapshot of the public data:
`project`, `skill`, `experience`, `article`, `testimonial`. Visitors type any query — joins,
window functions, `EXPLAIN ANALYZE`. Results render as a table, with an automatic chart when the
shape fits (one text + one number column → bar; date + number → line). Preset queries teach:
"Which layers do my ML projects use?", "Skills by first year used".

**How.**
- Snapshot: a build step (or `/api/snapshot.sql`, cached, public rows only) emits a small SQL dump
  of public data. Never include private tables, emails, or anything `/me`-only.
- Load PGlite lazily on the switch, show "~3 MB" before loading, run it in a Web Worker so typing
  never janks. Statement timeout + row cap (e.g. 500 rows) in the worker.
- Editor: plain `<textarea>` with keyword highlighting is enough; no heavy editor library.
- Keep the existing fixed-query mode as the default and the reduced-motion / no-WASM fallback.

**Done when.** Arbitrary SELECTs and EXPLAIN work offline after load; writes are allowed but only
affect the visitor's in-memory copy (say so); a runaway query is stopped by the timeout; snapshot
contains no private data (test asserts the table list); bundle budget for first paint unchanged.

---

### Idea 1 — "Match my JD": requirements mapped to evidence

**What the visitor sees.** A recruiter pastes a job description. The page splits it into
requirements and, for each, shows the owner's strongest evidence with a score and a link:
*"time-series forecasting" → Rice Yield Forecasting (case study) · 0.82*. Gaps are shown honestly
("no direct evidence"). Export as a one-page summary (print stylesheet / PDF).

**How.**
- Embeddings in the browser: transformers.js with a small sentence model (MiniLM-class; confirm
  current size, expect ~20–30 MB quantized) loaded on first use, in a Web Worker.
- Evidence corpus precomputed at build time with the same model: one vector per experience bullet,
  project summary/outcome, article, skill. Ship vectors as a compact binary (Float16), not JSON.
- Requirement extraction: split by bullets/sentences, drop boilerplate (benefits, EEO text) with a
  small keyword list; no LLM call, no server.
- Cosine similarity, top-3 per requirement, threshold for "gap".

**Done when.** Works with network off after model load; JD text never leaves the browser (assert no
request carries it); a fixture JD produces stable top matches in a unit test (cosine on fixed
vectors); fallback to keyword matching when WebGPU/WASM unavailable.

---

### Idea 3 — The owner's models run on their own case studies

**Rice yield.** Sliders for rainfall, planted area, month; the forecast line with its interval
updates live. Export the trained model in a browser-friendly form (small tree ensemble → JSON
evaluator, or ONNX). Show the model's real validation error next to it, sourced.

**IndoBERT sentiment.** Type an Indonesian product review → label + confidence + a token heatmap
(which words pushed the decision; attention or integrated-gradients scores computed in-browser).
Quantized ONNX via onnxruntime-web (WebGPU, WASM fallback). A clear "Load model (≈ N MB)" button;
cache in the browser after first load. Pre-baked examples for visitors who will not wait.

**Done when.** Both demos run fully client-side; sizes are stated before download; examples work
without loading the model (precomputed results); numbers on the page match the paper/repo.

---

## 4. Backlog (after 1–4)

5. **Case study as an interactive postmortem.** One real incident (e.g. the Laravel queue dropping
   jobs) told as a replayable timeline: the error graph rising, the wrong hypotheses, the query that
   proved it, the fix, before/after numbers. Scroll or step controls; reduced motion = static steps.
6. **Architecture you can send a request through.** Each case study's system diagram (SVG) with a
   "send request" button: a packet travels CDN → API → queue → model → DB with real timings; click
   a node for the code excerpt and the decision record (ADR) behind it.
7. **Career time scrubber.** A slider from the first year to now: the hero embedding cloud morphs —
   skills appear the year they were first used, projects light up when shipped. Needs a
   `first_used` year per skill (additive column) and project dates (already stored).
8. **Craft.** Designed dark mode (not inverted), print stylesheet that yields a clean CV, PWA with
   offline reading, written bilingual ID/EN (not machine-translated), zero layout shift.
9. **Role-tailored links.** `?for=data-engineer` / `?for=fullstack` reorders projects and highlights
   evidence for that role; the owner sends a tailored link per application.

## 5. Process for each idea

1. Write a short design note (what, why for recruiters, data source, budget) and get the owner's OK.
2. Build behind a flag or on its own route; keep the old path until the new one is green.
3. Tests: unit for pure logic (parsers, scoring, snapshot filter), Playwright for the flow, axe for
   the page, a size check for the bundle.
4. Screenshot desktop + phone, light + dark, reduced motion. Look at them before calling it done.
5. `pnpm check`, `pnpm build` (dev server stopped), e2e. Report failures with output.
6. Update `docs/PROJECT-STATUS.md`.

## 6. Open decisions for the owner

- Lift or rewrite the "design is fixed" rule in `CLAUDE.md`?
- Deploy first (recommended: Vercel Hobby, region `sin1`)?
- Which ML demo first: rice yield (light) or IndoBERT (heavy, most impressive)?
- Are the model weights and a public data snapshot fine to ship to visitors' browsers?

> Library sizes and versions above are estimates from memory; verify current releases (and pin
> versions at least two weeks old) when implementing.
