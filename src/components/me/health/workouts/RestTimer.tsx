"use client";

import { useEffect, useState } from "react";
import { fmtDuration } from "@/features/health/workout-meta";

const PRESETS = [60, 90, 120, 180];

export default function RestTimer({
  endsAt,
  onChange,
  onDismiss,
}: {
  endsAt: number;
  onChange: (endsAt: number) => void;
  onDismiss: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const finished = remaining === 0;

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  useEffect(() => {
    if (!finished) return;
    try {
      navigator.vibrate?.(200);
    } catch {
      // vibration is optional
    }
    const id = setTimeout(onDismiss, 5000);
    return () => clearTimeout(id);
  }, [finished, onDismiss]);

  return (
    <div
      className="card shadow"
      role="timer"
      aria-live="off"
      style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1040, width: "min(440px, calc(100vw - 32px))" }}
    >
      <div className="card-body py-2 d-flex align-items-center gap-2 flex-wrap justify-content-center">
        <strong className={finished ? "text-success" : ""} style={{ fontSize: 22, minWidth: 64, fontVariantNumeric: "tabular-nums" }}>
          {finished ? "Go!" : fmtDuration(remaining)}
        </strong>
        <span className="text-muted small">Rest</span>
        <div className="btn-group btn-group-sm">
          {PRESETS.map((p) => (
            <button key={p} type="button" className="btn btn-outline-primary" onClick={() => onChange(Date.now() + p * 1000)}>
              {p}s
            </button>
          ))}
          <button type="button" className="btn btn-outline-primary" onClick={() => onChange(Math.max(endsAt, Date.now()) + 15000)}>
            +15s
          </button>
        </div>
        <button type="button" className="btn btn-sm btn-link" onClick={onDismiss}>
          {finished ? "Close" : "Skip"}
        </button>
      </div>
    </div>
  );
}
