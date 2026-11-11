"use client";

import { EVENT_CATEGORY, EVENT_COLOR_KEYS, EVENT_COLORS } from "@/features/calendar/colors";
import type { EventColor } from "@/db/schema/productivity";

/** Named categories as a radio group of small chips: colour plus word, never colour alone. */
export default function CategoryPicker({
  value,
  onChange,
  labelledBy,
}: {
  value: EventColor;
  onChange: (next: EventColor) => void;
  labelledBy: string;
}) {
  return (
    <div className="cal-cats" role="radiogroup" aria-labelledby={labelledBy}>
      {EVENT_COLOR_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          className={`cal-cat${value === key ? " is-on" : ""}`}
          onClick={() => onChange(key)}
        >
          <span className="cal-cat-dot" style={{ background: EVENT_COLORS[key] }} aria-hidden />
          {EVENT_CATEGORY[key]}
        </button>
      ))}
    </div>
  );
}
