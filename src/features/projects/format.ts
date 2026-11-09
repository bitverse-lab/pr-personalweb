const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (d: string) => `${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

/** "Mar 2024 – Present", "Jan 2023 – Jun 2023", or a single month when start and end fall in the same one. */
export function projectPeriod(start: string | null, end: string | null): string {
  if (!start) return "";
  if (!end) return `${monthLabel(start)} – Present`;
  return start.slice(0, 7) === end.slice(0, 7) ? monthLabel(start) : `${monthLabel(start)} – ${monthLabel(end)}`;
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
  image: string;
  summary: string;
  /** One line of measurable result, or null. */
  outcome: string | null;
  technologies: string[];
  featured: boolean;
}

export function projectCategories(projects: Project[]): string[] {
  return Array.from(new Set(projects.map((p) => p.category).filter((c): c is string => !!c))).sort((a, b) => a.localeCompare(b));
}
