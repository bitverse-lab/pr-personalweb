"use client";

import DialogShell from "@/components/shared/DialogShell";

export const CALENDAR_SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["N"], label: "New event" },
  { keys: ["T"], label: "Jump to today" },
  { keys: ["←", "→"], label: "Previous / next period" },
  { keys: ["M"], label: "Month view" },
  { keys: ["W"], label: "Week view" },
  { keys: ["D"], label: "Day view" },
  { keys: ["L"], label: "List view" },
  { keys: ["?"], label: "Show this list" },
];

export default function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <DialogShell title="Keyboard shortcuts" onClose={onClose} maxWidth={380}>
      <dl className="cal-keys mb-0">
        {CALENDAR_SHORTCUTS.map((s) => (
          <div key={s.label}>
            <dt>
              {s.keys.map((k) => (
                <kbd key={k}>{k}</kbd>
              ))}
            </dt>
            <dd>{s.label}</dd>
          </div>
        ))}
      </dl>
    </DialogShell>
  );
}
