import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { media, projectLinks, projectMedia, projects } from "@/db/schema";
import type { RichDoc } from "@/db/schema/content";
import type { ProjectStatus } from "@/db/schema/projects";

export type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ProjectValues {
  title: string;
  slug: string;
  summary: string | null;
  category: string | null;
  client: string | null;
  role: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  technologies: string[];
  content: RichDoc;
  plainText: string;
  coverMediaId: string | null;
}

export const projectRepository = {
  list(userId: string, opts: { status?: ProjectStatus; q?: string } = {}) {
    const q = opts.q?.trim().replace(/[%_]/g, "");
    return db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.userId, userId),
          opts.status ? eq(projects.status, opts.status) : undefined,
          q ? or(ilike(projects.title, `%${q}%`), ilike(projects.plainText, `%${q}%`), ilike(projects.category, `%${q}%`)) : undefined
        )
      )
      .orderBy(asc(projects.position), desc(projects.updatedAt));
  },

  statusCounts(userId: string) {
    return db
      .select({ status: projects.status, count: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.userId, userId))
      .groupBy(projects.status);
  },

  findById(userId: string, id: string, ex: DbExecutor = db) {
    return ex.query.projects.findFirst({ where: and(eq(projects.id, id), eq(projects.userId, userId)) });
  },

  async slugTaken(userId: string, slug: string, excludeId?: string, ex: DbExecutor = db) {
    const rows = await ex
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.slug, slug), excludeId ? sql`${projects.id} <> ${excludeId}` : undefined))
      .limit(1);
    return rows.length > 0;
  },

  // New projects go to the top of the manual order.
  async insert(userId: string, values: ProjectValues & { status?: ProjectStatus; featured?: boolean; publishedAt?: Date | null }, ex: DbExecutor = db) {
    const min = await ex.select({ min: sql<number>`coalesce(min(${projects.position}), 0)::int` }).from(projects).where(eq(projects.userId, userId));
    return ex
      .insert(projects)
      .values({ userId, position: (min[0]?.min ?? 0) - 1, ...values })
      .returning()
      .then((r) => r[0]);
  },

  update(userId: string, id: string, values: Partial<ProjectValues> & { status?: ProjectStatus; featured?: boolean; publishedAt?: Date | null }, ex: DbExecutor = db) {
    return ex
      .update(projects)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  delete(userId: string, id: string) {
    return db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  async reorder(userId: string, ids: string[]) {
    await db.transaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx.update(projects).set({ position: i }).where(and(eq(projects.id, ids[i]), eq(projects.userId, userId)));
      }
    });
  },

  // ---- children ----
  linksFor(projectIds: string[], ex: DbExecutor = db) {
    if (projectIds.length === 0) return Promise.resolve([]);
    return ex.select().from(projectLinks).where(inArray(projectLinks.projectId, projectIds)).orderBy(asc(projectLinks.position));
  },

  galleryFor(projectIds: string[], ex: DbExecutor = db) {
    if (projectIds.length === 0) return Promise.resolve([]);
    return ex
      .select({ row: projectMedia, media })
      .from(projectMedia)
      .innerJoin(media, eq(media.id, projectMedia.mediaId))
      .where(and(inArray(projectMedia.projectId, projectIds), eq(media.status, "ready")))
      .orderBy(asc(projectMedia.position));
  },

  async replaceLinks(userId: string, projectId: string, links: { label: string; url: string }[], ex: DbExecutor = db) {
    await ex.delete(projectLinks).where(and(eq(projectLinks.projectId, projectId), eq(projectLinks.userId, userId)));
    if (links.length) await ex.insert(projectLinks).values(links.map((l, position) => ({ userId, projectId, position, ...l })));
  },

  async replaceGallery(userId: string, projectId: string, items: { mediaId: string; caption: string | null }[], ex: DbExecutor = db) {
    await ex.delete(projectMedia).where(and(eq(projectMedia.projectId, projectId), eq(projectMedia.userId, userId)));
    if (items.length) await ex.insert(projectMedia).values(items.map((m, position) => ({ userId, projectId, position, ...m })));
  },

  // The user's verified public images, used to validate cover/gallery ids in one query.
  async ownedPublicImages(userId: string, ids: string[], ex: DbExecutor = db) {
    if (ids.length === 0) return new Map<string, typeof media.$inferSelect>();
    const rows = await ex
      .select()
      .from(media)
      .where(and(eq(media.userId, userId), inArray(media.id, ids), eq(media.status, "ready"), eq(media.kind, "image"), eq(media.bucket, "public-media")));
    return new Map(rows.map((r) => [r.id, r]));
  },

  findMedia(ids: string[], ex: DbExecutor = db) {
    if (ids.length === 0) return Promise.resolve([]);
    return ex.select().from(media).where(inArray(media.id, ids));
  },

  // ---- public ----
  listPublished(ownerId: string) {
    return db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, ownerId), eq(projects.status, "published")))
      .orderBy(asc(projects.position), desc(projects.publishedAt));
  },

  findPublishedBySlug(ownerId: string, slug: string) {
    return db.query.projects.findFirst({ where: and(eq(projects.userId, ownerId), eq(projects.slug, slug), eq(projects.status, "published")) });
  },
};
