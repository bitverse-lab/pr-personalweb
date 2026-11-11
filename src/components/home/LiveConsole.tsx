"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Snapshot } from "@/features/sandbox/snapshot";
import type { SandboxRequest, SandboxResponse } from "./sandbox.worker";

// The hero console, live: a real Postgres running in this tab (see sandbox.worker.ts), loaded with
// the site's public data. Any SQL works, including writes — they change only the visitor's copy.

const TIMEOUT_MS = 5000;

const PRESETS: { label: string; sql: string }[] = [
  { label: "tables", sql: "SELECT table_name, (xpath('/row/c/text()', query_to_xml('select count(*) as c from ' || table_name, false, true, '')))[1]::text::int AS rows\nFROM information_schema.tables\nWHERE table_schema = 'public'\nORDER BY table_name;" },
  { label: "projects per layer", sql: "SELECT s.layer, count(DISTINCT ps.project_slug) AS projects\nFROM project_skill ps\nJOIN skill s ON lower(s.name) = lower(ps.skill)\nWHERE s.layer IS NOT NULL\nGROUP BY s.layer\nORDER BY projects DESC;" },
  { label: "most used tools", sql: "SELECT skill, count(*) AS projects\nFROM project_skill\nGROUP BY skill\nORDER BY projects DESC, skill\nLIMIT 8;" },
  { label: "wins per role", sql: "SELECT e.role, e.company, count(a.*) AS achievements\nFROM experience e\nLEFT JOIN achievement a ON a.experience_id = e.id\nGROUP BY e.id, e.role, e.company\nORDER BY e.id;" },
  { label: "explain a join", sql: "EXPLAIN ANALYZE\nSELECT p.title, s.layer\nFROM project p\nJOIN project_skill ps ON ps.project_slug = p.slug\nJOIN skill s ON lower(s.name) = lower(ps.skill);" },
];

type Result = { fields: string[]; rows: unknown[][]; total: number; affected: number; ms: number };

const show = (v: unknown): string => (v === null || v === undefined ? "NULL" : v instanceof Date ? v.toISOString().slice(0, 10) : Array.isArray(v) ? `{${v.join(", ")}}` : typeof v === "object" ? JSON.stringify(v) : String(v));
const num = (v: unknown) => (typeof v === "bigint" ? Number(v) : typeof v === "number" ? v : NaN);

/** A label column and a number column, a handful of rows: worth drawing as bars. */
function chartable(r: Result): { label: string; value: number }[] | null {
  if (r.fields.length !== 2 || r.rows.length < 2 || r.rows.length > 12) return null;
  const bars = r.rows.map((row) => ({ label: show(row[0]), value: num(row[1]) }));
  return bars.every((b) => Number.isFinite(b.value) && b.value >= 0) && bars.some((b) => b.value > 0) ? bars : null;
}

