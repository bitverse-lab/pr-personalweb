import type { PrivateSeed } from "./data/private";
import type { PublicSeed } from "./data/public";

/** Parents before children. Clean deletes in the reverse order. */
export const INSERT_ORDER = [
  "media",
  "experience",
  "education",
  "skill",
  "social_link",
  "project",
  "project_link",
  "project_media",
  "tag",
  "article",
  "article_tag",
  "testimonial",
  "contact_message",
  "task",
  "subtask",
  "calendar_event",
  "company",
  "application",
  "application_status_history",
  "application_contact",
  "application_timeline_event",
  "interview",
  "journal_entry",
  "health_profile",
  "weight_entry",
  "body_measurement",
  "food",
  "meal",
  "meal_item",
  "water_entry",
  "exercise",
  "routine",
  "routine_exercise",
  "workout",
  "workout_set",
] as const;

export type SeedTable = (typeof INSERT_ORDER)[number];
export type SeedTables = Partial<Record<SeedTable, object[]>>;

/** Flattens both builders into rows keyed by SQL table name; media get their real uploaded size. */
export function toTables(pub: PublicSeed, priv: PrivateSeed, sizes: Map<string, number> = new Map()): Record<SeedTable, object[]> {
  return {
    media: pub.media.map((m) => ({ ...m.row, sizeBytes: sizes.get(m.row.id) ?? m.row.sizeBytes })),
    experience: pub.experiences,
    education: pub.educations,
    skill: pub.skills,
    social_link: pub.socialLinks,
    project: pub.projects,
    project_link: pub.projectLinks,
    project_media: pub.projectMedia,
    tag: pub.tags,
    article: pub.articles,
    article_tag: pub.articleTags,
    testimonial: pub.testimonials,
    contact_message: pub.contactMessages,
    task: priv.tasks,
    subtask: priv.subtasks,
    calendar_event: priv.calendarEvents,
    company: priv.companies,
    application: priv.applications,
    application_status_history: priv.applicationStatusHistory,
    application_contact: priv.applicationContacts,
    application_timeline_event: priv.applicationTimelineEvents,
    interview: priv.interviews,
    journal_entry: priv.journalEntries,
    health_profile: priv.healthProfiles,
    weight_entry: priv.weightEntries,
    body_measurement: priv.bodyMeasurements,
    food: priv.foods,
    meal: priv.meals,
    meal_item: priv.mealItems,
    water_entry: priv.waterEntries,
    exercise: priv.exercises,
    routine: priv.routines,
    routine_exercise: priv.routineExercises,
    workout: priv.workouts,
    workout_set: priv.workoutSets,
  };
}

/** Rows still to insert, in FK-safe order. Rows whose id already exists are dropped, so a re-run is a no-op. */
export function planInserts(all: SeedTables, existingIds: Set<string>): { table: SeedTable; rows: object[] }[] {
  return INSERT_ORDER.flatMap((table) => {
    const rows = (all[table] ?? []).filter((r) =>
      "id" in r ? !existingIds.has((r as { id: string }).id) : !existingIds.has((r as { articleId?: string }).articleId ?? ""),
    );
    return rows.length ? [{ table, rows }] : [];
  });
}

/** Storage not configured: no uploads possible, so drop demo images and every reference to them. */
export function withoutMedia(pub: PublicSeed): PublicSeed {
  return {
    ...pub,
    media: [],
    projectMedia: [],
    projects: pub.projects.map((p) => ({ ...p, coverMediaId: null })),
    articles: pub.articles.map((a) => ({ ...a, coverUrl: null })),
  };
}
