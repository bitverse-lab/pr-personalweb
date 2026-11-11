import { describe, expect, it } from "vitest";
import { formatDate, localizeArticle, localizeArticlePage, localizeProject, localizeProjectPage } from "./content";
import { coverage, pickList, pickText } from "@/features/content/translations";

const doc = (text: string) => ({ type: "doc" as const, content: [{ type: "paragraph", content: [{ type: "text", text }] }] });
const project = { id: "1", slug: "rice", name: "Rice Yield Forecasting", label: "", category: null, image: null, summary: "A forecasting service.", outcome: "7% error", technologies: [], featured: true };

describe("content in the visitor's language", () => {
  it("uses the Indonesian the owner wrote and English for the rest", () => {
    const p = localizeProject({ ...project, tr: { summary: "Layanan prakiraan.", outcome: "  " } }, "id");
    expect(p.summary).toBe("Layanan prakiraan.");
    expect(p.name).toBe("Rice Yield Forecasting");
    expect(p.outcome).toBe("7% error"); // blank Indonesian falls back
  });

  it("leaves English pages untouched", () => {
    const p = { ...project, tr: { summary: "Layanan prakiraan." } };
    expect(localizeProject(p, "en")).toBe(p);
  });

  it("swaps the body and the period on a project page", () => {
    const page = { ...project, period: "Mar 2025 – Present", detail: { startDate: "2025-03-01", endDate: null, content: doc("English story"), translations: { id: { content: doc("Cerita") } } } };
    const id = localizeProjectPage(page, "id");
    expect(id.period).toBe("Mar 2025 – Sekarang");
    expect(id.detail.content).toEqual(doc("Cerita"));
    const empty = localizeProjectPage({ ...page, detail: { ...page.detail, translations: { id: { content: { type: "doc", content: [] } } } } }, "id");
    expect(empty.detail.content).toEqual(doc("English story"));
  });

  it("formats article dates per language", () => {
    expect(formatDate("2026-11-03T08:00:00Z", "en")).toBe("November 3, 2026");
    expect(formatDate("2026-11-03T08:00:00Z", "id")).toBe("3 November 2026");
    const a = { title: "Indexes", excerpt: "Why", date: "November 3, 2026", publishedAt: "2026-11-03T08:00:00Z", tr: { title: "Indeks" } };
    expect(localizeArticle(a, "id")).toMatchObject({ title: "Indeks", excerpt: "Why", date: "3 November 2026" });
    expect(localizeArticlePage({ ...a, detail: { content: doc("EN"), translations: {} } }, "id").detail.content).toEqual(doc("EN"));
  });

  it("picks lists and counts what has been translated", () => {
    expect(pickList("id", ["a"], [])).toEqual(["a"]);
    expect(pickList("id", ["a"], ["b"])).toEqual(["b"]);
    expect(pickText("en", "x", "y")).toBe("x");
    expect(coverage({ id: { title: "T", summary: " ", content: doc("x") } }, ["title", "summary", "content"])).toEqual({ done: 2, total: 3 });
    expect(coverage(undefined, ["title"])).toEqual({ done: 0, total: 1 });
  });
});
