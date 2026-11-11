"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FiDownload } from "react-icons/fi";
import QueryConsole from "@/components/home/QueryConsole";
import EmbeddingCloud from "@/components/home/EmbeddingCloud";
import CareerScrubber from "@/components/home/CareerScrubber";
import type { ConsoleData } from "@/lib/data/console";
import type { Profile } from "@/lib/data/profile";
import { useDict } from "@/lib/i18n/context";

// Loaded only when a visitor asks for it: it brings a WebAssembly Postgres with it.
const LiveConsole = dynamic(() => import("@/components/home/LiveConsole"), { ssr: false });

/** The home hero: the owner's name, one positioning line, and their CV as a live query. */
export default function HeroC({ profile, console: data }: { profile: Profile; console: ConsoleData | null }) {
  const t = useDict().hero;
  const [human, setHuman] = useState(false);
  const [live, setLive] = useState(false);
  const words = profile.fullName.split(/\s+/).filter(Boolean);
  // The cloud is built from the same rows the console shows: stack layers and published projects.
  const cloud = useMemo(() => {
    const stack = data?.tables.find((t) => t.name === "stack.sql");
    const projects = data?.tables.find((t) => t.name === "projects.sql");
    return {
      layers: (stack?.rows ?? []).map((r) => ({ name: r.key, skills: r.note.split(",").map((s) => s.trim()).filter(Boolean) })),
      projects: (projects?.rows ?? []).filter((r) => r.slug).map((r) => ({ slug: r.slug!, title: r.key, layers: r.layers ?? [] })),
    };
  }, [data]);
  const availability = profile.availableForWork ? [t.openToWork, profile.location].filter(Boolean).join(", ") : profile.location;

  return (
    <section className="hero-c" id="intro" aria-labelledby="hero-title">
      {cloud.layers.length > 0 && <EmbeddingCloud layers={cloud.layers} projects={cloud.projects} timeline={data?.timeline ?? null} />}
      <div className="container">
        <div className="hero-c-grid">
          <div className="hero-c-copy">
            <h1 id="hero-title" className="hero-c-title">
              {words.map((w, i) => (
                <span className="hero-c-line" key={`${w}-${i}`}>
                  <span style={{ animationDelay: `${i * 0.1}s` }} className={i === words.length - 1 ? "hero-c-accent" : undefined}>
                    {w}
                    {i === words.length - 1 ? "." : ""}
                  </span>
                </span>
              ))}
            </h1>
            {profile.tagline && <p className="hero-c-role">{profile.tagline}</p>}
            {availability && <p className="hero-c-availability mono-meta">{availability}</p>}
            <div className="hero-c-cta">
              <Link href="#work" className="btn btn-primary">{t.seeWork}</Link>
              <a href="/cv/download" className="btn btn-outline-dark d-inline-flex align-items-center gap-2">
                <FiDownload aria-hidden /> {t.downloadCv}
              </a>
            </div>
            <Link href="/match" className="hero-c-match d-block">{t.match}</Link>
            {data && !live && (
              <button type="button" className="hero-c-live" onClick={() => setLive(true)}>
                <span aria-hidden="true">▶</span> {t.live} <span className="hero-c-live-note">{t.liveNote}</span>
              </button>
            )}
            {data && !live && (
              <div className="hero-c-plain">
                <button type="button" role="switch" aria-checked={human} aria-labelledby="plain-label" className="hero-c-switch" onClick={() => setHuman((h) => !h)} />
                <span id="plain-label">{t.plain}</span>
              </div>
            )}
            {data?.timeline && cloud.layers.length > 0 && <CareerScrubber timeline={data.timeline} />}
          </div>
          {data && (live ? <LiveConsole onExit={() => setLive(false)} /> : <QueryConsole data={data} human={human} />)}
        </div>
      </div>
    </section>
  );
}
