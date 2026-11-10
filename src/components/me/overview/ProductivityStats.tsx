import { FiAlertTriangle, FiArrowDown, FiArrowUp, FiMinus, FiZap } from "react-icons/fi";
import type { ActivityPoint } from "./ProductivityHeatmap";
import { addDaysTo } from "@/features/tasks/dates";

function computeStats(activity: ActivityPoint[], today: string) {
  const counts = new Map(activity.map((point) => [point.day, point.count]));
  const on = (offset: number) => counts.get(addDaysTo(today, -offset)) ?? 0;

  // Streak counts back from today, or from yesterday if nothing is done yet today.
  let streak = 0;
  let offset = on(0) > 0 ? 0 : 1;
  while (offset < 90 && on(offset) > 0) {
    streak++;
    offset++;
  }

  let thisWeek = 0;
  let lastWeek = 0;
  for (let i = 0; i < 7; i++) {
    thisWeek += on(i);
    lastWeek += on(i + 7);
  }
  return { streak, thisWeek, lastWeek };
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="col">
      <div className="rounded p-3 h-100" style={{ background: "var(--app-surface)" }}>
        <div className="text-muted small mb-1">{label}</div>
        {children}
      </div>
    </div>
  );
}

export default function ProductivityStats({ activity, overdue, today }: { activity: ActivityPoint[]; overdue: number; today: string }) {
  const { streak, thisWeek, lastWeek } = computeStats(activity, today);
  const delta = thisWeek - lastWeek;
  const DeltaIcon = delta > 0 ? FiArrowUp : delta < 0 ? FiArrowDown : FiMinus;
  const deltaText = delta === 0 ? "Same as last week" : `${delta > 0 ? "+" : ""}${delta} vs last week`;

  return (
    <div className="row row-cols-1 row-cols-sm-3 g-2 mb-4">
      <Tile label="Streak">
        <div className="h3 mb-0 d-flex align-items-center gap-2">
          <FiZap className="text-primary" aria-hidden /> {streak}
          <span className="text-muted fs-6 fw-normal">{streak === 1 ? "day" : "days"}</span>
        </div>
      </Tile>
      <Tile label="Done this week">
        <div className="h3 mb-0">{thisWeek}</div>
        <div className="small text-muted d-flex align-items-center gap-1">
          <DeltaIcon aria-hidden /> {deltaText}
        </div>
      </Tile>
      <Tile label="Overdue">
        <div className="h3 mb-0 d-flex align-items-center gap-2">
          {overdue > 0 && <FiAlertTriangle className="text-danger" aria-hidden />} {overdue}
        </div>
        <div className="small text-muted">{overdue === 0 ? "Nothing overdue" : "open past due date"}</div>
      </Tile>
    </div>
  );
}
