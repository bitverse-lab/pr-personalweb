import { describe, expect, it } from "vitest";
import { rankForRole, roleBySlug, roleFit, ROLES } from "./roles";

const skills = [
  { name: "PostgreSQL", category: "data" },
  { name: "FastAPI", category: "api" },
  { name: "React", category: "ui" },
  { name: "PyTorch", category: "ml" },
  { name: "Docker", category: "ops" },
];
const projects = [
  { slug: "web", technologies: ["React", "FastAPI"] },
  { slug: "forecast", technologies: ["PyTorch", "PostgreSQL", "Docker"] },
  { slug: "notes", technologies: ["Markdown"] },
  { slug: "api", technologies: ["FastAPI", "PostgreSQL"] },
];

describe("roles", () => {
  it("weighs a role's first layer most", () => {
    const data = roleBySlug("data-engineer")!;
    expect(roleFit(["data"], data)).toBe(3);
    expect(roleFit(["ml"], data)).toBe(1);
    expect(roleFit(["ui"], data)).toBe(0);
  });

  it("puts the work for the role first and keeps everything", () => {
    expect(rankForRole(projects, skills, roleBySlug("data-engineer")!).map((p) => p.slug)).toEqual(["forecast", "api", "web", "notes"]);
    expect(rankForRole(projects, skills, roleBySlug("frontend")!).map((p) => p.slug)).toEqual(["web", "api", "forecast", "notes"]);
  });

  it("keeps the original order when nothing fits", () => {
    expect(rankForRole(projects, [], ROLES[0]).map((p) => p.slug)).toEqual(["web", "forecast", "notes", "api"]);
  });

  it("knows only its own slugs", () => {
    expect(roleBySlug("ceo")).toBeNull();
    expect(new Set(ROLES.map((r) => r.slug)).size).toBe(ROLES.length);
  });
});
