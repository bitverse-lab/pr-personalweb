"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleSubtask, type SubtaskDto } from "@/features/tasks/subtask-actions";
import { useToast } from "@/components/shared/ToastProvider";

export function useSubtaskItems(initial: SubtaskDto[]) {
  const [items, setItems] = useState(initial);
  const [, startTransition] = useTransition();
  const toast = useToast();

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const toggle = (item: SubtaskDto) => {
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

  return { items, toggle };
}

export default function SubtaskToggleList({
  items,
  onToggle,
}: {
  items: SubtaskDto[];
  onToggle: (item: SubtaskDto) => void;
}) {
  return (
    <ul className="list-unstyled mb-0">
      {items.map((item) => (
        <li key={item.id} className="d-flex align-items-center gap-2 py-1">
          <input
            type="checkbox"
            className="form-check-input"
            checked={item.done}
            onChange={() => onToggle(item)}
            aria-label={`Mark "${item.title}" ${item.done ? "not done" : "done"}`}
          />
          <span className={item.done ? "text-muted text-decoration-line-through" : ""}>{item.title}</span>
        </li>
      ))}
    </ul>
  );
}
