// "Layers" (data, api, ui, ml, …) organise the public site. They are not stored on projects: a
// project's layers are the categories of the owner's own skills whose names it lists as technologies.
// Pure module: used by server data loaders and client components alike.

export interface LayerSkill {
  name: string;
  category: string | null;
}

/** Lower-cased categories of the skills a project uses, unique, in the owner's skill order. */
export function layersOf(technologies: string[], skills: LayerSkill[]): string[] {
  const used = new Set(technologies.map((t) => t.trim().toLowerCase()));
  const out: string[] = [];
  for (const s of skills) {
    const layer = s.category?.trim().toLowerCase();
    if (layer && used.has(s.name.trim().toLowerCase()) && !out.includes(layer)) out.push(layer);
  }
  return out;
}

/** Every layer present across the given projects, in the owner's skill order (for filter chips). */
export function layerSet(projects: { technologies: string[] }[], skills: LayerSkill[]): string[] {
  return layersOf(projects.flatMap((p) => p.technologies), skills);
}

export function currentRole(experience: { role: string; company: string; current: boolean }[]): { role: string; company: string } | null {
  const now = experience.find((e) => e.current);
  return now ? { role: now.role, company: now.company } : null;
}

/** Skill names grouped by layer, in the owner's order. Uncategorised skills still show, under "other". */
export function skillsByLayer(skills: LayerSkill[]): [string, string[]][] {
  const groups = new Map<string, string[]>();
  for (const s of skills) {
    const layer = s.category?.trim().toLowerCase() || "other";
    groups.set(layer, [...(groups.get(layer) ?? []), s.name]);
  }
  return Array.from(groups);
}
