"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiMessageCircle, FiTrash2 } from "react-icons/fi";
import type { Editor } from "@tiptap/react";
import { deleteJournalEntry, restoreJournalEntry, saveJournalEntry } from "@/features/content/journal-actions";
import { PROMPTS, promptForDate } from "@/features/content/journal-meta";
import { countWords, docToPlainText, readingMinutes } from "@/features/content/richtext";
import { useAutosave } from "@/hooks/useAutosave";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/shared/ToastProvider";
import { SaveIndicator } from "./ArticleEditor";
import MoodPicker from "./MoodPicker";
import RichEditor from "./RichEditor";
import TagInput from "./TagInput";
import type { RichDoc } from "@/db/schema/content";
import type { JournalEntryDto } from "@/server/services/journal-service";

const longDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export default function JournalEditor({
  entry,
  prev,
  next,
  tagSuggestions,
}: {
  entry: JournalEntryDto;
  prev: { id: string; date: string } | null;
  next: { id: string; date: string } | null;
  tagSuggestions: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const editorRef = useRef<Editor | null>(null);

  const [title, setTitle] = useState(entry.title ?? "");
  const [mood, setMood] = useState<number | null>(entry.mood);
  const [tags, setTags] = useState(entry.tags);
  const [doc, setDoc] = useState<RichDoc>(entry.content);
  const [promptIndex, setPromptIndex] = useState(promptForDate(entry.date));
  const [showPrompt, setShowPrompt] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const payload = useMemo(() => ({ id: entry.id, title, mood, tags, content: doc }), [entry.id, title, mood, tags, doc]);
  const { status, error, flush, savedAt } = useAutosave(payload, async (p) => {
    const result = await saveJournalEntry(p);
    return result.ok ? null : result.error;
  });

  const words = useMemo(() => countWords(docToPlainText(doc)), [doc]);

  // Ctrl/Cmd+S saves now instead of opening the browser's "Save page" dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void flush();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flush]);

  const insertPrompt = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor
      .chain()
      .focus("end")
      .insertContent([
        { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: PROMPTS[promptIndex] }] }] },
        { type: "paragraph" },
      ])
      .run();
    setShowPrompt(false);
  };

  const remove = () =>
    startTransition(async () => {
      await flush();
      const result = await deleteJournalEntry(entry.id);
      setConfirmDelete(false);
      if (!result.ok) return toast.error(result.error);
      const snapshot = result.data;
      toast.success("Entry deleted", {
        action: { label: "Undo", onClick: () => void restoreJournalEntry(snapshot).then((r) => (r.ok ? toast.success("Entry restored") : toast.error(r.error))) },
      });
      router.push("/me/journal");
    });

  return (
    <>
      <h1 className="visually-hidden">Journal entry for {longDate(entry.date)}</h1>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <Link href="/me/journal" className="text-muted small d-inline-flex align-items-center gap-1">
          <FiArrowLeft /> Journal
        </Link>
        <div className="d-flex align-items-center gap-3">
          <span title="Ctrl+S saves right away">
            <SaveIndicator status={status} error={error} savedAt={savedAt} onRetry={() => void flush()} />
          </span>
          <div className="btn-group btn-group-sm">
            {prev ? (
              <Link href={`/me/journal/${prev.id}`} className="btn btn-outline-primary" aria-label={`Previous entry, ${prev.date}`}>
                <FiChevronLeft />
              </Link>
            ) : (
              <button type="button" className="btn btn-outline-primary" disabled aria-label="No earlier entry"><FiChevronLeft /></button>
            )}
            {next ? (
              <Link href={`/me/journal/${next.id}`} className="btn btn-outline-primary" aria-label={`Next entry, ${next.date}`}>
                <FiChevronRight />
              </Link>
            ) : (
              <button type="button" className="btn btn-outline-primary" disabled aria-label="No later entry"><FiChevronRight /></button>
            )}
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="mb-2 text-muted">{longDate(entry.date)}</div>
          <input className="form-control form-control-lg fw-semibold mb-3" placeholder="Title (optional)" aria-label="Entry title" maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} />

          {showPrompt && (
            <div className="alert alert-info d-flex flex-wrap justify-content-between align-items-center gap-2">
              <span className="fst-italic">{PROMPTS[promptIndex]}</span>
              <span className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setPromptIndex((i) => (i + 1) % PROMPTS.length)}>Another</button>
                <button type="button" className="btn btn-sm btn-primary" onClick={insertPrompt}>Use this prompt</button>
              </span>
            </div>
          )}

          <RichEditor initial={entry.content} onChange={setDoc} onReady={(e) => (editorRef.current = e)} placeholder="How was your day?" minHeight={380} />
          <p className="text-muted small mt-2 mb-0">
            {words} words · {readingMinutes(words)} min read
          </p>
        </div>

        <div className="col-lg-4">
          <div className="card rounded shadow-sm mb-3">
            <div className="card-body">
              <h6 className="mb-3">How are you feeling?</h6>
              <MoodPicker value={mood} onChange={setMood} />
            </div>
          </div>
          <div className="card rounded shadow-sm mb-3">
            <div className="card-body">
              <TagInput tags={tags} onChange={setTags} suggestions={tagSuggestions} max={8} />
              <button type="button" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 mt-3" onClick={() => setShowPrompt((s) => !s)}>
                <FiMessageCircle /> {showPrompt ? "Hide prompt" : "Need a prompt?"}
              </button>
            </div>
          </div>
          <button type="button" className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1" onClick={() => setConfirmDelete(true)}>
            <FiTrash2 /> Delete entry
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog title="Delete this entry?" message="You can undo right after." isPending={isPending} onConfirm={remove} onCancel={() => setConfirmDelete(false)} />
      )}
    </>
  );
}
