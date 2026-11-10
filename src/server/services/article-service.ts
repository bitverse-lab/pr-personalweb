import { db } from "@/db";
import { articleRepository, type ArticleValues } from "@/server/repositories/article-repository";
import { EMPTY_DOC, countWords, docToPlainText, slugify, validateDoc } from "@/features/content/richtext";
import type { ArticleStatus, RichDoc } from "@/db/schema/content";

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverUrl: string | null;
  status: ArticleStatus;
  wordCount: number;
  publishedAt: string | null;
  updatedAt: string;
  tags: string[];
}

export interface ArticleDetail extends ArticleListItem {
  content: RichDoc;
}

export interface ArticleSaveInput {
  title: string;
  slug: string;
  slugAuto?: boolean;
  excerpt?: string | null;
  content: RichDoc;
  coverUrl?: string | null;
  tags: string[];
}

type Row = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverUrl: string | null;
  status: ArticleStatus;
  wordCount: number;
  publishedAt: Date | null;
  updatedAt: Date;
};

const toItem = (r: Row, tags: string[]): ArticleListItem => ({
  id: r.id,
  title: r.title,
  slug: r.slug,
  excerpt: r.excerpt,
  coverUrl: r.coverUrl,
  status: r.status,
  wordCount: r.wordCount,
  publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
  updatedAt: r.updatedAt.toISOString(),
  tags,
});

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function uniqueSlug(userId: string, base: string, excludeId?: string) {
  let candidate = base;
  for (let n = 2; await articleRepository.slugTaken(userId, candidate, excludeId); n++) candidate = `${base}-${n}`;
  return candidate;
}

export const articleService = {
  async list(userId: string, opts: { status?: ArticleStatus; q?: string } = {}) {
    const [rows, counts] = await Promise.all([articleRepository.list(userId, opts), articleRepository.statusCounts(userId)]);
    const tagMap = await articleRepository.tagsFor(rows.map((r) => r.id));
    return {
      items: rows.map((r) => toItem(r, tagMap.get(r.id) ?? [])),
      counts: Object.fromEntries(counts.map((c) => [c.status, c.count])) as Partial<Record<ArticleStatus, number>>,
    };
  },

  async detail(userId: string, id: string): Promise<ArticleDetail | null> {
    const row = await articleRepository.findById(userId, id);
    if (!row) return null;
    const tagMap = await articleRepository.tagsFor([id]);
    return { ...toItem(row, tagMap.get(id) ?? []), content: row.content };
  },

  async createDraft(userId: string) {
    // "New article" opened and then left behind used to pile up as empty "Untitled" drafts.
    await articleRepository.deleteEmptyDrafts(userId);
    const slug = await uniqueSlug(userId, `draft-${Math.random().toString(36).slice(2, 8)}`);
    return articleRepository.insert(userId, {
      title: "",
      slug,
      excerpt: null,
      content: EMPTY_DOC,
      plainText: "",
      wordCount: 0,
      coverUrl: null,
      status: "draft",
      publishedAt: null,
    });
  },

  /**
   * Saves everything the editor holds. A slug clash never blocks the rest of the save (that used to
   * stop the writing itself from saving): an automatic slug is numbered, a typed one is kept as it
   * was and reported back as `slugError`.
   */
  async save(
    userId: string,
    id: string,
    input: ArticleSaveInput
  ): Promise<ServiceResult<{ updatedAt: string; slug: string; slugError: string | null; wasLive: boolean; previousSlug: string }>> {
    const problem = validateDoc(input.content);
    if (problem) return { ok: false, error: problem };
    const current = await articleRepository.findById(userId, id);
    if (!current) return { ok: false, error: "Article not found" };
    let slug = slugify(input.slug);
    let slugError: string | null = null;
    if (await articleRepository.slugTaken(userId, slug, id)) {
      if (input.slugAuto) slug = await uniqueSlug(userId, slug, id);
      else {
        slugError = `"${slug}" is already used by another article`;
        slug = current.slug;
      }
    }
    const plainText = docToPlainText(input.content);

    const row = await db.transaction(async (tx) => {
      const updated = await articleRepository.update(
        userId,
        id,
        {
          title: input.title.trim(),
          slug,
          excerpt: input.excerpt?.trim() || null,
          content: input.content,
          plainText,
          wordCount: countWords(plainText),
          coverUrl: input.coverUrl || null,
        },
        tx
      );
      if (updated) await articleRepository.setTags(userId, id, input.tags, tx);
      return updated;
    });
    if (!row) return { ok: false, error: "Article not found" };
    return {
      ok: true,
      data: { updatedAt: row.updatedAt.toISOString(), slug: row.slug, slugError, wasLive: current.status === "published", previousSlug: current.slug },
    };
  },

  async setStatus(userId: string, id: string, status: ArticleStatus): Promise<ServiceResult<ArticleListItem>> {
    const current = await articleRepository.findById(userId, id);
    if (!current) return { ok: false, error: "Article not found" };
    if (status === "published") {
      if (!current.title.trim()) return { ok: false, error: "Give the article a title before publishing" };
      if (current.wordCount === 0) return { ok: false, error: "Write something before publishing" };
      if (current.slug.startsWith("draft-")) return { ok: false, error: "Set a URL slug before publishing" };
    }
    const row = await articleRepository.update(userId, id, {
      status,
      publishedAt: status === "published" ? (current.publishedAt ?? new Date()) : current.publishedAt,
    });
    if (!row) return { ok: false, error: "Article not found" };
    const tagMap = await articleRepository.tagsFor([id]);
    return { ok: true, data: toItem(row, tagMap.get(id) ?? []) };
  },

  // Everything needed to bring a deleted article back with Undo.
  async snapshot(userId: string, id: string) {
    const detail = await this.detail(userId, id);
    return detail;
  },

  async restore(userId: string, snap: ArticleDetail) {
    const problem = validateDoc(snap.content);
    if (problem) return null;
    const slug = await uniqueSlug(userId, slugify(snap.slug));
    const plainText = docToPlainText(snap.content);
    return db.transaction(async (tx) => {
      const values: ArticleValues = {
        title: snap.title,
        slug,
        excerpt: snap.excerpt,
        content: snap.content,
        plainText,
        wordCount: countWords(plainText),
        coverUrl: snap.coverUrl,
        status: snap.status,
        publishedAt: snap.publishedAt ? new Date(snap.publishedAt) : null,
      };
      const row = await articleRepository.insert(userId, values, tx);
      await articleRepository.setTags(userId, row.id, snap.tags, tx);
      return row;
    });
  },

  // ---- public ----
  async published(limit = 50) {
    const owner = await articleRepository.ownerId();
    if (!owner) return [];
    const rows = await articleRepository.listPublished(owner, limit);
    const tagMap = await articleRepository.tagsFor(rows.map((r) => r.id));
    return rows.map((r) => toItem(r, tagMap.get(r.id) ?? []));
  },

  async publishedBySlug(slug: string): Promise<ArticleDetail | null> {
    const owner = await articleRepository.ownerId();
    if (!owner) return null;
    const row = await articleRepository.findPublishedBySlug(owner, slug);
    if (!row) return null;
    const tagMap = await articleRepository.tagsFor([row.id]);
    return { ...toItem(row, tagMap.get(row.id) ?? []), content: row.content };
  },
};
