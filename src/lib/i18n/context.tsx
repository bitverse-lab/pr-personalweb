"use client";

import { createContext, useContext } from "react";
import { dict } from "./dict";
import { localize, type Locale } from "./locale";

// English unless an /id layout says otherwise, so every existing page keeps working untouched.
const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
export const useDict = () => dict(useContext(LocaleContext));
/** A path in the current locale ("/projects" → "/id/projects" on Indonesian pages). */
export function useLocalize() {
  const locale = useContext(LocaleContext);
  return (path: string) => localize(locale, path);
}
