import Link from "next/link";
import { FiEdit3 } from "react-icons/fi";
import HealthStat from "@/components/me/health/HealthStat";
import JournalCalendar from "@/components/me/content/JournalCalendar";
import JournalList from "@/components/me/content/JournalList";
import MoodTrendChart from "@/components/me/content/MoodTrendChart";
import MePageHeader from "@/components/me/MePageHeader";
import { getJournalOverview, openJournalDay } from "@/features/content/journal-actions";
import { PROMPTS, moodLabel, promptForDate } from "@/features/content/journal-meta";

type Search = { q?: string; tag?: string; month?: string; limit?: string };

export default async function JournalPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const limit = Math.min(200, Math.max(30, Number(sp.limit) || 30));
  const o = await getJournalOverview({ q: sp.q, tag: sp.tag, month: sp.month, limit });

  const link = (over: Partial<Search> = {}) => {
    const params = new URLSearchParams();
    const merged = { q: sp.q, tag: sp.tag, month: sp.month, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return `/me/journal${s ? `?${s}` : ""}`;
  };
  const filtered = !!sp.q || !!sp.tag;
  const wroteToday = o.todayEntry.words > 0;

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
        <MePageHeader title="Journal" description="A private place to write. Nobody else can see it." />
        <form action={openJournalDay}>
          <input type="hidden" name="date" value={o.today} />
          <button type="submit" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1">
            <FiEdit3 /> {wroteToday ? "Continue today's entry" : "Write today's entry"}
          </button>
        </form>
      </div>

      <div className="row row-cols-2 row-cols-lg-4 g-2 mb-4">
        <HealthStat label="Streak" value={`${o.stats.streak} day${o.stats.streak === 1 ? "" : "s"}`} hint="days in a row" />
        <HealthStat label="Entries this month" value={o.stats.monthCount} hint={`${o.stats.total} in total`} />
        <HealthStat label="Words this month" value={o.stats.monthWords.toLocaleString("en-US")} hint="across all entries" />
        <HealthStat
          label="Average mood"
          value={o.stats.avgMood ?? "—"}
          hint={o.stats.avgMood ? `mostly ${moodLabel(Math.round(o.stats.avgMood))?.toLowerCase()} this month` : "no moods logged this month"}
        />
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card rounded shadow-sm">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h6 className="mb-0">Entries</h6>
                <form action="/me/journal" role="search" className="d-flex gap-2">
                  {sp.tag && <input type="hidden" name="tag" value={sp.tag} />}
                  <input name="q" className="form-control form-control-sm" style={{ width: 220 }} placeholder="Search your journal…" aria-label="Search journal" defaultValue={sp.q ?? ""} />
                  <button type="submit" className="btn btn-sm btn-outline-primary">Search</button>
                </form>
              </div>
              {(o.tags.length > 0 || filtered) && (
                <div className="d-flex flex-wrap gap-1 mb-2 align-items-center">
                  {sp.tag && (
                    <Link href={link({ tag: undefined })} className="badge bg-primary text-decoration-none">
                      {sp.tag} ✕
                    </Link>
                  )}
                  {o.tags.filter((t) => t !== sp.tag).map((t) => (
                    <Link key={t} href={link({ tag: t })} className="badge bg-soft-primary text-primary text-decoration-none">
                      {t}
                    </Link>
                  ))}
                  {filtered && (
                    <Link href="/me/journal" className="small ms-2">
                      Clear filters
                    </Link>
                  )}
                </div>
              )}
              <JournalList
                entries={o.list}
                filtered={filtered}
                // Plain strings, not a function: the list is a client component and props must serialise.
                tagHrefs={Object.fromEntries(Array.from(new Set(o.list.flatMap((e) => e.tags)), (t) => [t, link({ tag: t })]))}
              />
              {o.listTruncated && (
                <div className="text-center mt-3">
                  <Link href={link({ limit: String(limit + 30) })} className="btn btn-sm btn-outline-primary">
                    Show more
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <JournalCalendar month={o.month} today={o.today} entries={o.monthEntries} hrefFor={(m) => link({ month: m })} />

          <div className="card rounded shadow-sm mb-3">
            <div className="card-body">
              <h6 className="mb-2">Today&apos;s prompt</h6>
              <p className="fst-italic mb-3">{PROMPTS[promptForDate(o.today)]}</p>
              <form action={openJournalDay}>
                <input type="hidden" name="date" value={o.today} />
                <button type="submit" className="btn btn-sm btn-outline-primary">Write about it</button>
              </form>
            </div>
          </div>

          <div className="card rounded shadow-sm mb-3">
            <div className="card-body">
              <h6 className="mb-2">Mood — last 30 days</h6>
              {o.moodSeries.length === 0 ? (
                <p className="text-muted small mb-0">Pick a mood on an entry to see the trend.</p>
              ) : (
                <MoodTrendChart data={o.moodSeries} />
              )}
            </div>
          </div>

          <div className="card rounded shadow-sm">
            <div className="card-body">
              <h6 className="mb-2">On this day</h6>
              {o.onThisDay.length === 0 ? (
                <p className="text-muted small mb-0">Entries from this date in earlier years will show up here.</p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {o.onThisDay.map((e) => (
                    <li key={e.id} className="py-2 border-top">
                      <Link href={`/me/journal/${e.id}`} className="text-decoration-none text-dark d-block">
                        <strong>{new Date(`${e.date}T00:00:00Z`).getUTCFullYear()}</strong>
                        <span className="text-muted small text-truncate d-block">{e.title || e.snippet || "(no text)"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
