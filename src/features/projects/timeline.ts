// The career time scrubber's data: when each skill and project first appears in the owner's dated
// work. Nothing is entered by hand. A project's year is its start date; a skill's year is the
// earliest dated project that lists it, or the earliest role whose text names it. A skill with no
// dated evidence has no year, and the scrubber says so rather than guessing one.
// Pure module: used by the console loader on the server and by the hero on the client.
import { skillsIn } from "@/features/match/match";

export interface Timeline {
  from: number;
  to: number;
  /** Skill name, as the owner spells it → first year seen. Undated skills are absent. */
  skills: Record<string, number>;
  /** Project slug → start year. Undated projects are absent. */
  projects: Record<string, number>;
}

export interface TimelineInput {
  skills: string[];
  projects: { slug: string; technologies: string[]; startDate: string | null }[];
  experience: { startDate: string; text: string }[];
  now: Date;
}

const yearOf = (date: string | null) => (date && /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : null);

/** Null when there is not enough dated work to scrub through (fewer than two distinct years). */
export function buildTimeline({ skills, projects, experience, now }: TimelineInput): Timeline | null {
  const names = skills.map((s) => s.toLowerCase());
  const spelled = new Map(skills.map((s) => [s.toLowerCase(), s]));
  const first = new Map<string, number>();
  const see = (lower: string, year: number) => {
    const skill = spelled.get(lower)!;
    first.set(skill, Math.min(first.get(skill) ?? year, year));
  };

  const projectYears: Record<string, number> = {};
  for (const p of projects) {
    const year = yearOf(p.startDate);
    if (year === null) continue;
    projectYears[p.slug] = year;
    for (const t of p.technologies) if (names.includes(t.toLowerCase())) see(t.toLowerCase(), year);
  }
  for (const e of experience) {
    const year = yearOf(e.startDate);
    if (year === null) continue;
    for (const s of skillsIn(e.text, names)) see(s, year);
  }

  // The range starts at the first year something appears; a role that names no tool adds nothing to show.
  const years = [...Array.from(first.values()), ...Object.values(projectYears)];
  if (new Set(years).size < 2) return null;
  return { from: Math.min(...years), to: Math.max(now.getFullYear(), ...years), skills: Object.fromEntries(first), projects: projectYears };
}

/** What exists by the end of a year: counts for the scrubber's caption. */
export function asOf(timeline: Timeline, year: number) {
  const skills = Object.entries(timeline.skills).filter(([, y]) => y <= year);
  return {
    skills: skills.length,
    projects: Object.values(timeline.projects).filter((y) => y <= year).length,
    newSkills: skills.filter(([, y]) => y === year).map(([s]) => s),
  };
}
