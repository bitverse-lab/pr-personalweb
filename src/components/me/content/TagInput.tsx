"use client";

import { useId, useState } from "react";
import { FiX } from "react-icons/fi";

export default function TagInput({
  tags,
  onChange,
  suggestions = [],
  max = 10,
  label = "Tags",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  max?: number;
  label?: string;
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  const add = (raw: string) => {
    const name = raw.trim().replace(/,+$/, "").trim().slice(0, 30);
    if (!name || tags.length >= max || tags.some((t) => t.toLowerCase() === name.toLowerCase())) return setDraft("");
    onChange([...tags, name]);
    setDraft("");
  };

  return (
    <div>
      <label className="form-label small mb-1" htmlFor={`${listId}-input`}>{label}</label>
      <div className="form-control d-flex flex-wrap align-items-center gap-1" style={{ height: "auto", minHeight: 38 }}>
        {tags.map((t) => (
          <span key={t} className="badge bg-soft-primary text-primary d-inline-flex align-items-center gap-1">
            {t}
            <button type="button" className="btn p-0 border-0 lh-1 text-primary" aria-label={`Remove tag ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}>
              <FiX size={12} />
            </button>
          </span>
        ))}
        <input
          id={`${listId}-input`}
          list={`${listId}-list`}
          className="border-0 flex-grow-1"
          style={{ outline: "none", minWidth: 100, background: "transparent" }}
          placeholder={tags.length >= max ? `Max ${max} tags` : "Add a tag…"}
          disabled={tags.length >= max}
          value={draft}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1));
          }}
          onBlur={() => draft.trim() && add(draft)}
        />
      </div>
      <datalist id={`${listId}-list`}>
        {suggestions.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())).map((s) => (<option key={s} value={s} />))}
      </datalist>
    </div>
  );
}
