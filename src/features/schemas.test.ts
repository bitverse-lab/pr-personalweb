import { describe, expect, it } from "vitest";
import { logWeightSchema, saveProfileSchema, foodSchema, saveRoutineSchema, updateSetSchema } from "./health/schema";
import { saveArticleSchema, saveJournalSchema, tagListSchema } from "./content/schema";
import { basicsSchema, experienceSchema, educationSchema, linkSchema, skillSchema } from "./profile/schema";

const uuid = "123e4567-e89b-42d3-a456-426614174000";
const emptyDoc = { type: "doc", content: [] };

describe("health input validation", () => {
  it("bounds weight and requires a real date", () => {
    expect(logWeightSchema.safeParse({ date: "2026-09-19", weightKg: "72.5" }).success).toBe(true);
    expect(logWeightSchema.safeParse({ date: "2026-09-19", weightKg: 5 }).success).toBe(false);
    expect(logWeightSchema.safeParse({ date: "2026-09-19", weightKg: 900 }).success).toBe(false);
    expect(logWeightSchema.safeParse({ date: "19/09/2026", weightKg: 70 }).success).toBe(false);
    expect(logWeightSchema.safeParse({ date: "2026-02-31", weightKg: 70 }).success).toBe(false);
  });

  it("treats blank optional numbers as absent", () => {
    const r = logWeightSchema.safeParse({ date: "2026-09-19", weightKg: 70, bodyFatPct: "" });
    expect(r.success && r.data.bodyFatPct).toBeUndefined();
  });

  it("validates profile goals and foods", () => {
    expect(saveProfileSchema.safeParse({ activityLevel: "moderate", goalType: "lose", dailyCalories: "2000" }).success).toBe(true);
    expect(saveProfileSchema.safeParse({ activityLevel: "moderate", goalType: "lose", dailyCalories: 50 }).success).toBe(false);
    expect(saveProfileSchema.safeParse({ activityLevel: "couch", goalType: "lose" }).success).toBe(false);
    expect(foodSchema.safeParse({ name: "Rice", servingSize: 100, servingUnit: "g", calories: 130 }).success).toBe(true);
    expect(foodSchema.safeParse({ name: "", servingSize: 100, servingUnit: "g", calories: 130 }).success).toBe(false);
    expect(foodSchema.safeParse({ name: "X", servingSize: 0, servingUnit: "g", calories: 1 }).success).toBe(false);
    expect(foodSchema.safeParse({ name: "X", servingSize: 1, servingUnit: "barrel", calories: 1 }).success).toBe(false);
  });

  it("validates workout sets and routines", () => {
    expect(updateSetSchema.safeParse({ id: uuid, reps: 8, weightKg: 60, done: true }).success).toBe(true);
    expect(updateSetSchema.safeParse({ id: uuid, reps: -1 }).success).toBe(false);
    expect(updateSetSchema.safeParse({ id: "nope", reps: 5 }).success).toBe(false);
    expect(saveRoutineSchema.safeParse({ name: "Push", exercises: [{ exerciseId: uuid, targetSets: 3, targetReps: 10 }] }).success).toBe(true);
    expect(saveRoutineSchema.safeParse({ name: "Push", exercises: [] }).success).toBe(false);
  });
});

describe("content validation", () => {
  it("dedupes tags case-insensitively and caps their number", () => {
    expect(tagListSchema.parse(["Tech", "tech", " Life "])).toEqual(["Tech", "Life"]);
    expect(tagListSchema.safeParse(Array.from({ length: 11 }, (_, i) => `t${i}`)).success).toBe(false);
  });

  it("rejects unsafe article content and cover URLs", () => {
    const base = { id: uuid, title: "T", slug: "t", tags: [], content: emptyDoc };
    expect(saveArticleSchema.safeParse(base).success).toBe(true);
    expect(saveArticleSchema.safeParse({ ...base, coverUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(saveArticleSchema.safeParse({ ...base, coverUrl: "https://cdn.example.com/a.jpg" }).success).toBe(true);
    const evil = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:1" } }] }] }] };
    expect(saveArticleSchema.safeParse({ ...base, content: evil }).success).toBe(false);
  });

  it("limits journal moods to 1–5", () => {
    const base = { id: uuid, content: emptyDoc, tags: [] };
    expect(saveJournalSchema.safeParse({ ...base, mood: 3 }).success).toBe(true);
    expect(saveJournalSchema.safeParse({ ...base, mood: null }).success).toBe(true);
    expect(saveJournalSchema.safeParse({ ...base, mood: 6 }).success).toBe(false);
    expect(saveJournalSchema.safeParse({ ...base, mood: 2.5 }).success).toBe(false);
  });
});

describe("profile validation", () => {
  it("requires a name and rejects script URLs", () => {
    expect(basicsSchema.safeParse({ displayName: "Ada" }).success).toBe(true);
    expect(basicsSchema.safeParse({ displayName: " " }).success).toBe(false);
    expect(basicsSchema.safeParse({ displayName: "Ada", website: "javascript:alert(1)" }).success).toBe(false);
    expect(basicsSchema.safeParse({ displayName: "Ada", publicEmail: "not-an-email" }).success).toBe(false);
    expect(basicsSchema.safeParse({ displayName: "Ada", website: "" }).success).toBe(true); // blank clears it
  });

  it("keeps date ranges in order and allows a current role", () => {
    const base = { company: "A", role: "B", startDate: "2022-01-01" };
    expect(experienceSchema.safeParse({ ...base, endDate: null }).success).toBe(true);
    expect(experienceSchema.safeParse({ ...base, endDate: "2021-01-01" }).success).toBe(false);
    expect(educationSchema.safeParse({ school: "U", startDate: "2020-01-01", endDate: "2019-01-01" }).success).toBe(false);
  });

  it("validates links and skills", () => {
    expect(linkSchema.safeParse({ label: "GitHub", url: "https://github.com/x" }).success).toBe(true);
    expect(linkSchema.safeParse({ label: "x", url: "javascript:1" }).success).toBe(false);
    expect(skillSchema.safeParse({ name: "TS", level: 90 }).success).toBe(true);
    expect(skillSchema.safeParse({ name: "TS", level: 101 }).success).toBe(false);
  });
});
