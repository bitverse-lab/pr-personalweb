"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { articleRepository } from "@/server/repositories/article-repository";
import { articleService, type ArticleDetail, type ArticleListItem } from "@/server/services/article-service";
import { articleFiltersSchema, articleIdSchema, articleStatusSchema, restoreArticleSchema, saveArticleSchema } from "./schema";
import type { ActionResult } from "@/types/action-result";

const invalid = (e: { issues: { message: string }[] }) => ({ ok: false as const, error: e.issues[0]?.message ?? "Invalid input" });

function revalidateArticles(slug?: string) {
  revalidatePath("/me/articles");
  revalidatePath("/me");
  revalidatePath("/articles");
  if (slug) revalidatePath(`/articles/${slug}`);
}

export async function getMyArticles(filters: { status?: string; q?: string } = {}) {
  const userId = await requireUserId();
  const parsed = articleFiltersSchema.catch({}).parse(filters);
  return articleService.list(userId, parsed);
}

export async function getMyArticle(id: string): Promise<ArticleDetail | null> {
  const userId = await requireUserId();
  const parsed = articleIdSchema.safeParse({ id });
  if (!parsed.success) return null;
  return articleService.detail(userId, parsed.data.id);
}

export async function getMyTagNames() {
  const userId = await requireUserId();
  return (await articleRepository.listTagNames(userId)).map((t) => t.name);
}

export async function createArticleDraft(): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const row = await articleService.createDraft(userId);
  revalidatePath("/me/articles");
  return { ok: true, data: { id: row.id } };
}

// Called by autosave: no list revalidation, only the public page when the article is live.
export async function saveArticle(input: unknown): Promise<ActionResult<{ updatedAt: string }>> {
  const userId = await requireUserId();
  const parsed = saveArticleSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...rest } = parsed.data;
  const before = await articleRepository.findById(userId, id);
  const result = await articleService.save(userId, id, rest);
  if (!result.ok) return result;
  if (before?.status === "published") {
    revalidateArticles(before.slug);
    if (before.slug !== rest.slug) revalidatePath(`/articles/${rest.slug}`);
  }
  return result;
}

export async function setArticleStatus(input: unknown): Promise<ActionResult<ArticleListItem>> {
  const userId = await requireUserId();
  const parsed = articleStatusSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const result = await articleService.setStatus(userId, parsed.data.id, parsed.data.status);
  if (!result.ok) return result;
  revalidateArticles(result.data.slug);
  return result;
}

export async function deleteArticle(id: string): Promise<ActionResult<ArticleDetail>> {
  const userId = await requireUserId();
  const parsed = articleIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid article" };
  const snapshot = await articleService.detail(userId, parsed.data.id);
  if (!snapshot) return { ok: false, error: "Article not found" };
  await articleRepository.delete(userId, parsed.data.id);
  revalidateArticles(snapshot.slug);
  return { ok: true, data: snapshot };
}

export async function restoreArticle(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = restoreArticleSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await articleService.restore(userId, parsed.data);
  if (!row) return { ok: false, error: "Could not restore the article" };
  revalidateArticles(row.slug);
  return { ok: true, data: { id: row.id } };
}
