import { db } from "@/db";
import { projectRepository, type ProjectValues } from "@/server/repositories/project-repository";
import { articleRepository } from "@/server/repositories/article-repository";
import { publicObjectUrl } from "@/server/storage/client";
import { EMPTY_DOC, docToPlainText, slugify, validateDoc } from "@/features/content/richtext";
import type { RichDoc } from "@/db/schema/content";
import type { ProjectStatus } from "@/db/schema/projects";
import type { ServiceResult } from "./article-service";

export interface GalleryItem {
  mediaId: string;
  url: string;
  caption: string | null;
}

export interface ProjectListItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  outcome: string | null;
  category: string | null;
  technologies: string[];
  status: ProjectStatus;
  featured: boolean;
  coverUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectListItem {
  client: string | null;
  role: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  content: RichDoc;
  coverMediaId: string | null;
  gallery: GalleryItem[];
  links: { label: string; url: string }[];
}

export interface ProjectSaveInput {
  title: string;
  slug: string;
  slugAuto?: boolean;
  summary?: string | null;
  outcome?: string | null;
  category?: string | null;
  client?: string | null;
  role?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  technologies: string[];
  content: RichDoc;
  coverMediaId?: string | null;
  gallery: { mediaId: string; caption?: string | null }[];
  links: { label: string; url: string }[];
}

type Row = Awaited<ReturnType<typeof projectRepository.findById>> & object;

const urlOf = (m: { bucket: "public-media" | "private-docs"; storageKey: string }) => publicObjectUrl(m.bucket, m.storageKey);

async function assemble(rows: Row[]): Promise<ProjectDetail[]> {
  const ids = rows.map((r) => r.id);
  const [links, gallery, covers] = await Promise.all([
    projectRepository.linksFor(ids),
    projectRepository.galleryFor(ids),
    projectRepository.findMedia(rows.map((r) => r.coverMediaId).filter((x): x is string => !!x)),
  ]);
  const coverById = new Map(covers.map((c) => [c.id, c]));

  return rows.map((r) => {
    const cover = r.coverMediaId ? coverById.get(r.coverMediaId) : undefined;
    const items: GalleryItem[] = gallery
      .filter((g) => g.row.projectId === r.id)
      .map((g) => ({ mediaId: g.media.id, url: urlOf(g.media) ?? "", caption: g.row.caption }))
      .filter((g) => g.url);
    const coverUrl = cover && cover.status === "ready" ? urlOf(cover) : (items[0]?.url ?? null);
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      summary: r.summary,
      outcome: r.outcome,
      category: r.category,
      technologies: r.technologies,
      status: r.status,
      featured: r.featured,
      coverUrl,
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
      updatedAt: r.updatedAt.toISOString(),
      client: r.client,
      role: r.role,
      location: r.location,
      startDate: r.startDate,
      endDate: r.endDate,
      content: r.content,
      coverMediaId: r.coverMediaId,
      gallery: items,
      links: links.filter((l) => l.projectId === r.id).map((l) => ({ label: l.label, url: l.url })),
    };
  });
}

// Lists never ship the (potentially large) case-study body to the client.
function toListItem(d: ProjectDetail): ProjectListItem {
  return {
    id: d.id,
    title: d.title,
    slug: d.slug,
    summary: d.summary,
    outcome: d.outcome,
    category: d.category,
    technologies: d.technologies,
    status: d.status,
    featured: d.featured,
    coverUrl: d.coverUrl,
    publishedAt: d.publishedAt,
    updatedAt: d.updatedAt,
  };
}

async function uniqueSlug(userId: string, base: string, excludeId?: string) {
  let candidate = base;
  for (let n = 2; await projectRepository.slugTaken(userId, candidate, excludeId); n++) candidate = `${base}-${n}`;
  return candidate;
}

function toValues(input: ProjectSaveInput, slug: string): ProjectValues {
  const plainText = docToPlainText(input.content);
  return {
    title: input.title.trim(),
    slug,
    summary: input.summary?.trim() || null,
    outcome: input.outcome?.trim() || null,
    category: input.category?.trim() || null,
    client: input.client?.trim() || null,
    role: input.role?.trim() || null,
    location: input.location?.trim() || null,
    startDate: input.startDate || null,
    endDate: input.startDate ? input.endDate || null : null,
    technologies: input.technologies,
    content: input.content,
    plainText,
    coverMediaId: input.coverMediaId ?? null,
  };
}

