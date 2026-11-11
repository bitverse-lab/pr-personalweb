"use client";

import { useState } from "react";
import { CLOUD_YEAR_EVENT } from "@/components/home/EmbeddingCloud";
import { asOf, type Timeline } from "@/features/projects/timeline";
import { useDict } from "@/lib/i18n/context";

// A slider from the first dated year to now. The hero cloud behind it shows the stack as it was at
// the end of that year: skills appear the year dated work first used them, projects the year they
// started. The caption carries the same facts in words, so nothing depends on seeing the canvas.
export default function CareerScrubber({ timeline }: { timeline: Timeline }) {
  const t = useDict().career;
  const [year, setYear] = useState(timeline.to);
  const now = year === timeline.to;
  const facts = asOf(timeline, year);
  const dated = Object.keys(timeline.skills).length;
  const caption = now
    ? `${t.datedSkills(facts.skills)} · ${t.projects(facts.projects)}`
    : `${t.skills(facts.skills)} · ${t.projects(facts.projects)}${facts.newSkills.length ? ` · ${t.newSkills}: ${facts.newSkills.join(", ")}` : ""}`;

  const move = (y: number) => {
    setYear(y);
    window.dispatchEvent(new CustomEvent(CLOUD_YEAR_EVENT, { detail: y === timeline.to ? null : y }));
  };

  return (
    <div className="career">
      <label htmlFor="career-year" className="career-label">
        {t.label}
      </label>
      <span className="career-end" aria-hidden="true">{timeline.from}</span>
      <input
        id="career-year"
        type="range"
        className="career-range"
        min={timeline.from}
        max={timeline.to}
        step={1}
        value={year}
        onChange={(e) => move(Number(e.target.value))}
        aria-valuetext={`${year}: ${caption}`}
      />
      <span className="career-end" aria-hidden="true">{timeline.to}</span>
      <p className="career-caption" aria-live="polite" title={t.source(dated)}>
        <strong>{now ? t.today : year}</strong> {caption}
      </p>
    </div>
  );
}
