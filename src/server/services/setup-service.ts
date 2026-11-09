import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, educations, experiences, healthProfiles, profiles, projects, tasks, weightEntries } from "@/db/schema";
import { DEMO_PREFIX } from "@/lib/demo";
import { isStorageConfigured } from "@/server/storage/client";

export interface SetupItem {
  key: string;
  label: string;
  hint: string;
  href: string;
  done: boolean;
}

const count = (rows: { n: number }[]) => rows[0]?.n ?? 0;

/** The owner's rows created by `pnpm db:seed` (demo-prefixed ids). */
export function demoRowsOf(table: typeof projects | typeof articles | typeof tasks, userId: string) {
  return and(eq(table.userId, userId), sql`${table.id}::text like ${`${DEMO_PREFIX}%`}`)!;
}

// Onboarding checklist for the Overview: what still needs doing before the site and workspace are fully useful.
export const setupService = {
  /** Demo data is loaded if any of these always-seeded tables holds a demo row. */
  async hasDemoData(userId: string): Promise<boolean> {
    const found = await Promise.all(
      [projects, articles, tasks].map((t) => db.select({ one: sql<number>`1` }).from(t).where(demoRowsOf(t, userId)).limit(1)),
    );
    return found.some((r) => r.length > 0);
  },

  async checklist(userId: string): Promise<SetupItem[]> {
    const [profile, exp, edu, healthGoals, weight, publishedProjects, publishedArticles] = await Promise.all([
      db.query.profiles.findFirst({ where: eq(profiles.userId, userId) }),
      db.select({ n: sql<number>`count(*)::int` }).from(experiences).where(eq(experiences.userId, userId)),
      db.select({ n: sql<number>`count(*)::int` }).from(educations).where(eq(educations.userId, userId)),
      db.query.healthProfiles.findFirst({ where: eq(healthProfiles.userId, userId) }),
      db.select({ n: sql<number>`count(*)::int` }).from(weightEntries).where(eq(weightEntries.userId, userId)),
      db.select({ n: sql<number>`count(*)::int` }).from(projects).where(and(eq(projects.userId, userId), eq(projects.status, "published"))),
      db.select({ n: sql<number>`count(*)::int` }).from(articles).where(and(eq(articles.userId, userId), eq(articles.status, "published"))),
    ]);

    return [
      { key: "name", label: "Add your name and headline", hint: "Replaces the template's sample content on every public page.", href: "/me/settings/profile", done: !!profile?.displayName?.trim() },
      { key: "photo", label: "Upload a profile photo", hint: "Shown in your home-page hero; the About photo can be customized separately.", href: "/me/settings/profile", done: !!profile?.photoMediaId },
      { key: "cv", label: "Add work experience or education", hint: "This is what your CV page and PDF are built from.", href: "/me/settings/profile", done: count(exp) + count(edu) > 0 },
      { key: "contact", label: "Add your public email and links", hint: "Shown on your Contact page, navbar and footer so people can reach you.", href: "/me/settings/profile", done: !!profile?.publicEmail },
      { key: "storage", label: "Connect file storage", hint: "Needed for photos, project images and application documents.", href: "/me/media", done: isStorageConfigured() },
      { key: "project", label: "Publish your first project", hint: "Your portfolio is the core of the public site.", href: "/me/projects", done: count(publishedProjects) > 0 },
      { key: "article", label: "Publish your first article", hint: "Optional, but great for showing how you think.", href: "/me/articles", done: count(publishedArticles) > 0 },
      { key: "goals", label: "Set your health goals", hint: "Unlocks calorie targets and progress on the Health pages.", href: "/me/health/goals", done: !!healthGoals && (healthGoals.dailyCalories !== null || healthGoals.targetWeightKg !== null) },
      { key: "weight", label: "Log your first weight", hint: "Weekly and monthly averages appear automatically.", href: "/me/health/weight", done: count(weight) > 0 },
    ];
  },
};
