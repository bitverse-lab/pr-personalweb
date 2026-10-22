"use client";

import { useState, useTransition } from "react";
import { createEvent, updateEvent, deleteEvent } from "@/features/calendar/actions";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { EVENT_COLORS, EVENT_COLOR_KEYS } from "@/features/calendar/colors";
import type { EventColor } from "@/db/schema/productivity";
import DialogShell from "@/components/shared/DialogShell";

export interface EventFormValues {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay: boolean;
  color?: EventColor | null;
}

interface EventFormDialogProps {
  initialValues: EventFormValues;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: (values: EventFormValues) => void;
}

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EventFormDialog({ initialValues, onClose, onSaved, onDeleted }: EventFormDialogProps) {
  const isEdit = Boolean(initialValues.id);
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [location, setLocation] = useState(initialValues.location ?? "");
  const [start, setStart] = useState(toLocalInputValue(initialValues.start));
  const [end, setEnd] = useState(toLocalInputValue(initialValues.end));
  const [allDay, setAllDay] = useState(initialValues.allDay);
  const [color, setColor] = useState<EventColor>(initialValues.color ?? "blue");
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = {
        title,
        description: description || undefined,
        location: location || undefined,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        allDay,
        color,
      };
      const result = isEdit
        ? await updateEvent({ id: initialValues.id, ...payload })
        : await createEvent(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
      onClose();
    });
  };

  const handleDelete = () => {
    if (!initialValues.id) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteEvent(initialValues.id!);
      setConfirmingDelete(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDeleted?.({
        title,
        description: description || undefined,
        location: location || undefined,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        allDay,
        color,
      });
      onSaved();
      onClose();
    });
  };

  return (
    <>
    <DialogShell title={isEdit ? "Edit event" : "New event"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="ev-title">Title</label>
          <input id="ev-title"
            name="title"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="ev-description">Description</label>
          <textarea id="ev-description"
            name="description"
            className="form-control"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="ev-location">Location</label>
          <input id="ev-location"
            name="location"
            className="form-control"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <div className="form-label d-block" id="ev-color-label">Color</div>
          <div className="d-flex gap-2" role="radiogroup" aria-labelledby="ev-color-label">
            {EVENT_COLOR_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={color === key}
                aria-label={key}
                onClick={() => setColor(key)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: EVENT_COLORS[key],
                  border: "2px solid #fff",
                  boxShadow: color === key ? `0 0 0 2px ${EVENT_COLORS[key]}` : "0 0 0 1px rgba(0,0,0,0.15)",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>
        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="allDay"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="allDay">
            All day
          </label>
        </div>
        <div className="row">
          <div className="col-6 mb-3">
            <label className="form-label" htmlFor="ev-start">Start</label>
            <input id="ev-start"
              name="start"
              type="datetime-local"
              className="form-control"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div className="col-6 mb-3">
            <label className="form-label" htmlFor="ev-end">End</label>
            <input id="ev-end"
              name="end"
              type="datetime-local"
              className="form-control"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="d-flex justify-content-between">
          <div>
            {isEdit && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => setConfirmingDelete(true)}
                disabled={isPending}
              >
                Delete
              </button>
            )}
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
              Save
            </button>
          </div>
        </div>
      </form>
    </DialogShell>
    {confirmingDelete && (
      <ConfirmDialog
        title="Delete event?"
        message={`"${title}" will be permanently deleted. This can't be undone.`}
        isPending={isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    )}
    </>
  );
}
