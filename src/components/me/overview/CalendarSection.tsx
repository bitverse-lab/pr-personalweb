import { FiCalendar } from "react-icons/fi";
import EmptyState from "@/components/shared/EmptyState";

export interface EventPreview {
  id: string;
  title: string;
  timeLabel?: string;
  colorHex?: string;
}

export default function CalendarSection({ events = [] }: { events?: EventPreview[] }) {
  return (
    <div className="card rounded shadow-sm h-100">
      <div className="card-body">
        <h6 className="card-title mb-3">Upcoming Events</h6>
        {events.length === 0 ? (
          <EmptyState
            icon={FiCalendar}
            title="No upcoming events"
            description="Day and week views are coming in a future phase."
            actionLabel="Open Calendar"
            actionHref="/me/calendar"
          />
        ) : (
          <ul className="list-unstyled mb-0">
            {events.map((event) => (
              <li key={event.id} className="d-flex justify-content-between border-bottom py-2">
                <span className="d-flex align-items-center gap-2">
                  {event.colorHex && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: event.colorHex }} aria-hidden />
                  )}
                  {event.title}
                </span>
                {event.timeLabel && <span className="text-muted small">{event.timeLabel}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
