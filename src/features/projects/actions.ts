"use server";

import { revalidateSiteData } from "@/lib/data/site-cache";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { projectRepository } from "@/server/repositories/project-repository";
import { projectService, type ProjectDetail, type ProjectListItem } from "@/server/services/project-service";
import {
  projectFeaturedSchema,
  projectFiltersSchema,
  projectIdSchema,
  projectReorderSchema,
  projectStatusSchema,
  restoreProjectSchema,
  saveProjectSchema,
} from "./schema";
import type { ActionResult } from "@/types/action-result";

const invalid = (e: { issues: { message: string }[] }) => ({ ok: false as const, error: e.issues[0]?.message ?? "Invalid input" });

function revalidateProjects(slug?: string) {
  revalidateSiteData();
  for (const path of ["/me/projects", "/projects", "/", "/cv", "/cv/download", "/sitemap.xml"]) revalidatePath(path);
  if (slug) revalidatePath(`/projects/${slug}`);
}

export async function getMyProjects(filters: { status?: string; q?: string } = {}) {
  const userId = await requireUserId();
  return projectService.list(userId, projectFiltersSchema.catch({}).parse(filters));
}

export async function getMyProject(id: string): Promise<ProjectDetail | null> {
  const userId = await requireUserId();
  const parsed = projectIdSchema.safeParse({ id });
  return parsed.success ? projectService.detail(userId, parsed.data.id) : null;
}

export async function createProjectDraft(): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const row = await projectService.createDraft(userId);
  revalidatePath("/me/projects");
  return { ok: true, data: { id: row.id } };
}

// Called by autosave: only touches the public pages when the project is live.
export async function saveProject(input: unknown): Promise<ActionResult<{ updatedAt: string; slug: string; slugError: string | null }>> {
  const userId = await requireUserId();
  const parsed = saveProjectSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...rest } = parsed.data;
  const result = await projectService.save(userId, id, rest);
  if (!result.ok) return result;
  const { wasLive, previousSlug, ...data } = result.data;
  if (wasLive) {
    revalidateProjects(previousSlug);
    if (previousSlug !== data.slug) revalidatePath(`/projects/${data.slug}`);
  }
  return { ok: true, data };
}

export async function setProjectStatus(input: unknown): Promise<ActionResult<ProjectListItem>> {
  const userId = await requireUserId();
  const parsed = projectStatusSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const result = await projectService.setStatus(userId, parsed.data.id, parsed.data.status);
  if (!result.ok) return result;
  revalidateProjects(result.data.slug);
  return result;
}

export async function setProjectFeatured(input: unknown): Promise<ActionResult<{ featured: boolean }>> {
  const userId = await requireUserId();
  const parsed = projectFeaturedSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await projectService.setFeatured(userId, parsed.data.id, parsed.data.featured);
  if (!row) return { ok: false, error: "Project not found" };
  revalidateProjects(row.slug);
  return { ok: true, data: { featured: row.featured } };
}

export async function reorderProjects(input: unknown): Promise<ActionResult<{ ok: true }>> {
  const userId = await requireUserId();
  const parsed = projectReorderSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await projectRepository.reorder(userId, parsed.data.ids);
  revalidateProjects();
  return { ok: true, data: { ok: true } };
}

export async function deleteProject(id: string): Promise<ActionResult<ProjectDetail>> {
  const userId = await requireUserId();
  const parsed = projectIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid project" };
  const snapshot = await projectService.detail(userId, parsed.data.id);
  if (!snapshot) return { ok: false, error: "Project not found" };
  await projectRepository.delete(userId, parsed.data.id);
  revalidateProjects(snapshot.slug);
  return { ok: true, data: snapshot };
}

export async function restoreProject(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = restoreProjectSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await projectService.restore(userId, parsed.data);
  if (!row) return { ok: false, error: "Could not restore the project" };
  revalidateProjects(row.slug);
  return { ok: true, data: { id: row.id } };
}
