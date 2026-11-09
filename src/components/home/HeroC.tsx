"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiDownload } from "react-icons/fi";
import QueryConsole from "@/components/home/QueryConsole";
import type { ConsoleData } from "@/lib/data/console";
import type { Profile } from "@/lib/data/profile";

/** The home hero: the owner's name, one positioning line, and their CV as a live query. */
export default function HeroC({ profile, console: data }: { profile: Profile; console: ConsoleData | null }) {
  const [human, setHuman] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const words = profile.fullName.split(/\s+/).filter(Boolean);
  const availability = profile.availableForWork ? ["Open to full-time roles", profile.location].filter(Boolean).join(", ") : profile.location;

  // Name reveal: lines rise out of their own masks once, on arrival (CSS handles reduced motion).
  useEffect(() => {
    titleRef.current?.classList.add("is-in");
  }, []);

  return (
    <section className="hero-c" aria-labelledby="hero-title">
      <div className="container">
        <div className="hero-c-grid">
          <div className="hero-c-copy">
            <h1 id="hero-title" className="hero-c-title" ref={titleRef}>
              {words.map((w, i) => (
                <span className="hero-c-line" key={`${w}-${i}`}>
                  <span style={{ transitionDelay: `${i * 0.1}s` }} className={i === words.length - 1 ? "hero-c-accent" : undefined}>
                    {w}
                    {i === words.length - 1 ? "." : ""}
                  </span>
                </span>
              ))}
            </h1>
            {profile.tagline && <p className="hero-c-role">{profile.tagline}</p>}
            {availability && <p className="hero-c-availability mono-meta">{availability}</p>}
            <div className="hero-c-cta">
              <Link href="#work" className="btn btn-primary">See my work</Link>
              <a href="/cv/download" className="btn btn-outline-dark d-inline-flex align-items-center gap-2">
                <FiDownload aria-hidden /> Download CV
              </a>
            </div>
            {data && (
              <div className="hero-c-plain">
                <button type="button" role="switch" aria-checked={human} aria-labelledby="plain-label" className="hero-c-switch" onClick={() => setHuman((h) => !h)} />
                <span id="plain-label">Show in plain language</span>
              </div>
            )}
          </div>
          {data && <QueryConsole data={data} human={human} />}
        </div>
      </div>
    </section>
  );
}
