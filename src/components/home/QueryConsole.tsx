"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConsoleData, ConsoleRow } from "@/lib/data/console";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { CLOUD_FOCUS_EVENT, type CloudFocus } from "@/components/home/EmbeddingCloud";

// Hero C v3: the owner's CV as the result of real, read-only queries over this site's database.
// Every motion explains something (spec, "The five motions"); reduced motion keeps the states, drops the travel.

const EASE = "cubic-bezier(.16,1,.3,1)";
const KEYWORDS = /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|DESC)\b/g;

function highlightSql(sql: string) {
  return sql.split(KEYWORDS).map((part, i) => (i % 2 === 1 ? <span key={i} className="qc-kw">{part}</span> : part));
}

function ageOf(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  return minutes < 1 ? "just now" : `${minutes} min ago`;
}

// Tells the hero's embedding cloud what the visitor is pointing at.
const focusCloud = (detail: CloudFocus) => window.dispatchEvent(new CustomEvent(CLOUD_FOCUS_EVENT, { detail }));

/** Lights the Selected-work cards that use `layer` and dims the rest; null clears. */
function crossHighlight(layer: string | null) {
  focusCloud(layer ? { layer } : null);
  const work = document.getElementById("work");
  if (!work) return;
  for (const card of Array.from(work.querySelectorAll<HTMLElement>("[data-case]"))) {
    const has = !!layer && (card.dataset.layers ?? "").split(" ").includes(layer);
    card.classList.toggle("lit", !!layer && has);
    card.classList.toggle("dim", !!layer && !has);
  }
  const label = work.querySelector<HTMLElement>("[data-filter-label]");
  if (label) label.textContent = layer ? `WHERE layer = '${layer}'` : "";
}

/** Lights the one Selected-work card for `slug` and dims the rest; null clears. */
function highlightCase(slug: string | null) {
  focusCloud(slug ? { slug } : null);
  const work = document.getElementById("work");
  if (!work) return;
  for (const card of Array.from(work.querySelectorAll<HTMLElement>("[data-case]"))) {
    const has = !!slug && card.id === `case-${slug}`;
    card.classList.toggle("lit", has);
    card.classList.toggle("dim", !!slug && !has);
  }
  const label = work.querySelector<HTMLElement>("[data-filter-label]");
  if (label) label.textContent = slug ? `WHERE slug = '${slug}'` : "";
}

