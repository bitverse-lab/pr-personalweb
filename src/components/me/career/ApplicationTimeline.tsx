import {
  FiCalendar,
  FiCheckCircle,
  FiEdit3,
  FiFlag,
  FiRepeat,
  FiUserPlus,
  FiXCircle,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import type { TimelineEventType } from "@/db/schema/career";

export interface TimelineEventDto {
  id: string;
  type: TimelineEventType;
  title: string;
  body: string | null;
  occurredAt: Date;
}

const ICONS: Record<TimelineEventType, IconType> = {
  created: FiFlag,
  status_changed: FiRepeat,
  note: FiEdit3,
  interview_scheduled: FiCalendar,
  interview_completed: FiCheckCircle,
  interview_cancelled: FiXCircle,
  contact_added: FiUserPlus,
};

export default function ApplicationTimeline({ events }: { events: TimelineEventDto[] }) {
  if (events.length === 0) return <p className="text-muted small mb-0">Nothing has happened yet.</p>;

  return (
    <ol className="list-unstyled mb-0 position-relative" style={{ paddingLeft: 8 }}>
      {events.map((event, index) => {
        const Icon = ICONS[event.type];
        return (
          <li key={event.id} className="d-flex gap-3 position-relative" style={{ paddingBottom: index === events.length - 1 ? 0 : 18 }}>
            {index !== events.length - 1 && (
              <span
                aria-hidden
                style={{ position: "absolute", left: 13, top: 28, bottom: 0, width: 2, background: "#e1e0d9" }}
              />
            )}
            <span
              className="rounded-circle bg-soft-primary text-primary d-flex align-items-center justify-content-center"
              style={{ width: 28, height: 28, flex: "0 0 28px" }}
              aria-hidden
            >
              <Icon size={14} />
            </span>
            <div>
              <div className="fw-medium">{event.title}</div>
              {event.body && event.type !== "interview_scheduled" && (
                <div className="text-muted small" style={{ whiteSpace: "pre-wrap" }}>
                  {event.body}
                </div>
              )}
              <div className="text-muted small">
                {event.occurredAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
