export default function SubtaskProgress({ subtasks }: { subtasks: { done: boolean }[] }) {
  if (subtasks.length === 0) return null;
  const done = subtasks.filter((s) => s.done).length;
  const percent = Math.round((done / subtasks.length) * 100);

  return (
    <div className="d-inline-flex align-items-center gap-2" style={{ minWidth: 90 }}>
      <span className="text-muted small">
        {done}/{subtasks.length}
      </span>
      <div
        className="progress flex-grow-1"
        style={{ height: 4 }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Checklist progress"
      >
        <div className="progress-bar bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
