import { and, desc, eq, ilike, inArray, isNull, ne, notExists, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, articleTags, tags, users } from "@/db/schema";
import type { ArticleStatus, RichDoc } from "@/db/schema/content";

export type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

const listColumns = {
  id: articles.id,
  title: articles.title,
  slug: articles.slug,
  excerpt: articles.excerpt,
  coverUrl: articles.coverUrl,
  status: articles.status,
  wordCount: articles.wordCount,
  publishedAt: articles.publishedAt,
  createdAt: articles.createdAt,
  updatedAt: articles.updatedAt,
};

export interface ArticleValues {
  title: string;
  slug: string;
  excerpt: string | null;
  content: RichDoc;
  plainText: string;
  wordCount: number;
  coverUrl: string | null;
  status: ArticleStatus;
  publishedAt: Date | null;
}

export const articleRepository = {
  async tagsFor(articleIds: string[], ex: DbExecutor = db) {
    if (articleIds.length === 0) return new Map<string, string[]>();
    const rows = await ex
      .select({ articleId: articleTags.articleId, name: tags.name })
      .from(articleTags)
      .innerJoin(tags, eq(tags.id, articleTags.tagId))
      .where(inArray(articleTags.articleId, articleIds));
    const map = new Map<string, string[]>();
    for (const r of rows) map.set(r.articleId, [...(map.get(r.articleId) ?? []), r.name]);
    map.forEach((list) => list.sort((a: string, b: string) => a.localeCompare(b)));
    return map;
  },

  list(userId: string, opts: { status?: ArticleStatus; q?: string } = {}) {
    const q = opts.q?.trim().replace(/[%_]/g, "");
    return db
      .select(listColumns)
      .from(articles)
      .where(
        and(
          eq(articles.userId, userId),
          opts.status ? eq(articles.status, opts.status) : undefined,
          q ? or(ilike(articles.title, `%${q}%`), ilike(articles.plainText, `%${q}%`)) : undefined
        )
      )
      .orderBy(desc(articles.updatedAt));
  },

  statusCounts(userId: string) {
    return db
      .select({ status: articles.status, count: sql<number>`count(*)::int` })
      .from(articles)
      .where(eq(articles.userId, userId))
      .groupBy(articles.status);
  },

  findById(userId: string, id: string, ex: DbExecutor = db) {
    return ex.query.articles.findFirst({ where: and(eq(articles.id, id), eq(articles.userId, userId)) });
  },

  async slugTaken(userId: string, slug: string, excludeId?: string, ex: DbExecutor = db) {
    const row = await ex.query.articles.findFirst({
      where: and(eq(articles.userId, userId), eq(articles.slug, slug), excludeId ? ne(articles.id, excludeId) : undefined),
      columns: { id: true },
    });
    return !!row;
  },

  insert(userId: string, values: ArticleValues, ex: DbExecutor = db) {
    return ex
      .insert(articles)
      .values({ userId, ...values })
      .returning()
      .then((r) => r[0]);
  },

  update(userId: string, id: string, values: Partial<ArticleValues>, ex: DbExecutor = db) {
    return ex
      .update(articles)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(articles.id, id), eq(articles.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  /**
   * Drafts with nothing in them at all (no title, text, excerpt, cover or tags), untouched for ten
   * minutes, so one just opened in another tab is never pulled away.
   */
  deleteEmptyDrafts(userId: string) {
    return db
      .delete(articles)
      .where(
        and(
          eq(articles.userId, userId),
          eq(articles.status, "draft"),
          eq(articles.title, ""),
          eq(articles.wordCount, 0),
          isNull(articles.excerpt),
          isNull(articles.coverUrl),
          sql`${articles.updatedAt} < now() - interval '10 minutes'`,
          notExists(db.select({ one: sql`1` }).from(articleTags).where(eq(articleTags.articleId, articles.id)))
        )
      );
  },

  delete(userId: string, id: string) {
    return db
      .delete(articles)
      .where(and(eq(articles.id, id), eq(articles.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  // Replaces the article's tags, creating missing tags (case-insensitive) in the same transaction.
  async setTags(userId: string, articleId: string, names: string[], ex: DbExecutor = db) {
    await ex.delete(articleTags).where(eq(articleTags.articleId, articleId));
    if (names.length === 0) return;
    await ex
      .insert(tags)
      .values(names.map((name) => ({ userId, name })))
      .onConflictDoNothing();
    const rows = await ex
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.userId, userId), inArray(sql`lower(${tags.name})`, names.map((n) => n.toLowerCase()))));
    if (rows.length > 0) await ex.insert(articleTags).values(rows.map((r) => ({ articleId, tagId: r.id }))).onConflictDoNothing();
  },

  listTagNames(userId: string) {
    return db
      .select({ name: tags.name, count: sql<number>`count(${articleTags.articleId})::int` })
      .from(tags)
      .leftJoin(articleTags, eq(articleTags.tagId, tags.id))
      .where(eq(tags.userId, userId))
      .groupBy(tags.id)
      .orderBy(tags.name);
  },

  // ---- public (published only, owner scoped) ----
  async owner(): Promise<{ id: string; name: string | null } | null> {
    const email = process.env.OWNER_EMAIL;
    if (!email) return null;
    const row = await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true, name: true } });
    return row ? { id: row.id, name: row.name } : null;
  },

  async ownerId(): Promise<string | null> {
    return (await this.owner())?.id ?? null;
  },

  listPublished(ownerId: string, limit = 50) {
    return db
      .select(listColumns)
      .from(articles)
      .where(and(eq(articles.userId, ownerId), eq(articles.status, "published")))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);
  },

  findPublishedBySlug(ownerId: string, slug: string) {
    return db.query.articles.findFirst({
      where: and(eq(articles.userId, ownerId), eq(articles.slug, slug), eq(articles.status, "published")),
    });
  },
};