export default function LiveConsole({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<"loading" | "ready" | "running" | "failed">("loading");
  const [boot, setBoot] = useState<{ ms: number; version: string } | null>(null);
  const [sql, setSql] = useState(PRESETS[1].sql);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const worker = useRef<Worker | null>(null);
  const snapshot = useRef<Snapshot | null>(null);
  const pending = useRef<{ id: number; timer: number } | null>(null);
  const nextId = useRef(1);
  const firstRun = useRef(true);

  const start = useCallback(async () => {
    setPhase("loading");
    try {
      snapshot.current ??= (await (await fetch("/api/snapshot")).json()) as Snapshot;
      const w = new Worker(new URL("./sandbox.worker.ts", import.meta.url), { type: "module" });
      worker.current = w;
      w.onmessage = (e: MessageEvent<SandboxResponse>) => {
        const m = e.data;
        if (m.type === "ready") {
          setBoot({ ms: m.ms, version: m.version });
          setPhase("ready");
          return;
        }
        if (m.id !== undefined && m.id !== pending.current?.id) return; // answer to a query that was cancelled
        if (pending.current) window.clearTimeout(pending.current.timer);
        pending.current = null;
        if (m.type === "error") {
          // No id: Postgres itself failed to start.
          if (m.id === undefined) return setPhase("failed");
          setError(m.message);
          setResult(null);
        } else {
          setError(null);
          setResult(m);
        }
        setPhase("ready");
      };
      w.onerror = () => setPhase("failed");
      w.postMessage({ type: "init", snapshot: snapshot.current } satisfies SandboxRequest);
    } catch {
      setPhase("failed");
    }
  }, []);

  useEffect(() => {
    void start();
    return () => {
      if (pending.current) window.clearTimeout(pending.current.timer);
      worker.current?.terminate();
    };
  }, [start]);

  const run = useCallback(
    (text: string) => {
      const w = worker.current;
      if (!w || !text.trim() || pending.current) return;
      const id = nextId.current++;
      // A query cannot be interrupted inside the worker, so a runaway one ends with the worker:
      // it is replaced by a fresh database with the original data.
      const timer = window.setTimeout(() => {
        pending.current = null;
        w.terminate();
        setResult(null);
        setError(`Stopped after ${TIMEOUT_MS / 1000} s. The sandbox was reset to its original data.`);
        void start();
      }, TIMEOUT_MS);
      pending.current = { id, timer };
      setPhase("running");
      w.postMessage({ type: "query", id, sql: text } satisfies SandboxRequest);
    },
    [start],
  );

  // Show a result as soon as the database is up, so the panel is never an empty box.
  useEffect(() => {
    if (phase === "ready" && firstRun.current) {
      firstRun.current = false;
      run(sql);
    }
  }, [phase, run, sql]);

  const bars = result ? chartable(result) : null;
  const max = bars ? Math.max(...bars.map((b) => b.value)) : 0;
  const plan = result && result.fields.length === 1 && result.fields[0] === "QUERY PLAN";

  return (
    <div className="qc-stage">
      <div className="qc qc--live" data-testid="live-console">
        <div className="qc-conn">
          <span aria-hidden="true">●</span>
          <span className="qc-host">{boot ? `postgres ${boot.version} · in your browser` : "starting postgres…"}</span>
          <button type="button" className="qc-ro qc-exit" onClick={onExit}>back to read-only</button>
        </div>

        {phase === "failed" ? (
          <p className="qc-live-note" role="alert">Postgres could not start in this browser (it needs WebAssembly and about 5.5 MB). The read-only console still works.</p>
        ) : (
          <>
            <div className="qc-tabs">
              <div className="qc-tablist" role="group" aria-label="Example queries">
                {PRESETS.map((p) => (
                  <button key={p.label} type="button" className="qc-tab" aria-pressed={sql === p.sql} disabled={phase === "loading"} onClick={() => { setSql(p.sql); run(p.sql); }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <button type="button" className="qc-run" disabled={phase !== "ready"} onClick={() => run(sql)}>
                <span aria-hidden="true">▶</span><span className="qc-run-label"> Run</span>
              </button>
            </div>
            <label className="visually-hidden" htmlFor="live-sql">SQL to run</label>
            <textarea
              id="live-sql"
              className="qc-editor"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              rows={Math.min(9, Math.max(4, sql.split("\n").length + 1))}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  run(sql);
                }
              }}
            />
            <div className={`qc-progress ${phase === "loading" || phase === "running" ? "is-on" : ""}`} aria-hidden="true"><i /></div>

            <div className="qc-live-out" aria-live="polite">
              {phase === "loading" && <p className="qc-live-note">Downloading and starting Postgres (about 5.5 MB, once)…</p>}
              {error && <pre className="qc-live-error">ERROR: {error}</pre>}
              {result && plan && <pre className="qc-live-plan">{result.rows.map((r) => show(r[0])).join("\n")}</pre>}
              {result && !plan && result.fields.length > 0 && (
                // Focusable so keyboard users can scroll a long result (WCAG scrollable-region-focusable).
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                <div className="qc-live-scroll" tabIndex={0} role="region" aria-label="Query result">
                  <table className="qc-table">
                    <thead>
                      <tr>{result.fields.map((f, i) => <th scope="col" key={`${f}-${i}`}>{f}</th>)}</tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className={cell === null ? "qc-null" : j === 0 ? undefined : "qc-value"}>
                              {bars && j === 1 ? (
                                <span className="qc-bar"><i style={{ width: `${max ? (bars[i].value / max) * 100 : 0}%` }} />{show(cell)}</span>
                              ) : (
                                show(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {result && !plan && result.fields.length === 0 && <p className="qc-live-note">OK{result.affected ? `, ${result.affected} row${result.affected === 1 ? "" : "s"} affected` : ""}. Only your copy changed.</p>}
            </div>

            <div className="qc-foot">
              <span>
                {result && result.fields.length > 0 ? `${result.total} row${result.total === 1 ? "" : "s"}${result.total > result.rows.length ? ` (first ${result.rows.length} shown)` : ""}` : phase === "running" ? "executing…" : ""}
              </span>
              <span className="qc-ok">{result ? `✓ ${result.ms} ms` : boot && phase === "ready" ? `ready in ${boot.ms} ms` : ""}</span>
            </div>
          </>
        )}
      </div>
      <p className="qc-why">A real Postgres running in your browser, loaded with this site&apos;s public data. Try anything, Ctrl+Enter runs it. Nothing you type leaves this page.</p>
    </div>
  );
}
