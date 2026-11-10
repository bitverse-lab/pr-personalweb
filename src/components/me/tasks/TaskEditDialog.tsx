"use client";

import { useState, useTransition } from "react";
import { updateTask } from "@/features/tasks/actions";
import type { SubtaskDto } from "@/features/tasks/subtask-actions";
import SubtaskChecklist from "./SubtaskChecklist";
import type { TaskPriority } from "@/db/schema/productivity";
import DialogShell from "@/components/shared/DialogShell";

export interface TaskEditValues {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: TaskPriority | null;
  tags?: string[];
  subtasks?: SubtaskDto[];
}

interface TaskEditDialogProps {
  initialValues: TaskEditValues;
  onClose: () => void;
}

export default function TaskEditDialog({ initialValues, onClose }: TaskEditDialogProps) {
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [dueDate, setDueDate] = useState(initialValues.dueDate ?? "");
  const [priority, setPriority] = useState<TaskPriority | "">(initialValues.priority ?? "");
  const [tagsInput, setTagsInput] = useState((initialValues.tags ?? []).join(", "));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    startTransition(async () => {
      const result = await updateTask({
        id: initialValues.id,
        title,
        // null, not undefined: emptying a field in the form must actually clear it.
        description: description.trim() || null,
        dueDate: dueDate || null,
        priority: priority || null,
        tags,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  };

  return (
    <DialogShell title="Edit task" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="te-title">Title</label>
          <input id="te-title"
            name="title"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="te-description">Description</label>
          <textarea id="te-description"
            name="description"
            className="form-control"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="row">
          <div className="col-6 mb-3">
            <label className="form-label" htmlFor="te-dueDate">Due date</label>
            <input id="te-dueDate"
              name="dueDate"
              type="date"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="col-6 mb-3">
            <label className="form-label" htmlFor="te-priority">Priority</label>
            <select id="te-priority"
              name="priority"
              className="form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority | "")}
            >
              <option value="">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="te-tags">Tags</label>
          <input id="te-tags"
            name="tags"
            className="form-control"
            placeholder="comma, separated, tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !title.trim()}>
            Save
          </button>
        </div>
      </form>
      <hr />
      <SubtaskChecklist taskId={initialValues.id} initial={initialValues.subtasks ?? []} />
    </DialogShell>
  );
}
