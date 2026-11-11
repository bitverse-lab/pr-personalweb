const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
};
const NOW = { en: "Present", id: "Sekarang" };
const monthLabel = (d: string, locale: "en" | "id") => `${MONTHS[locale][Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

/** "Mar 2024 – Present", "Jan 2023 – Jun 2023", or a single month when start and end fall in the same one. */
export function projectPeriod(start: string | null, end: string | null, locale: "en" | "id" = "en"): string {
  if (!start) return "";
  if (!end) return `${monthLabel(start, locale)} – ${NOW[locale]}`;
  return start.slice(0, 7) === end.slice(0, 7) ? monthLabel(start, locale) : `${monthLabel(start, locale)} – ${monthLabel(end, locale)}`;
}

/** Public (published) project as shown in cards and grids. Safe to import from client components. */
export interface Project {
  id: string;
  slug: string;
  /** Primary display name. */
  name: string;
  /** Secondary muted label shown under the name (the category). */
  label: string;
  /** Category used by the filter buttons; null when the project has none. */
  category: string | null;
  image: string | null;
  summary: string;
  /** One line of measurable result, or null. */
  outcome: string | null;
  technologies: string[];
  featured: boolean;
  /** Indonesian title, summary and outcome when written (see lib/i18n/content.ts). */
  tr?: { title?: string | null; summary?: string | null; outcome?: string | null };
}

export function projectCategories(projects: Project[]): string[] {
  return Array.from(new Set(projects.map((p) => p.category).filter((c): c is string => !!c))).sort((a, b) => a.localeCompare(b));
}

/** Featured projects first, then the rest in their existing order, up to `limit`. */
export function featuredFirst<T extends { featured: boolean }>(projects: T[], limit: number): T[] {
  return [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)].slice(0, limit);
}
