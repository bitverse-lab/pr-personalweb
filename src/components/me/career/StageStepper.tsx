import { FiCheck, FiX } from "react-icons/fi";
import { CLOSED_STATUSES, PIPELINE_COLUMNS, STATUS_META } from "@/features/career/status";
import type { ApplicationStatus } from "@/db/schema/career";

const day = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/**
 * Where the application is on the road from wishlist to offer, with the day each stage was
 * reached. A closed application shows how far it got and how it ended.
 */
export default function StageStepper({ status, history }: { status: ApplicationStatus; history: { toStatus: ApplicationStatus; changedAt: Date }[] }) {
  const reached = new Map<ApplicationStatus, Date>();
  for (const h of history) if (!reached.has(h.toStatus)) reached.set(h.toStatus, h.changedAt);

  const closed = CLOSED_STATUSES.includes(status);
  // For a closed application, the furthest pipeline stage it reached is where it stopped.
  const stopIndex = closed
    ? Math.max(-1, ...PIPELINE_COLUMNS.map((s, i) => (reached.has(s) ? i : -1)))
    : PIPELINE_COLUMNS.indexOf(status);

  return (
    <ol className={`stepper${closed ? " is-closed" : ""}`} aria-label="Application stages">
      {PIPELINE_COLUMNS.map((stage, i) => {
        const state = i < stopIndex || (closed && i === stopIndex) ? "done" : i === stopIndex ? "current" : "todo";
        const at = reached.get(stage);
        return (
          <li key={stage} className={`stepper-step is-${state}`} aria-current={state === "current" ? "step" : undefined}>
            <span className="stepper-dot" aria-hidden>
              {state === "done" ? <FiCheck /> : i + 1}
            </span>
            <span className="stepper-label">{STATUS_META[stage].label}</span>
            <span className="stepper-date">{at && state !== "todo" ? day(at) : " "}</span>
          </li>
        );
      })}
      {closed && (
        <li className="stepper-step is-ended">
          <span className="stepper-dot" aria-hidden>
            <FiX />
          </span>
          <span className="stepper-label">{STATUS_META[status].label}</span>
          <span className="stepper-date">{reached.get(status) ? day(reached.get(status)!) : " "}</span>
        </li>
      )}
    </ol>
  );
}
