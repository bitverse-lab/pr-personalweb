/**
 * A health number with an optional progress ring (0..1+ of a target). The ring makes "how far
 * along" readable at a glance; over 100% it turns green, or amber where going over is not the
 * point (calories).
 */
export default function HealthStat({
  label,
  value,
  hint,
  progress,
  overIsBad,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  progress?: number | null;
  overIsBad?: boolean;
}) {
  const hasRing = progress !== undefined && progress !== null;
  const pct = hasRing ? Math.max(0, progress) : 0;
  const tone = !hasRing ? "" : pct > 1 ? (overIsBad ? "is-over" : "is-done") : pct >= 1 ? "is-done" : "";
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="col">
      <div className="card rounded shadow-sm h-100">
        <div className="card-body health-stat">
          <div className="health-stat-text">
            <div className="health-stat-label">{label}</div>
            <div className="health-stat-value">{value}</div>
            {hint && <div className="health-stat-hint">{hint}</div>}
          </div>
          {hasRing && (
            <svg className={`health-ring ${tone}`} viewBox="0 0 52 52" width="52" height="52" role="img" aria-label={`${Math.round(pct * 100)}% of target`}>
              <circle cx="26" cy="26" r={r} className="health-ring-track" />
              <circle cx="26" cy="26" r={r} className="health-ring-fill" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct))} />
              <text x="26" y="30" textAnchor="middle" className="health-ring-text">
                {Math.round(pct * 100)}%
              </text>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
