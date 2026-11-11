import { describe, expect, it } from "vitest";
import { asOf, buildTimeline } from "./timeline";

const now = new Date("2026-11-11T00:00:00Z");
const input = {
  skills: ["PostgreSQL", "Laravel", "PyTorch", "Kubernetes"],
  projects: [
    { slug: "forecast", technologies: ["PyTorch", "PostgreSQL"], startDate: "2025-03-01" },
    { slug: "tracker", technologies: ["Laravel"], startDate: "2023-04-01" },
    { slug: "undated", technologies: ["PyTorch"], startDate: null },
  ],
  experience: [
    { startDate: "2022-08-01", text: "Lecturer Assistant. Rewrote the lab module around PostgreSQL" },
    { startDate: "2021-06-01", text: "Freelance web developer. Built a clinic queue in laravel" },
  ],
  now,
};

describe("buildTimeline", () => {
  it("dates each skill by its earliest dated evidence, from projects or roles", () => {
    const t = buildTimeline(input)!;
    expect(t.skills).toEqual({ PostgreSQL: 2022, Laravel: 2021, PyTorch: 2025 });
    expect(t.projects).toEqual({ forecast: 2025, tracker: 2023 });
    expect(t.from).toBe(2021); // Laravel, named in the 2021 role
    expect(t.to).toBe(2026);
  });

  it("leaves a skill with no dated evidence undated instead of guessing", () => {
    expect(buildTimeline(input)!.skills).not.toHaveProperty("Kubernetes");
  });

  it("starts where something first appears, not at a role that names no tool", () => {
    const t = buildTimeline({ ...input, experience: [{ startDate: "2019-01-01", text: "Intern" }, ...input.experience.slice(0, 1)] })!;
    expect(t.from).toBe(2022);
  });

  it("needs at least two distinct years", () => {
    expect(buildTimeline({ ...input, projects: [], experience: [{ startDate: "2026-01-01", text: "PostgreSQL" }] })).toBeNull();
  });

  it("counts what existed by a year", () => {
    const t = buildTimeline(input)!;
    expect(asOf(t, 2022)).toEqual({ skills: 2, projects: 0, newSkills: ["PostgreSQL"] });
    expect(asOf(t, 2025)).toMatchObject({ skills: 3, projects: 2, newSkills: ["PyTorch"] });
  });
});
