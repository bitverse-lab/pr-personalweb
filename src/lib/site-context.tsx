"use client";

import { createContext, useContext } from "react";

export interface SiteInfo {
  /** The owner's name, or "Personal OS" until a profile has been filled in. */
  name: string;
  isPlaceholder: boolean;
  links: { label: string; url: string }[];
  email: string;
  location: string;
  available: boolean;
  availabilityNote: string;
  hasProjects: boolean;
  hasArticles: boolean;
}

const DEFAULT: SiteInfo = { name: "Personal OS", isPlaceholder: true, links: [], email: "", location: "", available: false, availabilityNote: "", hasProjects: false, hasArticles: false };

const SiteContext = createContext<SiteInfo>(DEFAULT);

export function SiteProvider({ value, children }: { value: SiteInfo; children: React.ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
