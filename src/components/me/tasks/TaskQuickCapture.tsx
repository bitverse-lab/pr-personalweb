"use client";

import { useMemo, useState, useTransition } from "react";
import { FiCalendar, FiFlag, FiHash, FiX, FiPlus, FiRepeat } from "react-icons/fi";
import { createTask } from "@/features/tasks/actions";
import { RECURRENCES, dueInfo, parseQuickTask, recurrenceLabel } from "@/features/tasks/dates";
import { useToast } from "@/components/shared/ToastProvider";
import type { TaskPriority, TaskRecurrence } from "@/db/schema/productivity";

/**
 * One line does it all: "Call mom tomorrow #family !high", "Stretch daily", "Sync every fri".
 * What the line was understood as shows
 * underneath as chips; clicking a chip drops that reading. "More" opens the explicit fields,
 * which win over anything typed.
 */
export default function TaskQuickCapture({ today }: { today: string }) {
  const [title, setTitle] = useState("");
  const [more, setMore] = useState(false);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [recurrence, setRecurrence] = useState<TaskRecurrence | "">("");
  const [ignored, setIgnored] = useState<{ due?: boolean; priority?: boolean; repeat?: boolean; tags: string[] }>({ tags: [] });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  // A rejected reading is not applied and its words go back into the title.
  const parsed = useMemo(() => parseQuickTask(title, today, ignored), [title, today, ignored]);
  const readDue = parsed.dueDate;
  const readPriority = parsed.priority;
  const readTags = parsed.tags;
  const readRepeat = parsed.recurrence;
  const finalTitle = parsed.title;

  const reset = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("");
    setRecurrence("");
    setIgnored({ tags: [] });
    setMore(false);
    setError(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!finalTitle) return;
    setError(null);
    const repeat = recurrence || readRepeat;
    // A repeating task picked from "More options" without a date starts today.
    const due = dueDate || readDue || (repeat ? today : undefined);
    startTransition(async () => {
      const result = await createTask({
        title: finalTitle,
        description: description || undefined,
        dueDate: due || undefined,
        priority: priority || readPriority || undefined,
        recurrence: repeat || undefined,
        tags: readTags.length > 0 ? readTags : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(repeat ? `Added · ${recurrenceLabel(repeat, due ?? null).toLowerCase()}` : due ? `Added · due ${dueInfo(due, today).label.toLowerCase()}` : "Task added");
      reset();
    });
  };

  const hasReading = Boolean(readDue || readPriority || readRepeat || readTags.length);

  return (
    <form onSubmit={handleSubmit} className="task-capture">
      {error && <div className="alert alert-danger py-2 small mb-2">{error}</div>}
      <div className="task-capture-row">
        <FiPlus className="task-capture-icon" aria-hidden />
        <label htmlFor="task-quick-capture-title" className="visually-hidden">New task</label>
        <input
          id="task-quick-capture-title"
          name="title"
          type="text"
          className="form-control"
          placeholder="Add a task — try “Call mom tomorrow #family !high”"
          value={title}
          maxLength={200}
          autoComplete="off"
          onChange={(e) => {
            setTitle(e.target.value);
            if (!e.target.value) setIgnored({ tags: [] });
          }}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !finalTitle}>
          {isPending ? "Adding…" : "Add"}
        </button>
      </div>

      {(title || more) && (
        <div className="task-capture-under">
          {hasReading ? (
            <div className="task-chips" aria-live="polite">
              <span className="visually-hidden">Understood as:</span>
              {readDue && !dueDate && (
                <button type="button" className="task-chip" onClick={() => setIgnored((v) => ({ ...v, due: true }))} title="Not a date — keep as text">
                  <FiCalendar aria-hidden /> {dueInfo(readDue, today).label} <FiX aria-hidden className="task-chip-x" />
                  <span className="visually-hidden">(remove)</span>
                </button>
              )}
              {readRepeat && !recurrence && (
                <button type="button" className="task-chip" onClick={() => setIgnored((v) => ({ ...v, repeat: true }))} title="Does not repeat — keep as text">
                  <FiRepeat aria-hidden /> {recurrenceLabel(readRepeat, dueDate || readDue || null)} <FiX aria-hidden className="task-chip-x" />
                  <span className="visually-hidden">(remove)</span>
                </button>
              )}
              {readPriority && !priority && (
                <button type="button" className="task-chip" onClick={() => setIgnored((v) => ({ ...v, priority: true }))} title="Not a priority — keep as text">
                  <FiFlag aria-hidden /> {readPriority} <FiX aria-hidden className="task-chip-x" />
                  <span className="visually-hidden">(remove)</span>
                </button>
              )}
              {readTags.map((t) => (
                <button key={t} type="button" className="task-chip" onClick={() => setIgnored((v) => ({ ...v, tags: [...v.tags, t] }))} title="Not a tag — keep as text">
                  <FiHash aria-hidden />
                  {t} <FiX aria-hidden className="task-chip-x" />
                  <span className="visually-hidden">(remove)</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="task-capture-hint">
              Shorthand: <kbd>tomorrow</kbd> <kbd>fri</kbd> <kbd>next week</kbd> for a date, <kbd>daily</kbd> <kbd>every mon</kbd> to repeat, <kbd>#tag</kbd>, <kbd>!high</kbd>
            </p>
          )}
          <button type="button" className="btn btn-sm btn-outline-primary border-0 ms-auto" aria-expanded={more} onClick={() => setMore((v) => !v)}>
            {more ? "Fewer options" : "More options"}
          </button>
        </div>
      )}

      {more && (
        <div className="task-capture-more">
          <div>
            <label className="form-label small" htmlFor="tq-due">Due date</label>
            <input id="tq-due" name="dueDate" type="date" className="form-control form-control-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label small" htmlFor="tq-priority">Priority</label>
            <select id="tq-priority" name="priority" className="form-select form-select-sm" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority | "")}>
              <option value="">None</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="form-label small" htmlFor="tq-repeat">Repeat</label>
            <select id="tq-repeat" className="form-select form-select-sm" value={recurrence} onChange={(e) => setRecurrence(e.target.value as TaskRecurrence | "")}>
              <option value="">Does not repeat</option>
              {RECURRENCES.map((r) => (
                <option key={r} value={r}>{recurrenceLabel(r, dueDate || readDue || null)}</option>
              ))}
            </select>
          </div>
          <div className="task-capture-notes">
            <label className="form-label small" htmlFor="tq-notes">Notes</label>
            <textarea id="tq-notes" name="description" className="form-control form-control-sm" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
          </div>
        </div>
      )}
    </form>
  );
}
