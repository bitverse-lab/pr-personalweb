import { unstable_cache } from "next/cache";
import { layersOf } from "@/features/projects/layers";
import { buildTimeline, type Timeline } from "@/features/projects/timeline";
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
  highlights: { metric: string; value: string; note: string | null }[];
  available: boolean;
  availabilityNote: string;
  skills: { name: string; category: string | null }[];
  projects: { title: string; slug: string; outcome: string | null; summary: string | null; technologies: string[]; featured: boolean }[];
}

export function buildConsoleTables(input: ConsoleInput): ConsoleTable[] {
  const status: ConsoleRow = input.available
    ? { key: "status", value: "open", note: input.availabilityNote || "Available for full-time roles" }
    : { key: "status", value: "not looking", note: input.availabilityNote || "Not looking right now" };

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
      plain: "My strongest credentials, in plain words.",
      columns: ["metric", "value", "what it means"],
      rows: [...input.highlights.map((h) => ({ key: h.metric, value: h.value, note: h.note ?? "" })), status],
    },
    {
      name: "stack.sql",
      sql: "SELECT layer, tools\nFROM   skill\nGROUP BY layer;",
      plain: "The tools I use, grouped by what they are for. Point at one to see the projects that use it.",
      columns: ["layer", "tools", "used for"],
      rows: Array.from(groups, ([layer, names]) => ({ key: layer, value: names[0], note: names.join(", ") })),
    },
    {
      name: "projects.sql",
      sql: "SELECT title, layers, outcome\nFROM   project\nWHERE  published\nORDER BY featured DESC;",
      plain: "Projects I have shipped. Choose one to read the case study.",
      columns: ["title", "layers", "outcome"],
      rows: ordered.map((p) => {
        const layers = layersOf(p.technologies, input.skills);
        return { key: p.title, value: `${layers.length} layer${layers.length === 1 ? "" : "s"}`, note: p.outcome || p.summary || "", layers, slug: p.slug };
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
  async (): Promise<ConsoleData | null> => {
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
        skills: full.skills.map((s) => ({ name: s.name, category: s.category })),
        projects: published,
      }),
      timeline: buildTimeline({
        skills: full.skills.map((s) => s.name),
        projects: published.map((p) => ({ slug: p.slug, technologies: p.technologies, startDate: p.startDate })),
        experience: full.experiences.map((e) => ({ startDate: e.startDate, text: [e.role, e.description ?? "", ...e.achievements].join(". ") })),
        now: new Date(),
      }),
    };
  },
  // Bump when the shape changes (v3: the timeline, keyed by the owner's spelling).
  ["public-console", "v3"],
  { tags: [SITE_TAG], revalidate: SITE_REVALIDATE_SECONDS },
);

/** Null when the database is unreachable (or there is no owner yet): the home page renders without the console. */
export function getConsoleData(): Promise<ConsoleData | null> {
  return publicRead("the hero console", loadConsole, null);
}
