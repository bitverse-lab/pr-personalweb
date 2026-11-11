// The public data the in-browser SQL sandbox is loaded with. Pure: built only from the same
// public-safe shapes the pages render (published projects and articles, the public profile,
// published testimonials), so nothing private can reach it.

export type Cell = string | number | boolean | null;
export interface SnapshotTable {
  name: string;
  columns: { name: string; type: "text" | "int" | "boolean" | "date" | "text[]" }[];
  rows: Cell[][];
}
export interface Snapshot {
  tables: SnapshotTable[];
}

export interface SnapshotInput {
  skills: { label: string; category: string | null; percent: number | null }[];
  experience: { role: string; company: string; location?: string | null; period: string; current: boolean; achievements?: string[] }[];
  projects: { slug: string; name: string; category: string | null; summary: string; outcome: string | null; featured: boolean; technologies: string[] }[];
  articles: { slug: string; title: string; date: string; readMinutes: number; tags: string[] }[];
  testimonials: { authorName: string; authorRole: string; company: string; quote: string }[];
}

/** Postgres array literal: {"a","b"}. */
const arrayLiteral = (items: string[]) => `{${items.map((s) => `"${s.replace(/[\\"]/g, (c) => `\\${c}`)}"`).join(",")}}`;

/** "Nov 3, 2026" → "2026-11-03"; null when the text is not a date. */
function isoDate(text: string): string | null {
  const d = new Date(`${text} UTC`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function buildSnapshot(input: SnapshotInput): Snapshot {
  return {
    tables: [
      {
        name: "skill",
        columns: [{ name: "name", type: "text" }, { name: "layer", type: "text" }, { name: "level", type: "int" }],
        rows: input.skills.map((s) => [s.label, s.category?.trim().toLowerCase() || null, s.percent]),
      },
      {
        name: "experience",
        columns: [{ name: "id", type: "int" }, { name: "role", type: "text" }, { name: "company", type: "text" }, { name: "location", type: "text" }, { name: "period", type: "text" }, { name: "current", type: "boolean" }],
        rows: input.experience.map((e, i) => [i + 1, e.role, e.company, e.location ?? null, e.period, e.current]),
      },
      {
        name: "achievement",
        columns: [{ name: "experience_id", type: "int" }, { name: "what", type: "text" }],
        rows: input.experience.flatMap((e, i) => (e.achievements ?? []).map((a): Cell[] => [i + 1, a])),
      },
      {
        name: "project",
        columns: [{ name: "slug", type: "text" }, { name: "title", type: "text" }, { name: "category", type: "text" }, { name: "summary", type: "text" }, { name: "outcome", type: "text" }, { name: "featured", type: "boolean" }],
        rows: input.projects.map((p) => [p.slug, p.name, p.category, p.summary, p.outcome, p.featured]),
      },
      {
        name: "project_skill",
        columns: [{ name: "project_slug", type: "text" }, { name: "skill", type: "text" }],
        rows: input.projects.flatMap((p) => p.technologies.map((t): Cell[] => [p.slug, t])),
      },
      {
        name: "article",
        columns: [{ name: "slug", type: "text" }, { name: "title", type: "text" }, { name: "published", type: "date" }, { name: "read_minutes", type: "int" }, { name: "tags", type: "text[]" }],
        rows: input.articles.map((a) => [a.slug, a.title, isoDate(a.date), a.readMinutes, arrayLiteral(a.tags)]),
      },
      {
        name: "testimonial",
        columns: [{ name: "author", type: "text" }, { name: "role", type: "text" }, { name: "company", type: "text" }, { name: "quote", type: "text" }],
        rows: input.testimonials.map((t) => [t.authorName, t.authorRole || null, t.company || null, t.quote]),
      },
    ],
  };
}

/** CREATE TABLE statements for a snapshot (identifiers come from the fixed list above, never from data). */
export function snapshotDdl(snapshot: Snapshot): string {
  return snapshot.tables.map((t) => `create table ${t.name} (${t.columns.map((c) => `${c.name} ${c.type}`).join(", ")});`).join("\n");
}
