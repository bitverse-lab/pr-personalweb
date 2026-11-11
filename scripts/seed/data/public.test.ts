import { expect, test } from "vitest";
import { validateDoc } from "../../../src/features/content/richtext";
import { isDemoId } from "../ids";
import { buildPublic, emptyPublicContext } from "./public";

const OWNER = "owner-1";
const TODAY = new Date("2026-11-09T00:00:00Z");
const publicUrl = (key: string) => `https://cdn.test/public-media/${key}`;

function rowsOf(seed: object) {
  return (Object.values(seed) as unknown[][]).flatMap((rows) => rows.map((r) => ((r as { row?: object }).row ?? r) as Record<string, unknown>));
}

test("every row is demo-marked and owned by the owner", () => {
  const seed = buildPublic(OWNER, TODAY, emptyPublicContext(), publicUrl);
  for (const row of rowsOf(seed)) {
    if ("id" in row) expect(isDemoId(row.id as string)).toBe(true);
    if ("userId" in row) expect(row.userId).toBe(OWNER);
  }
});

test("counts and statuses match the spec", () => {
  const seed = buildPublic(OWNER, TODAY, emptyPublicContext(), publicUrl);
  expect(seed.experiences).toHaveLength(4);
  expect(seed.educations).toHaveLength(2);
  expect(seed.skills).toHaveLength(18);
  expect(new Set(seed.skills.map((s) => s.category))).toEqual(new Set(["Data", "API", "UI", "ML", "Ops"]));
  expect(seed.socialLinks.map((l) => l.label).sort()).toEqual(["GitHub", "LinkedIn"]);
  expect(seed.projects.map((p) => p.status).sort()).toEqual(["archived", "draft", "published", "published", "published"]);
  expect(seed.projects.filter((p) => p.featured)).toHaveLength(1);
  expect(seed.articles.map((a) => a.status).sort()).toEqual(["archived", "draft", "published", "published", "published", "published"]);
  expect(seed.testimonials.filter((t) => t.published)).toHaveLength(4);
  expect(seed.testimonials).toHaveLength(5);
  expect(seed.contactMessages).toHaveLength(6);
  expect(seed.contactMessages.filter((m) => m.readAt)).toHaveLength(3);
});

test("published projects carry a one-line outcome", () => {
  const seed = buildPublic(OWNER, TODAY, emptyPublicContext(), publicUrl);
  expect(seed.projects.filter((p) => p.status === "published").every((p) => typeof p.outcome === "string" && p.outcome.length <= 140)).toBe(true);
});

test("published articles fall within the last 90 days, newest not in the future", () => {
  const seed = buildPublic(OWNER, TODAY, emptyPublicContext(), publicUrl);
  for (const a of seed.articles.filter((x) => x.status === "published")) {
    const days = (TODAY.getTime() - (a.publishedAt as Date).getTime()) / 86_400_000;
    expect(days).toBeGreaterThanOrEqual(0);
    expect(days).toBeLessThanOrEqual(90);
  }
});

test("positions continue after the owner's own rows", () => {
  const ctx = { ...emptyPublicContext(), positions: { experience: 2, skill: 7, project: 3 } };
  const seed = buildPublic(OWNER, TODAY, ctx, publicUrl);
  expect(Math.min(...seed.experiences.map((e) => e.position!))).toBe(3);
  expect(Math.min(...seed.skills.map((s) => s.position!))).toBe(8);
  expect(Math.min(...seed.projects.map((p) => p.position!))).toBe(4);
});

test("rich text is valid and derived text fields are filled", () => {
  const seed = buildPublic(OWNER, TODAY, emptyPublicContext(), publicUrl);
  for (const d of [...seed.projects, ...seed.articles]) {
    expect(validateDoc(d.content)).toBeNull();
    expect((d.plainText as string).length).toBeGreaterThan(50);
  }
  for (const a of seed.articles) expect(a.wordCount).toBeGreaterThan(10);
});

test("covers and gallery point at seeded media with demo storage keys", () => {
  const seed = buildPublic(OWNER, TODAY, emptyPublicContext(), publicUrl);
  const ids = new Set(seed.media.map((m) => m.row.id));
  for (const p of seed.projects) expect(ids.has(p.coverMediaId!)).toBe(true);
  for (const g of seed.projectMedia) expect(ids.has(g.mediaId)).toBe(true);
  expect(seed.projectMedia).toHaveLength(2);
  expect(seed.media.every((m) => m.row.storageKey.startsWith("de5eed00/") && m.row.bucket === "public-media" && m.row.status === "ready")).toBe(true);
  for (const a of seed.articles.filter((x) => x.status === "published")) {
    expect(a.coverUrl).toMatch(/^https:\/\/cdn\.test\/public-media\/de5eed00\//);
  }
});

test("a taken slug skips that project or article together with everything that hangs off it", () => {
  const all = buildPublic(OWNER, TODAY, emptyPublicContext(), publicUrl);
  const featured = all.projects.find((p) => p.featured)!;
  const article = all.articles[0];
  const ctx = { ...emptyPublicContext(), projectSlugs: new Set([featured.slug]), articleSlugs: new Set([article.slug]) };
  const seed = buildPublic(OWNER, TODAY, ctx, publicUrl);

  expect(seed.projects.map((p) => p.slug)).not.toContain(featured.slug);
  expect(seed.projectLinks.some((l) => l.projectId === featured.id)).toBe(false);
  expect(seed.projectMedia).toHaveLength(0);
  expect(seed.media.some((m) => m.row.id === featured.coverMediaId)).toBe(false);
  expect(seed.articles.map((a) => a.slug)).not.toContain(article.slug);
  expect(seed.articleTags.some((t) => t.articleId === article.id)).toBe(false);
});

test("ids do not shift when an earlier item is skipped", () => {
  const all = buildPublic(OWNER, TODAY, emptyPublicContext(), publicUrl);
  const first = all.projects[0];
  const seed = buildPublic(OWNER, TODAY, { ...emptyPublicContext(), projectSlugs: new Set([first.slug]) }, publicUrl);
  const before = new Map(all.media.map((m) => [m.row.originalName, m.row.id]));
  for (const m of seed.media) expect(m.row.id).toBe(before.get(m.row.originalName));
  const beforeLinks = new Map(all.projectLinks.map((l) => [l.url, l.id]));
  for (const l of seed.projectLinks) expect(l.id).toBe(beforeLinks.get(l.url));
});

test("an existing tag is reused, not duplicated", () => {
  const all = buildPublic(OWNER, TODAY, emptyPublicContext(), publicUrl);
  const name = all.tags[0].name.toLowerCase();
  const seed = buildPublic(OWNER, TODAY, { ...emptyPublicContext(), tagIds: new Map([[name, "real-tag"]]) }, publicUrl);
  expect(seed.tags.map((t) => t.name.toLowerCase())).not.toContain(name);
  expect(seed.articleTags.some((t) => t.tagId === "real-tag")).toBe(true);
});
