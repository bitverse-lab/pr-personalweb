"use client";

import { useId, useState, useTransition } from "react";
import { createEvent, updateEvent, deleteEvent } from "@/features/calendar/actions";
import { addDays, dayKey } from "@/features/calendar/format";
import type { EventColor } from "@/db/schema/productivity";
import DialogShell from "@/components/shared/DialogShell";
import CategoryPicker from "./CategoryPicker";
import ConflictNote from "./ConflictNote";

export interface EventFormValues {
  id?: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start: string;
  end: string;
  allDay: boolean;
  color?: EventColor | null;
}

interface EventFormDialogProps {
  initialValues: EventFormValues;
  /** Heading override, e.g. "Duplicate event". */
  heading?: string;
  onClose: () => void;
  /** Called with the saved event id (absent after a delete). */
  onSaved: (id?: string) => void;
  onDeleted?: (values: EventFormValues) => void;
}

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

// All-day ends are exclusive (midnight after the last day); people think in the last day itself.
const lastDayOf = (startIso: string, endIso: string) => {
  const last = addDays(new Date(endIso), -1);
  return dayKey(last < new Date(startIso) ? new Date(startIso) : last);
};

export default function EventFormDialog({ initialValues, heading, onClose, onSaved, onDeleted }: EventFormDialogProps) {
  const isEdit = Boolean(initialValues.id);
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [location, setLocation] = useState(initialValues.location ?? "");
  const [start, setStart] = useState(toLocalInputValue(initialValues.start));
  const [end, setEnd] = useState(toLocalInputValue(initialValues.end));
  const [startDay, setStartDay] = useState(dayKey(new Date(initialValues.start)));
  const [endDay, setEndDay] = useState(initialValues.allDay ? lastDayOf(initialValues.start, initialValues.end) : dayKey(new Date(initialValues.end)));
  const [allDay, setAllDay] = useState(initialValues.allDay);
  const [color, setColor] = useState<EventColor>(initialValues.color ?? "blue");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const catLabel = useId();

  // One place that turns the inputs into the stored instants, for save, delete-undo and the clash check.
  const times = () => {
    if (allDay) {
      const s = new Date(`${startDay}T00:00:00`);
      const lastDay = new Date(`${(endDay < startDay ? startDay : endDay)}T00:00:00`);
      return { start: s.toISOString(), end: addDays(lastDay, 1).toISOString() };
    }
    return { start: start ? new Date(start).toISOString() : "", end: end ? new Date(end).toISOString() : "" };
  };

  const values = (): EventFormValues => ({
    title,
    description: description || undefined,
    location: location || undefined,
    ...times(),
    allDay,
    color,
  });

  const toggleAllDay = (next: boolean) => {
    // Carry the chosen day across the switch instead of resetting it.
    if (next) {
      if (start) setStartDay(start.slice(0, 10));
      if (end) setEndDay(end.slice(0, 10));
    } else {
      setStart(`${startDay}T09:00`);
      setEnd(`${startDay}T10:00`);
    }
    setAllDay(next);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = values();
      // An edit sends empty strings, not undefined, so clearing the location or notes actually clears them.
      const result = isEdit
        ? await updateEvent({ id: initialValues.id, ...payload, description, location })
        : await createEvent(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved((result.data as { id?: string } | null)?.id ?? initialValues.id);
      onClose();
    });
  };

  // No confirm step: the toast that follows offers Undo, which is kinder than asking twice.
  const handleDelete = () => {
    if (!initialValues.id) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteEvent(initialValues.id!);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDeleted?.(values());
      onSaved();
      onClose();
    });
  };

  const t = times();

  return (
    <DialogShell title={heading ?? (isEdit ? "Edit event" : "New event")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="ev-title">Title</label>
          <input id="ev-title" name="title" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        </div>
        <div className="mb-3">
          <div className="form-label" id={catLabel}>Category</div>
          <CategoryPicker value={color} onChange={setColor} labelledBy={catLabel} />
        </div>
        <div className="mb-2 form-check form-switch">
          <input type="checkbox" role="switch" className="form-check-input" id="allDay" checked={allDay} onChange={(e) => toggleAllDay(e.target.checked)} />
          <label className="form-check-label" htmlFor="allDay">All day</label>
        </div>
        {allDay ? (
          <div className="row">
            <div className="col-6 mb-2">
              <label className="form-label" htmlFor="ev-start-day">From</label>
              <input id="ev-start-day" type="date" className="form-control" value={startDay} onChange={(e) => setStartDay(e.target.value)} required />
            </div>
            <div className="col-6 mb-2">
              <label className="form-label" htmlFor="ev-end-day">To</label>
              <input id="ev-end-day" type="date" className="form-control" value={endDay} min={startDay} onChange={(e) => setEndDay(e.target.value)} required />
            </div>
          </div>
        ) : (
          <div className="row">
            <div className="col-6 mb-2">
              <label className="form-label" htmlFor="ev-start">Starts</label>
              <input id="ev-start" name="start" type="datetime-local" className="form-control" value={start} onChange={(e) => setStart(e.target.value)} required />
            </div>
            <div className="col-6 mb-2">
              <label className="form-label" htmlFor="ev-end">Ends</label>
              <input id="ev-end" name="end" type="datetime-local" className="form-control" value={end} min={start} onChange={(e) => setEnd(e.target.value)} required />
            </div>
          </div>
        )}
        <ConflictNote start={t.start} end={t.end} allDay={allDay} excludeId={initialValues.id} />
        <div className="mb-3 mt-2">
          <label className="form-label" htmlFor="ev-location">Location <span className="text-muted fw-normal">(optional)</span></label>
          <input id="ev-location" name="location" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="ev-description">Notes <span className="text-muted fw-normal">(optional)</span></label>
          <textarea id="ev-description" name="description" className="form-control" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        </div>
        <div className="d-flex justify-content-between">
          <div>
            {isEdit && (
              <button type="button" className="btn btn-outline-danger border-0 btn-sm" onClick={handleDelete} disabled={isPending}>
                Delete
              </button>
            )}
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>{isPending ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </form>
    </DialogShell>
  );
}
