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
    <span className="badge bg-light text-dark d-inline-flex align-items-center gap-1" style={{ borderLeft: `4px solid ${MOOD_COLOR[found.value]}` }}>
      <Icon aria-hidden /> {label}
    </span>
  );
}

export default function JournalList({ entries, filtered, tagHref }: { entries: JournalSummary[]; filtered: boolean; tagHref: (tag: string) => string }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={FiBook}
        title={filtered ? "No entries match" : "No journal entries yet"}
        description={filtered ? "Try a different search or tag." : "Write today's entry — it stays private to you."}
      />
    );
  }
  return (
    <ul className="list-unstyled mb-0">
      {entries.map((e) => (
        <li key={e.id} className="py-3 border-top">
          <Link href={`/me/journal/${e.id}`} className="text-decoration-none text-dark d-block">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <strong>{e.title || fmt(e.date)}</strong>
              {e.title && <span className="text-muted small">{fmt(e.date)}</span>}
              <MoodBadge mood={e.mood} />
            </div>
            {e.snippet && <div className="text-muted small text-truncate">{e.snippet}</div>}
          </Link>
          <div className="d-flex flex-wrap gap-1 mt-1 align-items-center">
            <span className="text-muted small me-1">{e.wordCount} words</span>
            {e.tags.map((t) => (
              <Link key={t} href={tagHref(t)} className="badge bg-soft-primary text-primary text-decoration-none">
                {t}
              </Link>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
