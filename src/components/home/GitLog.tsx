import type { ExperienceEntry } from "@/lib/data/profile";

// Experience read as `git log --graph`: each role a commit on main, newest on top, the current one
// at HEAD; achievements are the diff, as added lines. The hash is a stable label made from the role
// itself (decorative, hidden from assistive tech) — the content is the CV, unchanged.
function shortHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

export default function GitLog({ entries }: { entries: ExperienceEntry[] }) {
  return (
    <ol className="glog list-unstyled mb-0">
      {entries.map((e, i) => (
        <li className={`glog-commit ${e.current ? "is-head" : ""}`} key={`${e.company}-${e.period}-${i}`}>
          <span className="glog-node" aria-hidden="true" />
          <p className="glog-line mono-meta mb-1">
            <span className="glog-hash" aria-hidden="true">{shortHash(`${e.role}|${e.company}|${e.period}`)}</span>
            {e.current && <span className="glog-ref">HEAD → now</span>}
            <span className="glog-date">{e.period}</span>
          </p>
          <h3 className="glog-role">
            {e.role} <span className="glog-at">@ {e.company}</span>
          </h3>
          {e.location && <p className="glog-meta">{e.location}</p>}
          {e.description && <p className="glog-desc">{e.description}</p>}
          {e.achievements && e.achievements.length > 0 && (
            <ul className="glog-diff" aria-label="What changed">
              {e.achievements.map((a) => (
                <li key={a}>
                  <span aria-hidden="true">+ </span>
                  {a}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
