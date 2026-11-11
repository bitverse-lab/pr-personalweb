import type { Metadata } from "next";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import { getProof, type RunFact } from "@/lib/data/proof";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Proof",
  description: "Test results, bundle sizes, backups and database latency for this website, measured by its own pipeline.",
};

function ago(iso: string | undefined, now: number): string {
  if (!iso) return "not measured yet";
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  if (min < 48 * 60) return `${Math.round(min / 60)} h ago`;
  return `${Math.round(min / 1440)} days ago`;
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function Tile({ label, value, tone, children }: { label: string; value: string; tone?: "ok" | "bad" | "none"; children?: React.ReactNode }) {
  return (
    <div className={`proof-tile ${tone === "bad" ? "is-bad" : tone === "ok" ? "is-ok" : ""}`}>
      <dt className="proof-label">{label}</dt>
      <dd className="proof-value">{value}</dd>
      <dd className="proof-note">{children}</dd>
    </div>
  );
}

/** A workflow's last run on main, said plainly — a failed run shows as failed. */
function RunTile({ label, run, now, children }: { label: string; run: RunFact | undefined; now: number; children?: React.ReactNode }) {
  if (!run) return <Tile label={label} value="—" tone="none">not measured yet</Tile>;
  const ok = run.conclusion === "success";
  return (
    <Tile label={label} value={ok ? "passing" : run.conclusion} tone={ok ? "ok" : "bad"}>
      {children}
      run #{run.run} · <code>{run.sha}</code> · {ago(run.at, now)}
    </Tile>
  );
}

// Engineering facts about this site, written by its own pipeline (scripts/proof/collect.mjs) and
// shown as they are: a failing run reads "failure", an old measurement shows its age.
export default async function ProofPage() {
  const { metrics: m, measuredAt, latency } = await getProof();
  const now = Date.now();
  const empty = Object.keys(m).length === 0;
  const publicRoutes = (m.bundle?.routes ?? []).filter((r) => !r.route.startsWith("/me") && !r.route.startsWith("/api") && !r.route.startsWith("/_") && r.firstLoadKb > 0).sort((a, b) => b.firstLoadKb - a.firstLoadKb);

  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
        <section className="page-head">
          <div className="container">
            <p className="path-label mb-3">~/proof</p>
            <h1 className="page-head-title">Proof</h1>
            <p className="page-head-lede">
              Anyone can write &ldquo;tested&rdquo; and &ldquo;fast&rdquo; on a portfolio. These are this site&apos;s own numbers, written by its pipeline after each change to the main branch. Nothing here is typed by hand.
            </p>
          </div>
        </section>

        <section className="section pt-5">
          <div className="container">
            {empty ? (
              <p className="proof-note">The measurements could not be read right now. They are stored in the site&apos;s database, which did not answer; try again in a few minutes.</p>
            ) : (
              <>
                <dl className="proof-grid">
                  {m.tests && (
                    <Tile label="unit tests" value={`${m.tests.passed} / ${m.tests.total}`} tone={m.tests.failed ? "bad" : "ok"}>
                      {m.tests.failed ? `${m.tests.failed} failing · ` : "all passing · "}
                      {m.tests.files} files · {ago(measuredAt.tests, now)}
                    </Tile>
                  )}
                  {m.e2e && (
                    <Tile label="end-to-end tests" value={String(m.e2e.total)} tone="none">
                      browser tests in {m.e2e.files} files, including an accessibility scan of every public page · {ago(measuredAt.e2e, now)}
                    </Tile>
                  )}
                  <RunTile label="ci on main" run={m.ci} now={now}>typecheck, lint, unit and browser tests · </RunTile>
                  <RunTile label="daily backup" run={m.backup} now={now}>
                    {m.backup?.sizeBytes ? `${mb(m.backup.sizeBytes)} encrypted, database and files · ` : ""}
                  </RunTile>
                  {latency && (
                    <Tile label="database round trip" value={`${latency.medianMs} ms`} tone="none">
                      median of {latency.samples} from this server · slowest {latency.maxMs} ms · {ago(latency.at, now)}
                    </Tile>
                  )}
                  {m.deps && (
                    <Tile label="dependencies" value={`${m.deps.current} / ${m.deps.direct} current`} tone={m.deps.deprecated.length ? "bad" : "none"}>
                      {m.deps.behindMajor ? `${m.deps.behindMajor} a breaking version behind (${m.deps.majorNames.join(", ")}${m.deps.behindMajor > m.deps.majorNames.length ? ", …" : ""})` : "none a breaking version behind"}
                      {m.deps.deprecated.length ? ` · deprecated: ${m.deps.deprecated.join(", ")}` : ""} · {ago(measuredAt.deps, now)}
                    </Tile>
                  )}
                  {m.bundle?.sharedKb != null && (
                    <Tile label="shared javascript" value={`${m.bundle.sharedKb} kB`} tone="none">
                      loaded by every page, before page code · {ago(measuredAt.bundle, now)}
                    </Tile>
                  )}
                </dl>

                {publicRoutes.length > 0 && (
                  <>
                    <h2 className="proof-h">JavaScript per page</h2>
                    <p className="proof-note mb-3">First load, as reported by the production build{m.commit ? <> of <code>{m.commit.sha}</code></> : null}. Heavier pages are heavier for a reason: the home page carries the query console.</p>
                    <div className="table-responsive">
                      <table className="proof-table">
                        <thead>
                          <tr>
                            <th scope="col">page</th>
                            <th scope="col" className="text-end">page code</th>
                            <th scope="col" className="text-end">first load</th>
                          </tr>
                        </thead>
                        <tbody>
                          {publicRoutes.map((r) => (
                            <tr key={r.route}>
                              <th scope="row">{r.route}</th>
                              <td className="text-end">{r.sizeKb} kB</td>
                              <td className="text-end">{r.firstLoadKb} kB</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <h2 className="proof-h">How to read this</h2>
                <ul className="proof-notes">
                  <li>Test counts and bundle sizes come from running the test suite and the production build in GitHub Actions on the main branch.</li>
                  <li>The browser tests that need real data run on my machine before a merge; in CI they run against a deliberately unreachable database, which also proves the public pages survive an outage.</li>
                  <li>The backup is a nightly encrypted dump of the database and every uploaded file, restored into a clean server once to check it works.</li>
                  <li>The database round trip is timed by the server that rendered this page, when the page data was last refreshed.</li>
                </ul>
              </>
            )}
          </div>
        </section>
      </main>
      <SmallFooter />
    </>
  );
}
