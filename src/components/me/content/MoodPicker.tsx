"use client";

import { MOODS, MOOD_COLOR } from "@/features/content/journal-meta";

export default function MoodPicker({ value, onChange }: { value: number | null; onChange: (mood: number | null) => void }) {
  return (
    <div role="radiogroup" aria-label="Mood" className="d-flex flex-wrap gap-2">
      {MOODS.map(({ value: v, label, Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            className={`btn btn-sm d-inline-flex align-items-center gap-1 ${active ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => onChange(active ? null : v)}
          >
            {!active && <span className="mood-dot" style={{ background: MOOD_COLOR[v] }} aria-hidden />}
            <Icon aria-hidden /> {label}
          </button>
        );
      })}
    </div>
  );
}
