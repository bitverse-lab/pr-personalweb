import { describe, expect, it } from "vitest";
import { buildSnapshot, snapshotDdl } from "./snapshot";

const input = {
  skills: [{ label: "PyTorch", category: "ML", percent: 80 }],
  experience: [{ role: "Engineer", company: "Acme", period: "2025 – Present", current: true, achievements: ["Shipped X", "Cut Y"] }],
  projects: [{ slug: "rice", name: "Rice", category: "Data & ML", summary: "s", outcome: null, featured: true, technologies: ["PyTorch", "FastAPI"] }],
  articles: [{ slug: "a", title: 'Say "hi"', date: "Nov 3, 2026", readMinutes: 4, tags: ["ml", 'a"b'] }],
  testimonials: [{ authorName: "Rina", authorRole: "", company: "Acme", quote: "Good." }],
};

describe("sandbox snapshot", () => {
  it("contains exactly the public tables, nothing else", () => {
    expect(buildSnapshot(input).tables.map((t) => t.name)).toEqual(["skill", "experience", "achievement", "project", "project_skill", "article", "testimonial"]);
  });

  it("never carries contact details or internal ids", () => {
    const columns = buildSnapshot(input).tables.flatMap((t) => t.columns.map((c) => c.name));
    for (const banned of ["email", "user_id", "phone", "ip_hash", "source_url"]) expect(columns).not.toContain(banned);
  });

  it("links rows and converts values", () => {
    const t = Object.fromEntries(buildSnapshot(input).tables.map((x) => [x.name, x.rows]));
    expect(t.skill[0]).toEqual(["PyTorch", "ml", 80]);
    expect(t.achievement).toEqual([[1, "Shipped X"], [1, "Cut Y"]]);
    expect(t.project_skill).toEqual([["rice", "PyTorch"], ["rice", "FastAPI"]]);
    expect(t.article[0]).toEqual(["a", 'Say "hi"', "2026-11-03", 4, '{"ml","a\\"b"}']);
    expect(t.testimonial[0]).toEqual(["Rina", null, "Acme", "Good."]);
  });

  it("writes one create table per table", () => {
    expect(snapshotDdl(buildSnapshot(input)).split("\n")).toHaveLength(7);
  });
});
