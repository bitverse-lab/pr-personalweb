import Link from "next/link";
import { FiBook, FiEdit3 } from "react-icons/fi";
import EmptyState from "@/components/shared/EmptyState";
import { openJournalDay } from "@/features/content/journal-actions";

export interface JournalPreview {
  id: string;
  title: string;
  dateLabel?: string;
}

export interface JournalSummaryData {
  today: string;
  todayWords: number;
  streak: number;
  entries: JournalPreview[];
  drafts: number;
  published: number;
}

export default function JournalSection({ summary }: { summary?: JournalSummaryData }) {
  const entries = summary?.entries ?? [];
  return (
    <div className="card rounded shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="card-title mb-0">Journal &amp; Writing</h6>
          <Link href="/me/journal" className="small">
            Open
          </Link>
        </div>

        {summary && (
          <form action={openJournalDay} className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <input type="hidden" name="date" value={summary.today} />
            <span className="small text-muted">
              {summary.todayWords > 0 ? `${summary.todayWords} words written today` : "Nothing written today yet"}
              {summary.streak > 0 && ` · ${summary.streak}-day streak`}
            </span>
            <button type="submit" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1">
              <FiEdit3 /> {summary.todayWords > 0 ? "Continue" : "Write today"}
            </button>
          </form>
        )}

        {entries.length === 0 ? (
          <EmptyState icon={FiBook} title="No journal entries yet" description="Write down what's on your mind whenever you're ready." actionLabel="Open Journal" actionHref="/me/journal" />
        ) : (
          <ul className="list-unstyled mb-0">
            {entries.map((entry) => (
              <li key={entry.id} className="border-top py-2">
                <Link href={`/me/journal/${entry.id}`} className="d-flex justify-content-between text-decoration-none text-dark">
                  <span className="text-truncate me-2">{entry.title}</span>
                  {entry.dateLabel && <span className="text-muted small text-nowrap">{entry.dateLabel}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {summary && (
          <div className="border-top pt-2 mt-2 small d-flex justify-content-between">
            <span className="text-muted">
              Articles: {summary.drafts} draft{summary.drafts === 1 ? "" : "s"} · {summary.published} published
            </span>
            <Link href="/me/articles">Manage</Link>
          </div>
        )}
      </div>
    </div>
  );
}
