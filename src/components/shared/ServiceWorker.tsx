"use client";

import { useEffect } from "react";

// Production only: in development a cached page would hide the change being worked on.
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline reading is a bonus; the site works the same without it.
    });
  }, []);
  return null;
}
