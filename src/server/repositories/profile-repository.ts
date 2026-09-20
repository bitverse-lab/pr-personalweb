import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { educations, experiences, media, profiles, skills, socialLinks } from "@/db/schema";

export interface BasicsValues {
  displayName: string | null;
  headline: string | null;
  summary: string | null;
  location: string | null;
  publicEmail: string | null;
  website: string | null;
  roles: string[];
  availableForWork: boolean;
  availabilityNote: string | null;
}

export interface ExperienceValues {
  company: string;
  role: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
  achievements: string[];
}

export interface EducationValues {
  school: string;
  degree: string | null;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface SkillValues {
  name: string;
  category: string | null;
  level: number;
}

export interface LinkValues {
  label: string;
  url: string;
}

async function nextPosition(table: typeof experiences | typeof educations | typeof skills | typeof socialLinks, userId: string) {
  const rows = await db.select({ max: sql<number>`coalesce(max(${table.position}), -1)::int` }).from(table).where(eq(table.userId, userId));
  return (rows[0]?.max ?? -1) + 1;
}

export const profileRepository = {
  async findFull(userId: string) {
    const [profile, exp, edu, sk, links] = await Promise.all([
      db.query.profiles.findFirst({ where: eq(profiles.userId, userId) }),
      db.select().from(experiences).where(eq(experiences.userId, userId)).orderBy(asc(experiences.position)),
      db.select().from(educations).where(eq(educations.userId, userId)).orderBy(asc(educations.position)),
      db.select().from(skills).where(eq(skills.userId, userId)).orderBy(asc(skills.position)),
      db.select().from(socialLinks).where(eq(socialLinks.userId, userId)).orderBy(asc(socialLinks.position)),
    ]);
    const photo = profile?.photoMediaId
      ? await db.query.media.findFirst({ where: and(eq(media.id, profile.photoMediaId), eq(media.userId, userId), eq(media.status, "ready")) })
      : null;
    return { profile: profile ?? null, experiences: exp, educations: edu, skills: sk, links, photo: photo ?? null };
  },

  upsertBasics(userId: string, v: BasicsValues) {
    return db
      .insert(profiles)
      .values({ userId, ...v })
      .onConflictDoUpdate({ target: profiles.userId, set: { ...v, updatedAt: new Date() } })
      .returning()
      .then((r) => r[0]);
  },

  setPhoto(userId: string, mediaId: string | null) {
    return db
      .insert(profiles)
      .values({ userId, photoMediaId: mediaId })
      .onConflictDoUpdate({ target: profiles.userId, set: { photoMediaId: mediaId, updatedAt: new Date() } })
      .returning()
      .then((r) => r[0]);
  },

  // ---- experiences ----
  async createExperience(userId: string, v: ExperienceValues) {
    const position = await nextPosition(experiences, userId);
    return db.insert(experiences).values({ userId, position, ...v }).returning().then((r) => r[0]);
  },
  updateExperience(userId: string, id: string, v: ExperienceValues) {
    return db.update(experiences).set(v).where(and(eq(experiences.id, id), eq(experiences.userId, userId))).returning().then((r) => r[0] ?? null);
  },
  deleteExperience(userId: string, id: string) {
    return db.delete(experiences).where(and(eq(experiences.id, id), eq(experiences.userId, userId))).returning().then((r) => r[0] ?? null);
  },

  // ---- educations ----
  async createEducation(userId: string, v: EducationValues) {
    const position = await nextPosition(educations, userId);
    return db.insert(educations).values({ userId, position, ...v }).returning().then((r) => r[0]);
  },
  updateEducation(userId: string, id: string, v: EducationValues) {
    return db.update(educations).set(v).where(and(eq(educations.id, id), eq(educations.userId, userId))).returning().then((r) => r[0] ?? null);
  },
  deleteEducation(userId: string, id: string) {
    return db.delete(educations).where(and(eq(educations.id, id), eq(educations.userId, userId))).returning().then((r) => r[0] ?? null);
  },

  // ---- skills ----
  async createSkill(userId: string, v: SkillValues) {
    const position = await nextPosition(skills, userId);
    return db.insert(skills).values({ userId, position, ...v }).returning().then((r) => r[0]);
  },
  updateSkill(userId: string, id: string, v: SkillValues) {
    return db.update(skills).set(v).where(and(eq(skills.id, id), eq(skills.userId, userId))).returning().then((r) => r[0] ?? null);
  },
  deleteSkill(userId: string, id: string) {
    return db.delete(skills).where(and(eq(skills.id, id), eq(skills.userId, userId))).returning().then((r) => r[0] ?? null);
  },

  // ---- links ----
  async createLink(userId: string, v: LinkValues) {
    const position = await nextPosition(socialLinks, userId);
    return db.insert(socialLinks).values({ userId, position, ...v }).returning().then((r) => r[0]);
  },
  updateLink(userId: string, id: string, v: LinkValues) {
    return db.update(socialLinks).set(v).where(and(eq(socialLinks.id, id), eq(socialLinks.userId, userId))).returning().then((r) => r[0] ?? null);
  },
  deleteLink(userId: string, id: string) {
    return db.delete(socialLinks).where(and(eq(socialLinks.id, id), eq(socialLinks.userId, userId))).returning().then((r) => r[0] ?? null);
  },

  // Applies the given order (ids not owned by the user are ignored by the WHERE clause).
  async reorder(kind: "experiences" | "educations" | "skills" | "links", userId: string, ids: string[]) {
    const table = { experiences, educations, skills, links: socialLinks }[kind];
    await db.transaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx.update(table).set({ position: i }).where(and(eq(table.id, ids[i]), eq(table.userId, userId), inArray(table.id, ids)));
      }
    });
  },
};
