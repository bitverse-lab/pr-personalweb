// Gathers the facts shown on /proof and upserts them into site_metric. Run by
// .github/workflows/proof.yml (and by hand: see docs/PROOF.md).
//
//   node scripts/proof/collect.mjs --vitest vitest.json --build build.txt --e2e e2e-list.txt --outdated outdated.json [--dry-run]
//
// Needs DATABASE_URL (not for --dry-run) and an authenticated `gh` (GH_TOKEN in Actions).
// A missing input skips that metric: the page then keeps showing the last known value with its age.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";
import { parseBuildOutput, parsePlaywrightList, summarizeOutdated, summarizeVitest } from "./parse.mjs";

if (existsSync(".env.local")) config({ path: ".env.local", quiet: true });

const args = process.argv.slice(2);
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const dryRun = args.includes("--dry-run");
const read = (path) => (path && existsSync(path) ? readFileSync(path, "utf8") : null);

const gh = (path) => {
  try {
    return JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
  } catch (e) {
    console.error(`gh api ${path} failed: ${String(e.stderr ?? e.message).trim().split("\n")[0]}`);
    return null;
  }
};
const repo = process.env.GITHUB_REPOSITORY || execFileSync("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"], { encoding: "utf8" }).trim();

/** Latest completed run of a workflow on main: what happened, when, on which commit. */
function lastRun(file) {
  const run = gh(`repos/${repo}/actions/workflows/${file}/runs?branch=main&status=completed&per_page=1`)?.workflow_runs?.[0];
  return run ? { conclusion: run.conclusion, at: run.updated_at, sha: run.head_sha.slice(0, 7), run: run.run_number, id: run.id, url: run.html_url } : null;
}

const metrics = [];
const put = (key, value, sourceUrl = null) => value && metrics.push({ key, value, sourceUrl });

const vitest = read(arg("--vitest"));
if (vitest) put("tests", summarizeVitest(JSON.parse(vitest)));
const e2e = read(arg("--e2e"));
if (e2e) put("e2e", parsePlaywrightList(e2e));
const build = read(arg("--build"));
if (build) {
  const parsed = parseBuildOutput(build);
  if (parsed.routes.length) put("bundle", parsed);
}

const outdated = read(arg("--outdated"));
if (outdated) {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const direct = Object.keys(pkg.dependencies ?? {}).length + Object.keys(pkg.devDependencies ?? {}).length;
  // pnpm prints nothing at all when every dependency is current.
  const runUrl = process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}` : null;
  put("deps", summarizeOutdated(outdated.trim() ? JSON.parse(outdated) : {}, direct), runUrl);
}

for (const [key, file] of [["ci", "ci.yml"], ["backup", "backup.yml"], ["reminders", "reminders.yml"]]) {
  const run = lastRun(file);
  if (!run) continue;
  const { id, url, ...value } = run;
  if (key === "backup" && run.conclusion === "success") {
    const artifact = gh(`repos/${repo}/actions/runs/${id}/artifacts`)?.artifacts?.[0];
    if (artifact) value.sizeBytes = artifact.size_in_bytes;
  }
  put(key, value, url);
}

const sha = process.env.GITHUB_SHA || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
put("commit", { sha: sha.slice(0, 7) });

if (dryRun) {
  console.log(JSON.stringify(metrics, null, 2));
} else {
  if (!process.env.DATABASE_URL) {
    console.error("missing: DATABASE_URL");
    process.exit(2);
  }
  const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
  try {
    for (const m of metrics) {
      await sql`
        insert into site_metric (key, value, source_url, measured_at)
        values (${m.key}, ${sql.json(m.value)}, ${m.sourceUrl}, now())
        on conflict (key) do update set value = excluded.value, source_url = excluded.source_url, measured_at = excluded.measured_at`;
    }
    console.log(`wrote: ${metrics.map((m) => m.key).join(", ")}`);
  } finally {
    await sql.end();
  }
}
