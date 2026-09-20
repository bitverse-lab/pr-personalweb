"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * Debounced autosave. `payload` is any JSON-serialisable snapshot of what should be persisted;
 * `save` returns null on success or an error message. Changes are compared by value, so re-renders
 * with an identical payload never trigger a save. Pending changes are flushed on unmount/tab hide.
 */
export function useAutosave<T>(payload: T, save: (payload: T) => Promise<string | null>, delay = 1500) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const json = JSON.stringify(payload);

  const latest = useRef({ payload, json });
  const saved = useRef(json); // what the server already has (initial payload counts as saved)
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;
  latest.current = { payload, json };

  const run = useCallback(async () => {
    if (inFlight.current) return;
    const { payload: current, json: currentJson } = latest.current;
    if (currentJson === saved.current) return;
    inFlight.current = true;
    setStatus("saving");
    const problem = await saveRef.current(current);
    inFlight.current = false;
    if (problem) {
      setError(problem);
      setStatus("error");
      return;
    }
    saved.current = currentJson;
    setError(null);
    // edits made while saving are picked up right away
    if (latest.current.json !== saved.current) void run();
    else setStatus("saved");
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
    await run();
  }, [run]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (latest.current.json !== saved.current) e.preventDefault();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      void flush(); // leaving the page: persist anything still pending
    };
  }, [flush]);

  return { status, error, flush };
}
