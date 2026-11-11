"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { buildCorpus, matchRequirements, splitRequirements, type Evidence, type RequirementResult } from "@/features/match/match";
import type { Snapshot } from "@/features/sandbox/snapshot";
import type { EmbedRequest, EmbedResponse } from "./embed.worker";

const SAMPLE = `Backend / Data Engineer

Requirements:
- 2+ years building REST APIs with Python (FastAPI or Django) or Node.js
- Strong SQL and PostgreSQL, including indexing and query tuning
- Experience deploying machine learning models to production
- Comfortable with Docker and CI/CD pipelines
- Can explain technical trade-offs to non-technical stakeholders
- Experience with Kubernetes
- Fluent in English and Bahasa Indonesia

Benefits: health insurance, paid leave, hybrid working`;

const KIND: Record<Evidence["kind"], string> = { project: "project", achievement: "done", article: "wrote", testimonial: "said of me", skill: "skill" };
const VIA = { skill: { label: "tool", title: "names a tool you asked for" }, layer: { label: "area", title: "work in the area you asked about" }, meaning: { label: "meaning", title: "similar in meaning" } };

type Smart = { state: "off" } | { state: "loading"; loaded: number; total: number } | { state: "on" } | { state: "failed"; message: string };

/** Runs one request through the embedding worker and resolves with its vectors. */
function embedWith(worker: Worker, texts: string[], id: number): Promise<number[][]> {
  return new Promise((resolve, reject) => {
    const onMessage = (e: MessageEvent<EmbedResponse>) => {
      if (e.data.type === "vectors" && e.data.id === id) {
        worker.removeEventListener("message", onMessage);
        resolve(e.data.vectors);
      } else if (e.data.type === "error") {
        worker.removeEventListener("message", onMessage);
        reject(new Error(e.data.message));
      }
    };
    worker.addEventListener("message", onMessage);
    worker.postMessage({ type: "embed", id, texts } satisfies EmbedRequest);
  });
}

