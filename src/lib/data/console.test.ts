import { beforeEach, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn, revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/report-error", () => ({ reportError: vi.fn() }));
vi.mock("@/server/repositories/article-repository", () => ({ articleRepository: { owner: vi.fn() } }));
vi.mock("@/server/repositories/profile-repository", () => ({ profileRepository: { findFull: vi.fn() } }));
vi.mock("@/server/services/project-service", () => ({ projectService: { published: vi.fn() } }));

import { articleRepository } from "@/server/repositories/article-repository";
import { buildConsoleTables, getConsoleData } from "./console";

const input = {
  highlights: [
    { metric: "gpa", value: "3.92 /4.00", note: "Summa Cum Laude" },
    { metric: "ip_rights", value: "6 HKI", note: null },
  ],
  available: true,
  availabilityNote: "",
  skills: [
    { name: "PostgreSQL", category: "Data" },
    { name: "Pandas", category: "Data" },
    { name: "PyTorch", category: "ML" },
    { name: "Git", category: null },
  ],
  projects: [
    { title: "Sentiment API", slug: "sentiment", outcome: null, summary: "IndoBERT behind FastAPI", technologies: ["PyTorch"], featured: false },
    { title: "Rice Yield", slug: "yield", outcome: "7% median error", summary: "Forecasts", technologies: ["PostgreSQL", "PyTorch"], featured: true },
  ],
};

const table = (name: string) => buildConsoleTables(input).find((t) => t.name === name)!;

beforeEach(() => vi.clearAllMocks());

test("profile.sql lists the owner's highlights in order, then their availability", () => {
  expect(table("profile.sql").rows).toEqual([
    { key: "gpa", value: "3.92 /4.00", note: "Summa Cum Laude" },
    { key: "ip_rights", value: "6 HKI", note: "" },
    { key: "status", value: "open", note: "Available for full-time roles" },
  ]);
  const notLooking = buildConsoleTables({ ...input, available: false }).find((t) => t.name === "profile.sql")!.rows.at(-1);
  expect(notLooking).toEqual({ key: "status", value: "not looking", note: "Not looking right now" });
});

test("stack.sql groups skills by their lower-cased category; uncategorised skills are left out", () => {
  expect(table("stack.sql").rows).toEqual([
    { key: "data", value: "PostgreSQL", note: "PostgreSQL, Pandas" },
    { key: "ml", value: "PyTorch", note: "PyTorch" },
  ]);
});

test("projects.sql puts featured work first, with derived layers and the outcome (or summary)", () => {
  const rows = table("projects.sql").rows;
  expect(rows.map((r) => r.slug)).toEqual(["yield", "sentiment"]);
  expect(rows[0]).toMatchObject({ key: "Rice Yield", note: "7% median error", layers: ["data", "ml"] });
  expect(rows[1].note).toBe("IndoBERT behind FastAPI");
});

test("an owner with nothing yet gets empty tables, never invented rows", () => {
  const empty = buildConsoleTables({ highlights: [], available: false, availabilityNote: "", skills: [], projects: [] });
  expect(empty.find((t) => t.name === "stack.sql")!.rows).toEqual([]);
  expect(empty.find((t) => t.name === "projects.sql")!.rows).toEqual([]);
  expect(empty.find((t) => t.name === "profile.sql")!.rows.map((r) => r.key)).toEqual(["status"]);
});

test("every table carries its fixed SQL text, a plain-language line and three column names", () => {
  for (const t of buildConsoleTables(input)) {
    expect(t.sql).toMatch(/^SELECT /);
    expect(t.plain.length).toBeGreaterThan(10);
    expect(t.columns).toHaveLength(3);
  }
});

test("a database failure yields null, so the page renders without the console", async () => {
  vi.mocked(articleRepository.owner).mockRejectedValue(new Error("down"));
  expect(await getConsoleData()).toBeNull();
});
