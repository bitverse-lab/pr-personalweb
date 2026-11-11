import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { applicationDocuments, articles, cvFiles, journalEntries, media, profiles, projectMedia, projects } from "@/db/schema";
import type { MediaBucket, MediaKind, MediaPurpose } from "@/db/schema/media";

export const mediaRepository = {
  insertPending(
    userId: string,
    v: { bucket: MediaBucket; storageKey: string; originalName: string; mimeType: string; sizeBytes: number; kind: MediaKind; purpose: MediaPurpose }
  ) {
    return db
      .insert(media)
      .values({ userId, ...v })
      .returning()
      .then((r) => r[0]);
  },

  find(userId: string, id: string) {
    return db.query.media.findFirst({ where: and(eq(media.id, id), eq(media.userId, userId)) });
  },

  markReady(userId: string, id: string, v: { mimeType: string; sizeBytes: number }) {
    return db
      .update(media)
      .set({ ...v, status: "ready" })
      .where(and(eq(media.id, id), eq(media.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  list(userId: string, kind?: MediaKind) {
    return db
      .select()
      .from(media)
      .where(and(eq(media.userId, userId), eq(media.status, "ready"), kind ? eq(media.kind, kind) : undefined))
      .orderBy(desc(media.createdAt));
  },

  usage(userId: string) {
    return db
      .select({ bytes: sql<number>`coalesce(sum(${media.sizeBytes}), 0)::bigint`, count: sql<number>`count(*)::int` })
      .from(media)
      .where(and(eq(media.userId, userId), eq(media.status, "ready")))
      .then((r) => ({ bytes: Number(r[0]?.bytes ?? 0), count: r[0]?.count ?? 0 }));
  },

  delete(userId: string, id: string) {
    return db
      .delete(media)
      .where(and(eq(media.id, id), eq(media.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  stalePending(olderThan: Date) {
    return db
      .select()
      .from(media)
      .where(and(eq(media.status, "pending"), lt(media.createdAt, olderThan)))
      .limit(50);
  },

  deleteById(id: string) {
    return db.delete(media).where(eq(media.id, id)).then(() => undefined);
  },

  // How many places still reference this file (article bodies, covers, journal bodies, profile photos, application documents).
  async references(userId: string, m: { id: string; storageKey: string }) {
    const needle = `%${m.storageKey}%`;
    const [a, c, j, p, d, pj, cv] = await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(articles).where(and(eq(articles.userId, userId), sql`${articles.content}::text like ${needle}`)),
      db.select({ n: sql<number>`count(*)::int` }).from(articles).where(and(eq(articles.userId, userId), sql`${articles.coverUrl} like ${needle}`)),
      db.select({ n: sql<number>`count(*)::int` }).from(journalEntries).where(and(eq(journalEntries.userId, userId), sql`${journalEntries.content}::text like ${needle}`)),
      db.select({ n: sql<number>`count(*)::int` }).from(profiles).where(and(eq(profiles.userId, userId), or(eq(profiles.photoMediaId, m.id), eq(profiles.aboutPhotoMediaId, m.id)))),
      db.select({ n: sql<number>`count(*)::int` }).from(applicationDocuments).where(and(eq(applicationDocuments.userId, userId), eq(applicationDocuments.mediaId, m.id))),
      db.select({ n: sql<number>`count(distinct ${projects.id})::int` }).from(projects).leftJoin(projectMedia, eq(projectMedia.projectId, projects.id)).where(and(eq(projects.userId, userId), or(eq(projects.coverMediaId, m.id), eq(projectMedia.mediaId, m.id), sql`${projects.content}::text like ${needle}`))),
      db.select({ n: sql<number>`count(*)::int` }).from(cvFiles).where(and(eq(cvFiles.userId, userId), eq(cvFiles.mediaId, m.id))),
    ]);
    return { articles: (a[0]?.n ?? 0) + (c[0]?.n ?? 0), journal: j[0]?.n ?? 0, profile: p[0]?.n ?? 0, applications: d[0]?.n ?? 0, projects: pj[0]?.n ?? 0, cv: cv[0]?.n ?? 0 };
  },
};
