"use client";

import { useEffect } from "react";

// Mounted only inside /id: sets <html lang="id"> while there, back to "en" on the way out.
export default function LangSync() {
  useEffect(() => {
    document.documentElement.lang = "id";
    return () => {
      document.documentElement.lang = "en";
    };
  }, []);
  return null;
}
