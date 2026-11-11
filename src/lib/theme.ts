// The public site has a light and a dark theme; the workspace (/me) is light only.
// The choice is the visitor's system setting until they press the toggle, then what they chose.
export type Theme = "light" | "dark";
export const THEME_KEY = "theme";

export const isPrivatePath = (path: string) => /^\/me(\/|$)/.test(path);

/** What the theme should be on a path, given the stored choice and the system preference. */
export function resolveTheme(path: string, stored: string | null, systemDark: boolean): Theme {
  if (isPrivatePath(path)) return "light";
  if (stored === "light" || stored === "dark") return stored;
  return systemDark ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  // Bootstrap 5.3 switches its own components (forms, tables, dropdowns) on this attribute.
  document.documentElement.dataset.bsTheme = theme;
}

// Runs in <head> before the first paint so a dark visitor never sees a white flash. It repeats
// resolveTheme inline because nothing is loaded yet; theme.test.ts keeps the two in step.
export const THEME_SCRIPT = `(function(){try{var p=location.pathname,s=null;try{s=localStorage.getItem("${THEME_KEY}")}catch(e){}var t=/^\\/me(\\/|$)/.test(p)?"light":(s==="light"||s==="dark")?s:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t;document.documentElement.dataset.bsTheme=t}catch(e){}})()`;
