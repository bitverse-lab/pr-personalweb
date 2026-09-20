export default function HealthStat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="col">
      <div className="card rounded shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small mb-1">{label}</div>
          <div className="h4 mb-0">{value}</div>
          {hint && <div className="text-muted small">{hint}</div>}
        </div>
      </div>
    </div>
  );
}
