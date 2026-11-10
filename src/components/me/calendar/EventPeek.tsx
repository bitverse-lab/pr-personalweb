"use client";

import Link from "next/link";
import { FiCopy, FiEdit2, FiMapPin, FiTrash2, FiCheckSquare, FiSquare, FiArrowRight } from "react-icons/fi";
import { EVENT_CATEGORY, eventColorHex } from "@/features/calendar/colors";
import { formatWhen, relativeStart, type CalendarTask } from "@/features/calendar/format";
import CalendarPopover from "./CalendarPopover";
import type { CalendarEventInput, ScreenPoint } from "./CalendarView";

/** Read first, edit second: clicking an event shows what it is before offering to change it. */
export function EventPeek({
  event,
  at,
  now,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  event: CalendarEventInput;
  at: ScreenPoint;
  now: Date;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const rel = event.allDay ? null : relativeStart(start, end, now);
  const color = event.color ?? "blue";

  return (
    <CalendarPopover at={at} label={event.title} onClose={onClose}>
      <p className="cal-pop-cat">
        <span className="cal-cat-dot" style={{ background: eventColorHex(color) }} aria-hidden />
        {EVENT_CATEGORY[color]}
      </p>
      <h3 className="cal-pop-title">{event.title}</h3>
      <p className="cal-pop-when">
        {formatWhen(start, end, event.allDay)}
        {rel && rel !== "ended" && <span className="cal-rel">{rel}</span>}
      </p>
      {event.location && (
        <p className="cal-pop-meta">
          <FiMapPin aria-hidden /> {event.location}
        </p>
      )}
      {event.description && <p className="cal-pop-desc">{event.description}</p>}
      <div className="d-flex gap-1 mt-3">
        <button type="button" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" onClick={onEdit}>
          <FiEdit2 aria-hidden /> Edit
        </button>
        <button type="button" className="btn btn-sm btn-outline-primary border-0 d-inline-flex align-items-center gap-1" onClick={onDuplicate}>
          <FiCopy aria-hidden /> Duplicate
        </button>
        <button type="button" className="btn btn-sm btn-outline-danger border-0 d-inline-flex align-items-center gap-1 ms-auto" onClick={onDelete}>
          <FiTrash2 aria-hidden /> Delete
        </button>
      </div>
    </CalendarPopover>
  );
}

export function TaskPeek({
  task,
  at,
  pending,
  onClose,
  onToggle,
}: {
  task: CalendarTask;
  at: ScreenPoint;
  pending: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  const due = new Date(`${task.dueDate}T00:00:00`);
  return (
    <CalendarPopover at={at} label={task.title} onClose={onClose}>
      <p className="cal-pop-cat">Task</p>
      <h3 className={`cal-pop-title${task.done ? " text-decoration-line-through text-muted" : ""}`}>{task.title}</h3>
      <p className="cal-pop-when">Due {due.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
      <div className="d-flex gap-1 mt-3">
        <button type="button" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" onClick={onToggle} disabled={pending}>
          {task.done ? <FiSquare aria-hidden /> : <FiCheckSquare aria-hidden />} {task.done ? "Mark not done" : "Mark done"}
        </button>
        <Link href="/me/tasks" className="btn btn-sm btn-outline-primary border-0 d-inline-flex align-items-center gap-1 ms-auto">
          Open in Tasks <FiArrowRight aria-hidden />
        </Link>
      </div>
    </CalendarPopover>
  );
}
