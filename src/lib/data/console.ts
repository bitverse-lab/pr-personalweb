import { unstable_cache } from "next/cache";
import { pickText, type HighlightTr, type ProjectTr } from "@/features/content/translations";
import { layersOf } from "@/features/projects/layers";
import { buildTimeline, type Timeline } from "@/features/projects/timeline";
import { dict } from "@/lib/i18n/dict";
import type { Locale } from "@/lib/i18n/locale";
import { SITE_REVALIDATE_SECONDS, SITE_TAG, publicRead } from "@/lib/data/site-cache";
import { articleRepository } from "@/server/repositories/article-repository";
import { profileRepository } from "@/server/repositories/profile-repository";
import { projectService } from "@/server/services/project-service";

// The home page "query console": three fixed, read-only queries over the owner's own tables.
// Nothing here is invented — every row is a row, and `ms` is the time those reads really took.

export interface ConsoleRow {
  key: string;
  value: string;
  note: string;
  layers?: string[];
  slug?: string;
}

export interface ConsoleTable {
  name: "profile.sql" | "stack.sql" | "projects.sql";
  sql: string;
  plain: string;
  columns: [string, string, string];
  rows: ConsoleRow[];
}

export interface ConsoleData {
  host: string;
  tables: ConsoleTable[];
  /** Wall-clock time of the three reads, measured when the page data was last generated. */
  ms: number;
  /** ISO time of that measurement; the page is cached, so the UI shows its age. */
  measuredAt: string;
  /** When each skill and project first appears in dated work (the hero's career scrubber). Optional: older cached entries lack it. */
  timeline?: Timeline | null;
}

export interface ConsoleInput {
  highlights: { metric: string; value: string; note: string | null; translations?: HighlightTr }[];
  available: boolean;
  availabilityNote: string;
  availabilityNoteId?: string | null;
  skills: { name: string; category: string | null }[];
  projects: { title: string; slug: string; outcome: string | null; summary: string | null; technologies: string[]; featured: boolean; translations?: ProjectTr }[];
}

/** The SQL and the column keys stay as written (they are the query); the words around them follow the page language. */
export function buildConsoleTables(input: ConsoleInput, locale: Locale = "en"): ConsoleTable[] {
  const t = dict(locale).console;
  const note = pickText(locale, input.availabilityNote, input.availabilityNoteId);
  const status: ConsoleRow = input.available ? { key: "status", value: "open", note: note || t.open } : { key: "status", value: "not looking", note: note || t.notLooking };

  const groups = new Map<string, string[]>();
  for (const s of input.skills) {
    const layer = s.category?.trim().toLowerCase();
    if (!layer) continue;
    groups.set(layer, [...(groups.get(layer) ?? []), s.name]);
  }

  const ordered = [...input.projects.filter((p) => p.featured), ...input.projects.filter((p) => !p.featured)];

  return [
    {
      name: "profile.sql",
      sql: "SELECT metric, value, note\nFROM   profile_highlight\nORDER BY position;",
      plain: t.plainProfile,
      columns: ["metric", "value", t.meaning],
      rows: [...input.highlights.map((h) => ({ key: h.metric, value: h.value, note: pickText(locale, h.note ?? "", h.translations?.id?.note) })), status],
    },
    {
      name: "stack.sql",
      sql: "SELECT layer, tools\nFROM   skill\nGROUP BY layer;",
      plain: t.plainStack,
      columns: ["layer", "tools", t.usedFor],
      rows: Array.from(groups, ([layer, names]) => ({ key: layer, value: names[0], note: names.join(", ") })),
    },
    {
      name: "projects.sql",
      sql: "SELECT title, layers, outcome\nFROM   project\nWHERE  published\nORDER BY featured DESC;",
      plain: t.plainProjects,
      columns: ["title", "layers", "outcome"],
      rows: ordered.map((p) => {
        const layers = layersOf(p.technologies, input.skills);
        const tr = p.translations?.id;
        const outcome = pickText(locale, p.outcome, tr?.outcome) || pickText(locale, p.summary, tr?.summary) || "";
        return { key: pickText(locale, p.title, tr?.title), value: dict(locale).work.layers(layers.length), note: outcome, layers, slug: p.slug };
      }),
    },
  ];
}

function siteHost(): string {
  const url = process.env.SITE_URL || process.env.AUTH_URL;
  try {
    return url ? new URL(url).hostname : "localhost";
  } catch {
    return "localhost";
  }
}

const loadConsole = unstable_cache(
  async (locale: Locale): Promise<ConsoleData | null> => {
    const started = performance.now();
    const owner = await articleRepository.owner();
    if (!owner) return null;
    const [full, published] = await Promise.all([profileRepository.findFull(owner.id), projectService.published()]);
    const ms = Math.max(1, Math.round(performance.now() - started));
    return {
      host: siteHost(),
      ms,
      measuredAt: new Date().toISOString(),
      tables: buildConsoleTables({
        highlights: full.highlights,
        available: full.profile?.availableForWork ?? false,
        availabilityNote: full.profile?.availabilityNote ?? "",
        availabilityNoteId: full.profile?.translations?.id?.availabilityNote,
        skills: full.skills.map((s) => ({ name: s.name, category: s.category })),
        projects: published,
      }, locale),
      timeline: buildTimeline({
        skills: full.skills.map((s) => s.name),
        projects: published.map((p) => ({ slug: p.slug, technologies: p.technologies, startDate: p.startDate })),
        experience: full.experiences.map((e) => ({ startDate: e.startDate, text: [e.role, e.description ?? "", ...e.achievements].join(". ") })),
        now: new Date(),
      }),
    };
  },
  // Bump when the shape changes (v4: one entry per language; the locale argument is part of the key).
  ["public-console", "v4"],
  { tags: [SITE_TAG], revalidate: SITE_REVALIDATE_SECONDS },
);

/** Null when the database is unreachable (or there is no owner yet): the home page renders without the console. */
export function getConsoleData(locale: Locale = "en"): Promise<ConsoleData | null> {
  return publicRead("the hero console", () => loadConsole(locale), null);
}
