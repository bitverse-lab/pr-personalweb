"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * Debounced autosave. `payload` is any JSON-serialisable snapshot of what should be persisted;
 * `save` returns null on success or an error message. Changes are compared by value, so re-renders
 * with an identical payload never trigger a save. Pending changes are flushed on unmount/tab hide.
 *
 * `flush()` waits for any save already running, then saves what is left, and resolves to the error
 * message (or null) — so Publish or Delete never race an autosave.
 */
export function useAutosave<T>(payload: T, save: (payload: T) => Promise<string | null>, delay = 1500) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const json = JSON.stringify(payload);

  const latest = useRef({ payload, json });
  const saved = useRef(json); // what the server already has (initial payload counts as saved)
  const running = useRef<Promise<unknown> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;
  latest.current = { payload, json };

  const run = useCallback(async (): Promise<string | null> => {
    // One save at a time; a caller arriving mid-save waits, then saves whatever is still newer.
    while (running.current) await running.current.catch(() => {});
    const { payload: current, json: currentJson } = latest.current;
    if (currentJson === saved.current) return null;
    setStatus("saving");
    const attempt = saveRef.current(current).catch((e: unknown) => (e instanceof Error ? e.message : "Could not save"));
    running.current = attempt;
    const problem = await attempt;
    running.current = null;
    if (problem) {
      setError(problem);
      setStatus("error");
      return problem;
    }
    saved.current = currentJson;
    setError(null);
    setSavedAt(new Date());
    // edits made while saving are picked up right away
    if (latest.current.json !== saved.current) return run();
    setStatus("saved");
    return null;
  }, []);

  useEffect(() => {
    if (json === saved.current) return;
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void run(), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [json, delay, run]);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    return run();
  }, [run]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (latest.current.json !== saved.current) e.preventDefault();
    };
    // A save that failed while offline goes through as soon as the connection is back.
    const onOnline = () => void flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("online", onOnline);
      void flush(); // leaving the page: persist anything still pending
    };
  }, [flush]);

  return { status, error, flush, savedAt };
}
