// The public site in two languages. English lives at the root (/projects); Indonesian under /id
// (/id/projects). Only the pages a recruiter reads have an Indonesian version; the rest (/match,
// /proof, /architecture, /privacy, …) stay English, and the language switch leads there to the
// Indonesian home instead of a 404.
export type Locale = "en" | "id";

const TRANSLATED = /^\/(about|cv|projects|projects\/[^/]+|articles|articles\/[^/]+|contact)?$/;

/** Whether a (root, unprefixed) path has an Indonesian version. */
export const hasIndonesian = (path: string) => TRANSLATED.test(path.split("?")[0]!);

/** The path in a locale: "/projects" → "/id/projects" for Indonesian. Query strings are kept. */
export function localize(locale: Locale, path: string): string {
  if (locale === "en") return path;
  return path === "/" ? "/id" : path.startsWith("/?") ? `/id${path.slice(1)}` : `/id${path}`;
}

/** Splits a URL path into its locale and the root path it shows. */
export function splitLocale(path: string): { locale: Locale; path: string } {
  const m = /^\/id(?=\/|$|\?)(.*)$/.exec(path);
  return m ? { locale: "id", path: m[1] || "/" } : { locale: "en", path };
}

/** Where the language switch on `path` leads, in the other language. */
export function switchTarget(path: string): string {
  const { locale, path: root } = splitLocale(path);
  if (locale === "id") return root;
  return hasIndonesian(root) ? localize("id", root) : "/id";
}

/** hreflang alternates for a translated page (Next metadata `alternates.languages`). */
export const languages = (path: string) => ({ en: path, id: localize("id", path), "x-default": path });
