"use client";

import { useEffect, useRef, useState } from "react";
import type { ArchNode } from "@/features/architecture/nodes";

type Node = ArchNode & { excerpt: { code: string; line: number } | null };
interface Trace {
  server: number;
  cache: { ms: number; ok: boolean };
  db: { ms: number; ok: boolean };
  region: string | null;
}
type Hops = Record<ArchNode["id"], { ms: number; ok: boolean; label: string }>;

/** Splits one measured trip into the time spent at each stop. */
function hopsOf(trace: Trace, roundTrip: number): Hops {
  // A cache hit takes well under a millisecond; one decimal keeps it from reading as "0 ms".
  const r = (n: number) => (n < 10 ? Math.max(0, Math.round(n * 10) / 10) : Math.round(n));
  return {
    browser: { ms: r(roundTrip - trace.server), ok: true, label: "network, there and back" },
    server: { ms: r(trace.server - trace.cache.ms - trace.db.ms), ok: true, label: "handler" },
    cache: { ms: r(trace.cache.ms), ok: trace.cache.ok, label: trace.cache.ok ? "cached read" : "read failed, page degrades" },
    db: { ms: r(trace.db.ms), ok: trace.db.ok, label: trace.db.ok ? "round trip" : "unreachable" },
  };
}

export default function RequestTrace({ nodes }: { nodes: Node[] }) {
  const [hops, setHops] = useState<Hops | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [active, setActive] = useState<number>(-1);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<ArchNode["id"] | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = async () => {
    setBusy(true);
    setFailed(false);
    timers.current.forEach(clearTimeout);
    setActive(-1);
    try {
      const started = performance.now();
      // No `cache: "no-store"` here: it makes the browser send Cache-Control: no-cache, which tells
      // Next to skip its data cache, so the cache hop would always measure a miss. The response is
      // already no-store.
      const res = await fetch("/api/trace");
      const trace = (await res.json()) as Trace;
      const roundTrip = performance.now() - started;
      const measured = hopsOf(trace, roundTrip);
      setHops(measured);
      setTotal(Math.round(roundTrip));
      setRegion(trace.region);
      // Replay the trip stop by stop, each lit for a time scaled from what it really took.
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        let at = 0;
        nodes.forEach((n, i) => {
          timers.current.push(window.setTimeout(() => setActive(i), at));
          at += Math.min(900, 220 + measured[n.id].ms * 3);
        });
        timers.current.push(window.setTimeout(() => setActive(-1), at));
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const summary = hops && total !== null ? `Round trip ${total} ms: ${nodes.map((n) => `${n.id === "browser" ? "network" : n.name.toLowerCase()} ${hops[n.id].ms} ms${hops[n.id].ok ? "" : " (failed)"}`).join(", ")}.` : "";
  const shown = open ? nodes.find((n) => n.id === open) : null;

  return (
    <div className="arch">
      <div className="arch-actions">
        <button type="button" className="btn btn-primary" onClick={send} disabled={busy}>
          {busy ? "Sending…" : hops ? "Send another" : "Send a request"}
        </button>
        <p className="arch-total mono-meta" aria-live="polite">
          {failed ? "The request did not come back. Try again in a moment." : summary ? `${summary}${region ? ` Server region ${region}.` : ""}` : "Nothing sent yet."}
        </p>
      </div>

      <ol className="arch-path">
        {nodes.map((n, i) => {
          const hop = hops?.[n.id];
          return (
            <li key={n.id} className={`arch-stop ${active === i ? "is-active" : ""} ${hop && !hop.ok ? "is-failed" : ""}`}>
              <button type="button" className="arch-node" aria-expanded={open === n.id} aria-controls="arch-detail" onClick={() => setOpen(open === n.id ? null : n.id)}>
                <span className="arch-name">{n.name}</span>
                <span className="arch-where mono-meta">{n.where}</span>
                <span className="arch-ms mono-meta">{hop ? `${hop.ms} ms · ${hop.label}` : "—"}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div id="arch-detail" className="arch-detail" hidden={!shown}>
        {shown && (
          <>
            <h2 className="arch-detail-title">{shown.name}</h2>
            <p className="arch-decision">{shown.decision}</p>
            {shown.excerpt && (
              <figure className="arch-code">
                <pre>
                  <code>{shown.excerpt.code}</code>
                </pre>
                <figcaption className="mono-meta">
                  {shown.source.file}:{shown.excerpt.line}
                </figcaption>
              </figure>
            )}
          </>
        )}
      </div>
    </div>
  );
}