export const projectService = {
  async list(userId: string, opts: { status?: ProjectStatus; q?: string } = {}) {
    const [rows, counts] = await Promise.all([projectRepository.list(userId, opts), projectRepository.statusCounts(userId)]);
    const details = await assemble(rows);
    return {
      items: details.map(toListItem),
      counts: Object.fromEntries(counts.map((c) => [c.status, c.count])) as Partial<Record<ProjectStatus, number>>,
    };
  },

  async detail(userId: string, id: string): Promise<ProjectDetail | null> {
    const row = await projectRepository.findById(userId, id);
    return row ? (await assemble([row]))[0] : null;
  },

  async createDraft(userId: string) {
    // "New project" opened and then left behind used to pile up as empty "Untitled project" drafts.
    await projectRepository.deleteEmptyDrafts(userId);
    const slug = await uniqueSlug(userId, `draft-${Math.random().toString(36).slice(2, 8)}`);
    return projectRepository.insert(userId, {
      title: "",
      slug,
      summary: null,
      outcome: null,
      category: null,
      client: null,
      role: null,
      location: null,
      startDate: null,
      endDate: null,
      technologies: [],
      content: EMPTY_DOC,
      plainText: "",
      coverMediaId: null,
    });
  },

  /**
   * A slug clash never blocks the rest of the save: an automatic slug is numbered, a typed one is
   * kept as it was and reported back as `slugError` (same rule as articles).
   */
  async save(
    userId: string,
    id: string,
    input: ProjectSaveInput
  ): Promise<ServiceResult<{ updatedAt: string; slug: string; slugError: string | null; wasLive: boolean; previousSlug: string }>> {
    const problem = validateDoc(input.content);
    if (problem) return { ok: false, error: problem };
    const current = await projectRepository.findById(userId, id);
    if (!current) return { ok: false, error: "Project not found" };
    let slug = slugify(input.slug);
    let slugError: string | null = null;
    if (await projectRepository.slugTaken(userId, slug, id)) {
      if (input.slugAuto) slug = await uniqueSlug(userId, slug, id);
      else {
        slugError = `"${slug}" is already used by another project`;
        slug = current.slug;
      }
    }

    // cover and gallery must be the user's own, verified, public images
    const wanted = Array.from(new Set([...input.gallery.map((g) => g.mediaId), ...(input.coverMediaId ? [input.coverMediaId] : [])]));
    const owned = await projectRepository.ownedPublicImages(userId, wanted);
    if (wanted.some((m) => !owned.has(m))) return { ok: false, error: "One of the selected images is not available" };

    const row = await db.transaction(async (tx) => {
      const updated = await projectRepository.update(userId, id, toValues(input, slug), tx);
      if (!updated) return null;
      await projectRepository.replaceLinks(userId, id, input.links, tx);
      const seen = new Set<string>();
      const gallery = input.gallery.filter((g) => (seen.has(g.mediaId) ? false : (seen.add(g.mediaId), true))).map((g) => ({ mediaId: g.mediaId, caption: g.caption?.trim() || null }));
      await projectRepository.replaceGallery(userId, id, gallery, tx);
      return updated;
    });
    if (!row) return { ok: false, error: "Project not found" };
    return {
      ok: true,
      data: { updatedAt: row.updatedAt.toISOString(), slug: row.slug, slugError, wasLive: current.status === "published", previousSlug: current.slug },
    };
  },

  async setStatus(userId: string, id: string, status: ProjectStatus): Promise<ServiceResult<ProjectListItem>> {
    const current = await projectRepository.findById(userId, id);
    if (!current) return { ok: false, error: "Project not found" };
    if (status === "published") {
      if (!current.title.trim()) return { ok: false, error: "Give the project a title before publishing" };
      if (current.slug.startsWith("draft-")) return { ok: false, error: "Set a URL slug before publishing" };
      if (!current.summary?.trim() && !current.plainText.trim()) return { ok: false, error: "Add a summary or write the case study before publishing" };
    }
    const row = await projectRepository.update(userId, id, {
      status,
      publishedAt: status === "published" ? (current.publishedAt ?? new Date()) : current.publishedAt,
    });
    if (!row) return { ok: false, error: "Project not found" };
    const [detail] = await assemble([row]);
    return { ok: true, data: toListItem(detail) };
  },

  async setFeatured(userId: string, id: string, featured: boolean) {
    const row = await projectRepository.update(userId, id, { featured });
    return row ? { id: row.id, featured: row.featured, slug: row.slug } : null;
  },

  // Everything needed to bring a deleted project back with Undo.
  snapshot: (userId: string, id: string) => projectService.detail(userId, id),

  async restore(userId: string, snap: ProjectDetail) {
    if (validateDoc(snap.content)) return null;
    const slug = await uniqueSlug(userId, slugify(snap.slug));
    const wanted = snap.gallery.map((g) => g.mediaId).concat(snap.coverMediaId ? [snap.coverMediaId] : []);
    const owned = await projectRepository.ownedPublicImages(userId, wanted);
    return db.transaction(async (tx) => {
      const row = await projectRepository.insert(
        userId,
        {
          ...toValues(
            { ...snap, gallery: [], coverMediaId: snap.coverMediaId && owned.has(snap.coverMediaId) ? snap.coverMediaId : null },
            slug
          ),
          status: snap.status,
          featured: snap.featured,
          publishedAt: snap.publishedAt ? new Date(snap.publishedAt) : null,
        },
        tx
      );
      await projectRepository.replaceLinks(userId, row.id, snap.links, tx);
      await projectRepository.replaceGallery(
        userId,
        row.id,
        snap.gallery.filter((g) => owned.has(g.mediaId)).map((g) => ({ mediaId: g.mediaId, caption: g.caption })),
        tx
      );
      return row;
    });
  },

  // ---- public ----
  async published(): Promise<ProjectDetail[]> {
    const owner = await articleRepository.ownerId();
    if (!owner) return [];
    return assemble(await projectRepository.listPublished(owner));
  },

  async publishedBySlug(slug: string): Promise<ProjectDetail | null> {
    const owner = await articleRepository.ownerId();
    if (!owner) return null;
    const row = await projectRepository.findPublishedBySlug(owner, slug);
    return row ? (await assemble([row]))[0] : null;
  },
};