export default function QueryConsole({ data, human }: { data: ConsoleData; human: boolean }) {
  const reduce = usePrefersReducedMotion();
  const [tab, setTab] = useState(0);
  const [phase, setPhase] = useState<"idle" | "typing" | "executing" | "done">("done");
  const [typed, setTyped] = useState<number | null>(null);
  const [age, setAge] = useState<string | null>(null);
  const rowsRef = useRef<HTMLTableSectionElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const firstRun = useRef(true);

  const table = data.tables[tab];
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const clear = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    // a cancelled tab switch must not leave its fill:"forwards" exit (opacity 0) on the rows
    rowsRef.current?.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  };

  // Motion 1 — execution: query (typed on first run) → "executing…" sweep → rows enter.
  const run = useCallback(
    (typeQuery: boolean) => {
      clear();
      // a run cancelled mid-typing (e.g. effects re-running) must not leave a half-typed query behind
      setTyped(null);
      if (reduce) {
        setTyped(null);
        setPhase("done");
        setAge(ageOf(data.measuredAt));
        return;
      }
      const sqlLength = data.tables[tab].sql.length;
      const execute = () => {
        setPhase("executing");
        later(() => {
          setPhase("done");
          setAge(ageOf(data.measuredAt));
        }, 420);
      };
      if (typeQuery && !human) {
        setPhase("typing");
        let i = 0;
        const step = () => {
          i += 2;
          setTyped(Math.min(i, sqlLength));
          if (i < sqlLength) later(step, 22);
          else {
            setTyped(null);
            execute();
          }
        };
        step();
      } else execute();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduce, tab, human, data],
  );

  useEffect(() => {
    run(firstRun.current);
    firstRun.current = false;
    return clear;
  }, [run]);

  // Rows enter with a short stagger once the query has "executed".
  useEffect(() => {
    if (phase !== "done" || reduce || !rowsRef.current) return;
    Array.from(rowsRef.current.rows).forEach((row, i) =>
      row.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 380, delay: i * 60, easing: EASE, fill: "backwards" }),
    );
  }, [phase, tab, human, reduce]);

  // Motion 2 — tab switch: old rows leave upward fast, then the next query runs.
  const switchTab = (next: number) => {
    if (next === tab) return;
    crossHighlight(null);
    const rows = rowsRef.current ? Array.from(rowsRef.current.rows) : [];
    if (reduce || rows.length === 0) return setTab(next);
    rows.forEach((r, i) => r.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(-8px)" }], { duration: 140, delay: i * 15, easing: "ease-in", fill: "forwards" }));
    later(() => setTab(next), 140 + rows.length * 15);
  };

  // Motion 5 — a project row becomes its case study (View Transitions where supported).
  const openCase = (row: ConsoleRow, el: HTMLElement) => {
    const card = row.slug ? document.getElementById(`case-${row.slug}`) : null;
    if (!card) return;
    const heading = card.querySelector<HTMLElement>("h3");
    const focusCard = () => {
      card.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      heading?.focus({ preventScroll: true });
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
    if (reduce || !doc.startViewTransition) return focusCard();
    el.style.viewTransitionName = "case-card";
    const vt = doc.startViewTransition(() => {
      el.style.viewTransitionName = "";
      card.style.viewTransitionName = "case-card";
      card.scrollIntoView({ block: "center" });
    });
    vt.finished.finally(() => {
      card.style.viewTransitionName = "";
      heading?.focus({ preventScroll: true });
    });
  };

  // The other direction: pointing at a case study lights its row while projects.sql is showing.
  useEffect(() => {
    const work = document.getElementById("work");
    const body = rowsRef.current;
    if (!work || !body || table.name !== "projects.sql") return;
    const light = (slug: string | null) => {
      for (const tr of Array.from(body.rows)) tr.classList.toggle("qc-row--lit", !!slug && tr.dataset.slug === slug);
    };
    const cards = Array.from(work.querySelectorAll<HTMLElement>("[data-case]"));
    const offs = cards.map((card) => {
      const slug = card.id.replace(/^case-/, "");
      const on = () => light(slug);
      const off = () => light(null);
      card.addEventListener("pointerenter", on);
      card.addEventListener("pointerleave", off);
      card.addEventListener("focusin", on);
      card.addEventListener("focusout", off);
      return () => {
        card.removeEventListener("pointerenter", on);
        card.removeEventListener("pointerleave", off);
        card.removeEventListener("focusin", on);
        card.removeEventListener("focusout", off);
      };
    });
    return () => {
      offs.forEach((f) => f());
      light(null);
    };
  }, [table.name]);

  // Subtle depth that follows a fine pointer; never on touch or reduced motion.
  useEffect(() => {
    if (reduce || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = consoleRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const x = (e.clientX - (r.left + r.width / 2)) / r.width;
      const y = (e.clientY - (r.top + r.height / 2)) / r.height;
      el.style.transform = `rotateX(${6 - y * 6}deg) rotateY(${-10 + x * 10}deg)`;
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [reduce]);

  const showRows = phase === "done" || phase === "executing";
  const query = human ? `-- ${table.plain}` : typed === null ? table.sql : table.sql.slice(0, typed);
  const isLayers = table.name === "stack.sql";
  const isProjects = table.name === "projects.sql";

  return (
    <div className="qc-stage">
      <div className={`qc ${human ? "qc--human" : ""}`} ref={consoleRef} data-testid="console">
        <div className="qc-conn">
          <span aria-hidden="true">●</span>
          <span className="qc-host">{data.host} / postgres</span>
          <span className="qc-ro">read-only</span>
        </div>
        <div className="qc-tabs">
          <div className="qc-tablist" role="tablist" aria-label="Queries">
            {data.tables.map((t, i) => (
              <button key={t.name} type="button" role="tab" aria-selected={i === tab} className="qc-tab" onClick={() => switchTab(i)}>
                {t.name}
              </button>
            ))}
          </div>
          <button type="button" className="qc-run" onClick={() => run(false)} aria-label="Run again">
            <span aria-hidden="true">▶</span><span className="qc-run-label"> Run again</span>
          </button>
        </div>
        <div className="qc-query" data-testid="console-query">
          {human ? <span className="qc-comment">{query}</span> : highlightSql(query)}
          {phase === "typing" && <span className="qc-caret" aria-hidden="true" />}
        </div>
        <div className={`qc-progress ${phase === "executing" ? "is-on" : ""}`} aria-hidden="true"><i /></div>
        <table className="qc-table">
          <thead>
            <tr>
              <th scope="col" data-col="key">{table.columns[0]}</th>
              <th scope="col">{human ? "" : table.columns[1]}</th>
              <th scope="col">{table.columns[2]}</th>
            </tr>
          </thead>
          <tbody ref={rowsRef} data-testid="console-rows" hidden={!showRows}>
            {table.rows.map((row) => (
              <tr
                key={`${table.name}-${row.key}`}
                data-row
                data-layer={isLayers ? row.key : undefined}
                data-slug={isProjects ? row.slug : undefined}
                tabIndex={isLayers ? 0 : undefined}
                className={isLayers || isProjects ? "qc-row--interactive" : undefined}
                onMouseEnter={isLayers ? () => crossHighlight(row.key) : isProjects ? () => highlightCase(row.slug ?? null) : undefined}
                onMouseLeave={isLayers ? () => crossHighlight(null) : isProjects ? () => highlightCase(null) : undefined}
                onFocus={isLayers ? () => crossHighlight(row.key) : isProjects ? () => highlightCase(row.slug ?? null) : undefined}
                onBlur={isLayers ? () => crossHighlight(null) : isProjects ? () => highlightCase(null) : undefined}
              >
                <td data-col="key">{isProjects ? <button type="button" className="qc-link" data-slug={row.slug} onClick={(e) => openCase(row, e.currentTarget.closest("tr")!)}>{row.key}</button> : row.key}</td>
                <td className="qc-value">{row.value}</td>
                <td className="qc-note">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="qc-foot" data-testid="console-footer" aria-live="polite">
          <span>{showRows && phase === "done" ? `${table.rows.length} row${table.rows.length === 1 ? "" : "s"}` : phase === "executing" ? "executing…" : ""}</span>
          <span className="qc-ok">{phase === "done" && age ? `✓ ${data.ms} ms · ${age}` : ""}</span>
        </div>
      </div>
      <p className="qc-why">This panel queries this site&apos;s own database each time the page is rebuilt.</p>
    </div>
  );
}
