"use client";

import { useState, useTransition } from "react";
import { addNote } from "@/features/career/actions";
import { useToast } from "@/components/shared/ToastProvider";

export default function NoteForm({ applicationId }: { applicationId: string }) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await addNote({ applicationId, body });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBody("");
      toast.success("Note added to the timeline");
    });
  };

  return (
    <form onSubmit={submit} className="d-flex gap-2">
      <input
        name="note"
        className="form-control form-control-sm"
        placeholder="Add a note to the timeline"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !body.trim()}>
        Add
      </button>
    </form>
  );
}
