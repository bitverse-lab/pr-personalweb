import { eq, getTableColumns, getTableName, inArray, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  applicationContacts,
  applicationDocuments,
  applications,
  applicationStatusHistory,
  applicationTimelineEvents,
  articles,
  articleTags,
  bodyMeasurements,
  calendarEvents,
  companies,
  educations,
  exercises,
  experiences,
  foods,
  healthProfiles,
  interviews,
  journalEntries,
  mealItems,
  meals,
  media,
  profiles,
  projectLinks,
  projectMedia,
  projects,
  routineExercises,
  routines,
  skills,
  socialLinks,
  subtasks,
  tags,
  tasks,
  testimonials,
  contactMessages,
  waterEntries,
  weightEntries,
  workoutSets,
  workouts,
} from "@/db/schema";

// Every table that belongs to the owner and carries a user_id column. Login tables (accounts, sessions,
// verification tokens) are deliberately NOT here: they hold OAuth tokens and must never leave the database.
const OWNED: Record<string, PgTable> = {
  profile: profiles,
  socialLinks,
  experiences,
  educations,
  skills,
  tasks,
  subtasks,
  calendarEvents,
  companies,
  applications,
  applicationStatusHistory,
  applicationTimelineEvents,
  applicationContacts,
  interviews,
  applicationDocuments,
  healthProfile: healthProfiles,
  weightEntries,
  bodyMeasurements,
  foods,
  meals,
  mealItems,
  waterEntries,
  exercises,
  routines,
  routineExercises,
  workouts,
  workoutSets,
  articles,
  tags,
  journalEntries,
  projects,
  projectLinks,
  projectMedia,
  media,
  testimonials,
  contactMessages,
};

// Domain groups for the summary shown on the Data page.
export const DATA_GROUPS: { label: string; tables: string[] }[] = [
  { label: "Profile & CV", tables: ["profile", "socialLinks", "experiences", "educations", "skills"] },
  { label: "Projects", tables: ["projects", "projectLinks", "projectMedia"] },
  { label: "Articles", tables: ["articles", "tags"] },
  { label: "Testimonials & messages", tables: ["testimonials", "contactMessages"] },
  { label: "Journal", tables: ["journalEntries"] },
  { label: "Tasks & calendar", tables: ["tasks", "subtasks", "calendarEvents"] },
  { label: "Career", tables: ["companies", "applications", "applicationStatusHistory", "applicationTimelineEvents", "applicationContacts", "interviews", "applicationDocuments"] },
  { label: "Health", tables: ["healthProfile", "weightEntries", "bodyMeasurements", "foods", "meals", "mealItems", "waterEntries", "exercises", "routines", "routineExercises", "workouts", "workoutSets"] },
  { label: "Files (metadata)", tables: ["media"] },
];

// Storage keys reveal where files live; the export lists the files but not their internal paths.
const OMIT_COLUMNS: Record<string, string[]> = { media: ["storageKey"] };

function userIdColumn(table: PgTable) {
  const cols = getTableColumns(table) as Record<string, unknown>;
  return cols.userId as Parameters<typeof eq>[0];
}

export const exportService = {
  async build(userId: string) {
    const data: Record<string, unknown[]> = {};

    for (const [key, table] of Object.entries(OWNED)) {
      const rows = (await db.select().from(table).where(eq(userIdColumn(table), userId))) as Record<string, unknown>[];
      const omit = OMIT_COLUMNS[key] ?? [];
      data[key] = omit.length ? rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !omit.includes(k)))) : rows;
    }

    // article_tag has no user_id of its own: scope it through the user's articles.
    const articleIds = (data.articles as { id: string }[]).map((a) => a.id);
    data.articleTags = articleIds.length ? await db.select().from(articleTags).where(inArray(articleTags.articleId, articleIds)) : [];

    const counts = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length]));
    return {
      meta: {
        app: "Personal OS",
        format: "personal-os-export",
        version: 1,
        exportedAt: new Date().toISOString(),
        note: "Your own data only. Uploaded files are not included, only their metadata. Login tokens are never exported.",
      },
      counts,
      data,
    };
  },

  // Cheap per-table row counts for the Data page.
  async counts(userId: string) {
    const entries = await Promise.all(
      Object.entries(OWNED).map(async ([key, table]) => {
        const rows = await db.select({ n: sql<number>`count(*)::int` }).from(table).where(eq(userIdColumn(table), userId));
        return [key, rows[0]?.n ?? 0] as const;
      })
    );
    return Object.fromEntries(entries) as Record<string, number>;
  },

  tableNames: () => Object.values(OWNED).map((t) => getTableName(t)),
};
