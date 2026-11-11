// Role-tailored home pages (/for/<role>): the owner sends the link that matches the job, and the
// visitor sees the work for that role first. Nothing is hidden or rewritten, only reordered.
// Pure module: the ranking uses the same derived layers as the rest of the public site.
import { layersOf, type LayerSkill } from "@/features/projects/layers";

export interface Role {
  slug: string;
  title: string;
  /** The owner's layers (skill categories) this role cares about, most important first. */
  layers: string[];
}

export const ROLES: Role[] = [
  { slug: "data-analyst", title: "Data Analyst", layers: ["data", "ml", "ui"] },
  { slug: "data-engineer", title: "Data Engineer", layers: ["data", "ops", "ml"] },
  { slug: "ml-engineer", title: "ML Engineer", layers: ["ml", "data", "api"] },
  { slug: "backend", title: "Backend Engineer", layers: ["api", "data", "ops"] },
  { slug: "frontend", title: "Frontend Engineer", layers: ["ui", "api"] },
  { slug: "fullstack", title: "Full-Stack Engineer", layers: ["ui", "api", "data"] },
];

export const roleBySlug = (slug: string) => ROLES.find((r) => r.slug === slug) ?? null;

/** How well a project fits a role: earlier role layers weigh more (3, 2, 1). */
export function roleFit(layers: string[], role: Role): number {
  return role.layers.reduce((sum, l, i) => sum + (layers.includes(l) ? role.layers.length - i : 0), 0);
}

/** Projects by fit for the role; ties keep their original order (featured first, then newest). */
export function rankForRole<T extends { technologies: string[] }>(projects: T[], skills: LayerSkill[], role: Role): T[] {
  return projects
    .map((p, i) => ({ p, i, fit: roleFit(layersOf(p.technologies, skills), role) }))
    .sort((a, b) => b.fit - a.fit || a.i - b.i)
    .map((x) => x.p);
}
