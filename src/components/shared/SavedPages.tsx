"use client";

import { useEffect, useState } from "react";

type Saved = { href: string; title: string };

// Lists the pages the service worker saved on this device, read from the cache itself, so the list
// is exactly what will open without a connection.
export default function SavedPages() {
  const [saved, setSaved] = useState<Saved[] | null>(null);

  useEffect(() => {
    if (!("caches" in window)) return setSaved([]);
    let alive = true;
    (async () => {
      const names = (await caches.keys()).filter((n) => n.startsWith("pages-"));
      const out: Saved[] = [];
      for (const name of names) {
        const cache = await caches.open(name);
        for (const request of await cache.keys()) {
          const url = new URL(request.url);
          if (url.pathname === "/offline") continue;
          const html = (await (await cache.match(request))?.text()) ?? "";
          // DOMParser never runs scripts; only the decoded <title> is read.
          const title = new DOMParser().parseFromString(html, "text/html").title.split(" | ")[0] || url.pathname;
          out.push({ href: url.pathname + url.search, title });
        }
      }
      if (alive) setSaved(out.reverse());
    })().catch(() => alive && setSaved([]));
    return () => {
      alive = false;
    };
  }, []);

  if (saved === null) return null;
  if (saved.length === 0) return <p className="text-muted">Nothing is saved on this device yet. Pages are saved as you read them online.</p>;
  return (
    <>
      <h2 className="privacy-h">Saved on this device</h2>
      <ul className="saved-pages">
        {saved.map((s) => (
          <li key={s.href}>
            {/* A plain link: offline, a full navigation is what the service worker can answer. */}
            <a href={s.href}>{s.title}</a> <span className="mono-meta">{s.href}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
