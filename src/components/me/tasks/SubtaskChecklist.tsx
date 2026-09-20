"use client";

import { useState, useTransition } from "react";
import { FiTrash2 } from "react-icons/fi";
import { addSubtask, toggleSubtask, deleteSubtask, type SubtaskDto } from "@/features/tasks/subtask-actions";
import { useToast } from "@/components/shared/ToastProvider";

export default function SubtaskChecklist({ taskId, initial }: { taskId: string; initial: SubtaskDto[] }) {
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  const [, startTransition] = useTransition();
  const toast = useToast();

  const handleAdd = () => {
    const value = title.trim();
    if (!value) return;
    setTitle("");
    startTransition(async () => {
      const result = await addSubtask({ taskId, title: value });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setItems((current) => [...current, result.data]);
    });
  };

  const handleToggle = (item: SubtaskDto) => {
    const done = !item.done;
    setItems((current) => current.map((s) => (s.id === item.id ? { ...s, done } : s)));
    startTransition(async () => {
      const result = await toggleSubtask({ id: item.id, done });
      if (!result.ok) {
        setItems((current) => current.map((s) => (s.id === item.id ? { ...s, done: item.done } : s)));
        toast.error(result.error);
      }
    });
  };

  const handleDelete = (item: SubtaskDto) => {
    setItems((current) => current.filter((s) => s.id !== item.id));
    startTransition(async () => {
      const result = await deleteSubtask(item.id);
      if (!result.ok) {
        setItems((current) => [...current, item]);
        toast.error(result.error);
      }
    });
  };

  const doneCount = items.filter((item) => item.done).length;

  return (
    <div className="mb-3">
      <label className="form-label">
        Checklist {items.length > 0 && <span className="text-muted small">({doneCount}/{items.length})</span>}
      </label>
      <ul className="list-unstyled mb-2">
        {items.map((item) => (
          <li key={item.id} className="d-flex align-items-center justify-content-between py-1">
            <div className="d-flex align-items-center gap-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={item.done}
                onChange={() => handleToggle(item)}
                aria-label={`Mark "${item.title}" ${item.done ? "not done" : "done"}`}
              />
              <span className={item.done ? "text-muted text-decoration-line-through" : ""}>{item.title}</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger border-0"
              onClick={() => handleDelete(item)}
              aria-label={`Delete "${item.title}"`}
            >
              <FiTrash2 />
            </button>
          </li>
        ))}
      </ul>
      <div className="d-flex gap-2">
        <input
          name="subtask"
          className="form-control form-control-sm"
          placeholder="Add a checklist item"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={handleAdd}
          disabled={!title.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
}
