"use client";

import { useState, useTransition } from "react";
import { createTask } from "@/features/tasks/actions";
import type { TaskPriority } from "@/db/schema/productivity";

export default function TaskQuickCapture() {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("");
    setTagsInput("");
    setExpanded(false);
    setError(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setError(null);
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    startTransition(async () => {
      const result = await createTask({
        title,
        description: description || undefined,
        dueDate: dueDate || undefined,
        priority: priority || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      reset();
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger py-2 small mb-2">{error}</div>}
      <input
        id="task-quick-capture-title"
        name="title"
        type="text"
        className="form-control"
        placeholder="Add a task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={() => setExpanded(true)}
      />
      {expanded && (
        <div className="mt-2">
          <textarea
            name="description"
            className="form-control mb-2"
            placeholder="Description (optional)"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <input
              name="dueDate"
              type="date"
              className="form-control"
              style={{ maxWidth: 180 }}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <select
              name="priority"
              className="form-select"
              style={{ maxWidth: 140 }}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority | "")}
            >
              <option value="">Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              name="tags"
              type="text"
              className="form-control"
              style={{ maxWidth: 220 }}
              placeholder="tags, comma, separated"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
          <div className="d-flex align-items-center gap-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !title.trim()}>
              Save
            </button>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={reset} disabled={isPending}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
