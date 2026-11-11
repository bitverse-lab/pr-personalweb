# /proof

`/proof` shows engineering facts about the site, each written by a pipeline run, never by hand.

| Metric (`site_metric.key`) | Source |
| --- | --- |
| `tests` | `vitest run --reporter=json` |
| `e2e` | `playwright test --list` (count of browser tests) |
| `bundle` | route table printed by `next build` |
| `ci`, `backup`, `reminders` | last completed run of each workflow on `main` (GitHub API) |
| `commit` | the commit that was measured |
| database round trip | timed by the server when the page data refreshes (not stored) |

`.github/workflows/proof.yml` runs on every push to `main`, daily, and on demand. It reuses the
`BACKUP_DATABASE_URL` secret to write the rows. A failing test suite or workflow is recorded and
shown as failing.

By hand (dev server stopped, because of the build):

```bash
pnpm exec vitest run --reporter=json --outputFile=vitest.json
pnpm exec playwright test --list > e2e-list.txt
pnpm build > build.txt
node scripts/proof/collect.mjs --vitest vitest.json --build build.txt --e2e e2e-list.txt   # add --dry-run to print only
```

Not yet measured: Lighthouse scores (needs a deployed URL). The repository is private, so the
page shows run numbers and commit hashes as text rather than links.
