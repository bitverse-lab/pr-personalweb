import type { ExperienceEntry } from "@/lib/data/profile";
import { dict } from "@/lib/i18n/dict";
import type { Locale } from "@/lib/i18n/locale";

// One column, read top to bottom: when (mono) on the left, what on the right. Replaces the template's
// alternating two-sided timeline, whose right-aligned bullets were hard to read.
export default function ExperienceTimeline({ entries, locale = "en" }: { entries: ExperienceEntry[]; locale?: Locale }) {
  const t = dict(locale).experience;
  return (
    <ol className="xp list-unstyled mb-0">
      {entries.map((entry, index) => (
        <li className={entry.current ? "xp-item xp-item--current" : "xp-item"} key={`${entry.company}-${entry.period}-${index}`}>
          <p className="xp-when mono-meta mb-0">
            {entry.period}
            {entry.current && <span className="xp-now"> · {t.now}</span>}
          </p>
          <div className="xp-what">
            <h3 className="xp-role">{entry.role}</h3>
            <p className="xp-company">
              {entry.company}
              {entry.location ? <span className="xp-location"> · {entry.location}</span> : null}
            </p>
            {entry.description && <p className="xp-desc">{entry.description}</p>}
            {entry.achievements && entry.achievements.length > 0 && (
              <ul className="xp-wins">
                {entry.achievements.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
