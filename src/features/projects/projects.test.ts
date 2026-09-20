import { describe, expect, it } from "vitest";
import { projectPeriod } from "./format";
import { saveProjectSchema, techListSchema } from "./schema";

const uuid = "123e4567-e89b-42d3-a456-426614174000";
const base = { id: uuid, title: "My app", slug: "my-app", technologies: [], content: { type: "doc", content: [] }, gallery: [], links: [] };

describe("projectPeriod", () => {
  it("formats ranges, ongoing work and single months", () => {
    expect(projectPeriod("2024-03-01", null)).toBe("Mar 2024 – Present");
    expect(projectPeriod("2023-01-01", "2023-06-01")).toBe("Jan 2023 – Jun 2023");
    expect(projectPeriod("2023-05-01", "2023-05-20")).toBe("May 2023");
    expect(projectPeriod(null, "2023-05-01")).toBe("");
  });
});

describe("saveProjectSchema", () => {
  it("accepts a minimal project and treats blanks as empty", () => {
    const r = saveProjectSchema.safeParse({ ...base, summary: "", category: "  ", startDate: "", endDate: "" });
    expect(r.success).toBe(true);
    if (r.success) expect([r.data.summary, r.data.category, r.data.startDate]).toEqual([null, null, null]);
  });

  it("only allows http(s) links and caps how many", () => {
    expect(saveProjectSchema.safeParse({ ...base, links: [{ label: "Live", url: "https://example.com" }] }).success).toBe(true);
    for (const url of ["javascript:alert(1)", "mailto:a@b.co", "ftp://x.y", "//evil.example"]) {
      expect(saveProjectSchema.safeParse({ ...base, links: [{ label: "x", url }] }).success).toBe(false);
    }
    expect(saveProjectSchema.safeParse({ ...base, links: Array.from({ length: 9 }, (_, i) => ({ label: `l${i}`, url: "https://a.co" })) }).success).toBe(false);
  });

  it("keeps dates in order", () => {
    expect(saveProjectSchema.safeParse({ ...base, startDate: "2024-01-01", endDate: "2023-01-01" }).success).toBe(false);
    expect(saveProjectSchema.safeParse({ ...base, startDate: "2023-01-01", endDate: "2024-01-01" }).success).toBe(true);
    expect(saveProjectSchema.safeParse({ ...base, startDate: "2023-01-01" }).success).toBe(true); // ongoing
  });

  it("rejects unsafe rich text, oversized summaries and bad image ids", () => {
    const evil = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:1" } }] }] }] };
    expect(saveProjectSchema.safeParse({ ...base, content: evil }).success).toBe(false);
    expect(saveProjectSchema.safeParse({ ...base, summary: "x".repeat(301) }).success).toBe(false);
    expect(saveProjectSchema.safeParse({ ...base, gallery: [{ mediaId: "nope" }] }).success).toBe(false);
    expect(saveProjectSchema.safeParse({ ...base, gallery: Array.from({ length: 25 }, () => ({ mediaId: uuid })) }).success).toBe(false);
  });

  it("dedupes technologies case-insensitively", () => {
    expect(techListSchema.parse(["React", "react", " Node "])).toEqual(["React", "Node"]);
    expect(techListSchema.safeParse(Array.from({ length: 16 }, (_, i) => `t${i}`)).success).toBe(false);
  });
});
