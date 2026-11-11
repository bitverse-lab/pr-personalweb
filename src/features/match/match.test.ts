import { describe, expect, it } from "vitest";
import { buildCorpus, cosine, matchRequirements, skillsIn, splitRequirements } from "./match";
import { buildSnapshot } from "@/features/sandbox/snapshot";

const JD = `
Backend / Data Engineer
About us
We are a fintech in Jakarta.

Requirements:
- 3+ years building REST APIs with Node or Python
• Strong PostgreSQL skills, including query tuning
* Experience shipping machine learning models to production
1. Good communication
Benefits: health insurance, paid leave
Hybrid, Jakarta office
`;

const snapshot = buildSnapshot({
  skills: [
    { label: "PostgreSQL", category: "data", percent: 90 },
    { label: "FastAPI", category: "api", percent: 80 },
    { label: "PyTorch", category: "ml", percent: 80 },
    { label: "Node.js", category: "api", percent: 85 },
  ],
  experience: [{ role: "Lecturer Assistant", company: "Telkom University", period: "2022 – 2023", current: false, achievements: ["Rewrote the lab module around PostgreSQL and real datasets"] }],
  projects: [
    { slug: "rice", name: "Rice Yield Forecasting", category: "Data & ML", summary: "A forecasting service for cooperatives.", outcome: "7% median error", featured: true, technologies: ["PyTorch", "FastAPI", "PostgreSQL"] },
    { slug: "lab", name: "Campus Lab Asset Tracker", category: "Web", summary: "Loan and audit tracking.", outcome: null, featured: false, technologies: ["Node.js"] },
  ],
  articles: [{ slug: "pg-indexes", title: "The Postgres indexes I add on day one", date: "Oct 13, 2026", readMinutes: 3, tags: ["backend", "postgresql"] }],
  testimonials: [{ authorName: "Rina", authorRole: "Head of Product", company: "Acme", quote: "He explains trade-offs so the whole team understands." }],
});
const corpus = buildCorpus(snapshot);
const skills = ["postgresql", "fastapi", "pytorch", "node.js"];

describe("splitRequirements", () => {
  it("keeps requirement lines and drops headings, boilerplate and fragments", () => {
    expect(splitRequirements(JD)).toEqual([
      "We are a fintech in Jakarta",
      "3+ years building REST APIs with Node or Python",
      "Strong PostgreSQL skills, including query tuning",
      "Experience shipping machine learning models to production",
      "Good communication",
    ]);
  });
});

describe("skillsIn", () => {
  it("finds tools by name and common alias, on word boundaries", () => {
    expect(skillsIn("Strong Postgres and node experience", skills)).toEqual(["postgresql", "node.js"]);
    expect(skillsIn("nodeX and postgresqlish", skills)).toEqual([]);
  });
});

describe("matchRequirements", () => {
  it("answers a named tool with the projects, achievements and articles that use it", () => {
    const [r] = matchRequirements(["Strong PostgreSQL skills"], corpus, skills);
    expect(r.matches.map((m) => m.evidence.id)).toEqual(["project:rice", "achievement:2", "article:pg-indexes"]);
    expect(r.matches.every((m) => m.via === "skill")).toBe(true);
  });

  it("answers an area named in general terms with work in that layer", () => {
    const [r] = matchRequirements(["Experience deploying machine learning models"], corpus, skills);
    expect(r.matches[0]).toMatchObject({ via: "layer", evidence: { id: "project:rice" } });
  });

  it("is an honest gap when nothing matches", () => {
    expect(matchRequirements(["Good communication"], corpus, skills)[0].matches).toEqual([]);
  });

  it("adds matches by meaning from vectors, above the threshold only", () => {
    const req = [[1, 0, 0]];
    const vecs = corpus.map((e) => (e.id === "project:lab" ? [0.9, 0.1, 0] : [0, 0, 1]));
    const [r] = matchRequirements(["Tracking equipment loans"], corpus, skills, { requirements: req, corpus: vecs });
    expect(r.matches).toHaveLength(1);
    expect(r.matches[0]).toMatchObject({ via: "meaning", evidence: { id: "project:lab" } });
  });

  it("cosine is 1 for the same direction and 0 for orthogonal", () => {
    expect(cosine([1, 2], [2, 4])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBe(0);
  });
});
