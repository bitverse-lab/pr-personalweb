"use client";

import { useEffect } from "react";

// Health data is date-sensitive ("today" depends on the viewer's timezone), so tell the server which one it is.
export default function TimezoneCookie() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && !document.cookie.includes(`tz=${encodeURIComponent(tz)}`)) {
        document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
      }
    } catch {
      // fall back to the server default
    }
  }, []);
  return null;
}
