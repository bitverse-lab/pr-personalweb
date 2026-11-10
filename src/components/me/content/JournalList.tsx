"use client";

import { useState } from "react";
import Link from "next/link";
import { FiBook } from "react-icons/fi";
import EmptyState from "@/components/shared/EmptyState";
import { MOODS, MOOD_COLOR } from "@/features/content/journal-meta";
import type { JournalSummary } from "@/server/services/journal-service";

const fmt = (d: string, withYear = true) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" });

export function MoodBadge({ mood }: { mood: number | null }) {
  const found = MOODS.find((m) => m.value === mood);
  if (!found) return null;
  const { Icon, label } = found;
  return (
    <span className="badge bg-light text-dark d-inline-flex align-items-center gap-1">
      <span className="mood-dot" style={{ background: MOOD_COLOR[found.value] }} aria-hidden />
      <Icon aria-hidden /> {label}
    </span>
  );
}

export default function JournalList({ entries, filtered, tagHrefs }: { entries: JournalSummary[]; filtered: boolean; tagHrefs: Record<string, string> }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={FiBook}
        title={filtered ? "No entries match" : "No journal entries yet"}
        description={filtered ? "Try a different search or tag." : "Write today's entry — it stays private to you."}
      />
    );
  }
  return <GroupedEntries entries={entries} tagHrefs={tagHrefs} />;
}

const PAGE = 15;

/**
 * Entries under month headings, the most recent page first: a year of daily writing otherwise
 * becomes one endless column.
 */
function GroupedEntries({ entries, tagHrefs }: { entries: JournalSummary[]; tagHrefs: Record<string, string> }) {
  const [shown, setShown] = useState(PAGE);
  const months: { key: string; label: string; items: JournalSummary[] }[] = [];
  for (const e of entries.slice(0, shown)) {
    const key = e.date.slice(0, 7);
    let month = months.find((m) => m.key === key);
    if (!month) {
      month = { key, label: new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }), items: [] };
      months.push(month);
    }
    month.items.push(e);
  }
  const perMonth = (key: string) => entries.filter((e) => e.date.startsWith(key)).length;

  return (
    <>
      {months.map((m) => (
        <section key={m.key} className="jr-month" aria-label={m.label}>
          <h3 className="jr-month-h">
            {m.label} <span className="jr-month-n">{perMonth(m.key)} {perMonth(m.key) === 1 ? "entry" : "entries"}</span>
          </h3>
          <ul className="list-unstyled mb-0">
            {m.items.map((e) => (
              <li key={e.id} className="jr-row">
                <Link href={`/me/journal/${e.id}`} className="jr-link">
                  <span className="jr-date">
                    <span className="jr-day">{new Date(`${e.date}T00:00:00Z`).getUTCDate()}</span>
                    <span className="jr-wd">{new Date(`${e.date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}</span>
                  </span>
                  <span className="jr-body">
                    <span className="jr-title">
                      <strong>{e.title || fmt(e.date, false)}</strong>
                      <MoodBadge mood={e.mood} />
                    </span>
                    {e.snippet && <span className="jr-snippet">{e.snippet}</span>}
                  </span>
                </Link>
                <div className="jr-meta">
                  <span>{e.wordCount} words</span>
                  {e.tags.map((t) => (
                    <Link key={t} href={tagHrefs[t] ?? `/me/journal?tag=${encodeURIComponent(t)}`} className="task-tag">
                      #{t}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {entries.length > shown && (
        <button type="button" className="btn btn-sm btn-outline-primary border-0 mt-2" onClick={() => setShown((n) => n + PAGE * 2)}>
          Show older entries ({entries.length - shown} more)
        </button>
      )}
    </>
  );
}