export default function JdMatcher() {
  const [jd, setJd] = useState("");
  const [corpus, setCorpus] = useState<Evidence[] | null>(null);
  const [requirements, setRequirements] = useState<string[] | null>(null);
  const [vectors, setVectors] = useState<{ requirements: number[][]; corpus: number[][] } | null>(null);
  const [smart, setSmart] = useState<Smart>({ state: "off" });
  const worker = useRef<Worker | null>(null);
  const corpusVectors = useRef<number[][] | null>(null);
  const nextId = useRef(1);

  // The evidence is this site's public data, the same snapshot the live SQL console uses.
  useEffect(() => {
    let alive = true;
    fetch("/api/snapshot")
      .then((r) => r.json() as Promise<Snapshot>)
      .then((s) => alive && setCorpus(buildCorpus(s)))
      .catch(() => alive && setCorpus([]));
    return () => {
      alive = false;
      worker.current?.terminate();
    };
  }, []);

  const skills = useMemo(() => (corpus ?? []).filter((e) => e.kind === "skill").map((e) => e.label.toLowerCase()), [corpus]);
  const results: RequirementResult[] | null = useMemo(
    () => (requirements && corpus ? matchRequirements(requirements, corpus, skills, vectors ?? undefined) : null),
    [requirements, corpus, skills, vectors],
  );

  const embedRequirements = async (reqs: string[]) => {
    const w = worker.current;
    if (!w || !corpus) return;
    corpusVectors.current ??= await embedWith(w, corpus.map((e) => e.text), nextId.current++);
    setVectors({ requirements: await embedWith(w, reqs, nextId.current++), corpus: corpusVectors.current });
  };

  const analyze = (text = jd) => {
    const reqs = splitRequirements(text);
    setRequirements(reqs);
    setVectors(null);
    if (smart.state === "on") void embedRequirements(reqs).catch((e: Error) => setSmart({ state: "failed", message: e.message }));
  };

  const turnOnSmart = () => {
    setSmart({ state: "loading", loaded: 0, total: 0 });
    const w = new Worker(new URL("./embed.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    const onMessage = (e: MessageEvent<EmbedResponse>) => {
      const m = e.data;
      if (m.type === "progress") setSmart({ state: "loading", loaded: m.loaded, total: m.total });
      else if (m.type === "error") setSmart({ state: "failed", message: m.message });
      else if (m.type === "ready") {
        setSmart({ state: "on" });
        if (requirements) void embedRequirements(requirements).catch((err: Error) => setSmart({ state: "failed", message: err.message }));
      }
    };
    w.addEventListener("message", onMessage);
    w.onerror = () => setSmart({ state: "failed", message: "The model could not start in this browser." });
    w.postMessage({ type: "init" } satisfies EmbedRequest);
  };

  const covered = results?.filter((r) => r.matches.length > 0).length ?? 0;
  const mb = (n: number) => (n / 1024 / 1024).toFixed(1);

  return (
    <div className="jd">
      <div className="jd-input">
        <label htmlFor="jd-text" className="jd-label">Job description</label>
        <textarea
          id="jd-text"
          className="form-control jd-text"
          rows={10}
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the requirements of the role here. It stays in your browser."
        />
        <div className="jd-actions">
          <button type="button" className="btn btn-primary" disabled={!jd.trim() || !corpus} onClick={() => analyze()}>
            Match against my work
          </button>
          <button type="button" className="btn btn-link" onClick={() => { setJd(SAMPLE); analyze(SAMPLE); }} disabled={!corpus}>
            Try a sample
          </button>
        </div>
        <p className="jd-privacy">Nothing you paste is sent anywhere: the matching runs on this page.</p>
      </div>

      {results && (
        <section className="jd-results" aria-labelledby="jd-results-title" aria-live="polite">
          <div className="jd-summary">
            <h2 id="jd-results-title" className="jd-summary-title">
              {covered} of {results.length} requirements have evidence
            </h2>
            <div className="jd-tools">
              {smart.state === "off" && (
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={turnOnSmart}>
                  Also match by meaning <span className="jd-size">downloads a 23 MB model once</span>
                </button>
              )}
              {smart.state === "loading" && (
                <span className="jd-loading" role="status">
                  Loading the model{smart.total ? ` · ${mb(smart.loaded)} / ${mb(smart.total)} MB` : "…"}
                </span>
              )}
              {smart.state === "on" && <span className="jd-on">✓ matching by meaning too</span>}
              {smart.state === "failed" && <span className="jd-failed" role="alert">Meaning match unavailable: {smart.message}</span>}
              <button type="button" className="btn btn-sm btn-link" onClick={() => window.print()}>Print / save as PDF</button>
            </div>
          </div>

          {results.length === 0 ? (
            <p className="jd-note">No requirements found. Paste the part of the ad that lists what the role needs.</p>
          ) : (
            <ol className="jd-list">
              {results.map((r) => (
                <li key={r.requirement} className={r.matches.length ? "jd-req" : "jd-req is-gap"}>
                  <p className="jd-req-text">{r.requirement}</p>
                  {r.matches.length ? (
                    <ul className="jd-evidence">
                      {r.matches.map((m) => (
                        <li key={m.evidence.id}>
                          <span className={`jd-kind jd-kind--${m.evidence.kind}`}>{KIND[m.evidence.kind]}</span>
                          <Link href={m.evidence.href} className="jd-ev-link">{m.evidence.label}</Link>
                          <span className="jd-score" title={VIA[m.via].title}>
                            {VIA[m.via].label} · {Math.round(m.score * 100)}%
                          </span>
                          {(m.evidence.kind === "achievement" || m.evidence.kind === "testimonial") && <span className="jd-ev-text">{m.evidence.kind === "testimonial" ? `“${m.evidence.text}”` : m.evidence.text}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="jd-gap">No direct evidence on this site. Worth asking me about in an interview.</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
