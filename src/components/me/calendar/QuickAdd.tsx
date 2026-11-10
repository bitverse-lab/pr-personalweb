"use client";

import { useId, useState, useTransition } from "react";
import { createEvent } from "@/features/calendar/actions";
import { formatWhen } from "@/features/calendar/format";
import type { EventColor } from "@/db/schema/productivity";
import CalendarPopover from "./CalendarPopover";
import CategoryPicker from "./CategoryPicker";
import ConflictNote from "./ConflictNote";
import type { ScreenPoint } from "./CalendarView";
import type { EventFormValues } from "./EventFormDialog";

/**
 * Click a day (or drag across hours), type a title, press Enter. The full form is one click
 * away under "More options", carrying over whatever was typed.
 */
export default function QuickAdd({
  selection,
  at,
  onClose,
  onCreated,
  onMoreOptions,
}: {
  selection: { start: string; end: string; allDay: boolean };
  at: ScreenPoint;
  onClose: () => void;
  onCreated: (title: string, id?: string) => void;
  onMoreOptions: (values: EventFormValues) => void;
}) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState<EventColor>("blue");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const catLabel = useId();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createEvent({ title, start: selection.start, end: selection.end, allDay: selection.allDay, color });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onCreated(title.trim(), (result.data as { id?: string } | null)?.id);
    });
  };

  return (
    <CalendarPopover at={at} label="Add event" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="cal-pop-when">{formatWhen(new Date(selection.start), new Date(selection.end), selection.allDay)}</p>
        <label className="visually-hidden" htmlFor="quick-add-title">Event title</label>
        <input
          id="quick-add-title"
          className="form-control mb-2"
          placeholder="Add a title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          autoComplete="off"
        />
        <span id={catLabel} className="visually-hidden">Category</span>
        <CategoryPicker value={color} onChange={setColor} labelledBy={catLabel} />
        <ConflictNote start={selection.start} end={selection.end} allDay={selection.allDay} />
        {error && <p className="small text-danger mb-2" role="alert">{error}</p>}
        <div className="d-flex justify-content-between align-items-center gap-2 mt-3">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary border-0 px-2"
            onClick={() => onMoreOptions({ title, start: selection.start, end: selection.end, allDay: selection.allDay, color })}
          >
            More options
          </button>
          <button type="submit" className="btn btn-sm btn-primary" disabled={isPending || !title.trim()}>
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </CalendarPopover>
  );
}
