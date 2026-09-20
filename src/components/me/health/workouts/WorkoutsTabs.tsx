"use client";

import { useState } from "react";

export interface WorkoutTab {
  key: string;
  label: string;
  content: React.ReactNode;
}

export default function WorkoutsTabs({ tabs, bare = false }: { tabs: WorkoutTab[]; bare?: boolean }) {
  const [active, setActive] = useState(tabs[0]?.key);
  return (
    <div className={bare ? undefined : "card rounded shadow-sm"}>
      <div className={bare ? undefined : "card-body"}>
        <div className="btn-group btn-group-sm mb-3 flex-wrap" role="tablist" aria-label="Workout sections">
          {tabs.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={active === t.key} className={`btn ${active === t.key ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setActive(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        {tabs.map((t) => (
          <div key={t.key} role="tabpanel" hidden={active !== t.key}>
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
