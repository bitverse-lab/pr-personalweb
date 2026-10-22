"use server";

import { revalidateSiteData } from "@/lib/data/site-cache";
import { requireUserId } from "@/server/auth";
import { profileRepository } from "@/server/repositories/profile-repository";
import { mediaRepository } from "@/server/repositories/media-repository";
import { toMediaDto, type MediaDto } from "@/server/services/media-service";
import { basicsSchema, educationSchema, experienceSchema, idSchema, linkSchema, photoSchema, reorderSchema, skillSchema, updateSchema } from "./schema";
import type { ActionResult } from "@/types/action-result";

const invalid = (e: { issues: { message: string }[] }) => ({ ok: false as const, error: e.issues[0]?.message ?? "Invalid input" });

function revalidateProfile() {
  // the name/photo appear in the navbar, footer, metadata and CV on every public page
  revalidateSiteData();
}

export interface ProfileData {
  basics: {
    displayName: string;
    headline: string;
    summary: string;
    location: string;
    publicEmail: string;
    website: string;
    roles: string[];
    availableForWork: boolean;
    availabilityNote: string;
  };
  photo: MediaDto | null;
  experiences: { id: string; company: string; role: string; location: string | null; startDate: string; endDate: string | null; description: string | null; achievements: string[] }[];
  educations: { id: string; school: string; degree: string | null; field: string | null; startDate: string | null; endDate: string | null; description: string | null }[];
  skills: { id: string; name: string; category: string | null; level: number }[];
  links: { id: string; label: string; url: string }[];
}

export async function getMyProfile(): Promise<ProfileData> {
  const userId = await requireUserId();
  const f = await profileRepository.findFull(userId);
  return {
    basics: {
      displayName: f.profile?.displayName ?? "",
      headline: f.profile?.headline ?? "",
      summary: f.profile?.summary ?? "",
      location: f.profile?.location ?? "",
      publicEmail: f.profile?.publicEmail ?? "",
      website: f.profile?.website ?? "",
      roles: f.profile?.roles ?? [],
      availableForWork: f.profile?.availableForWork ?? false,
      availabilityNote: f.profile?.availabilityNote ?? "",
    },
    photo: f.photo ? toMediaDto(f.photo) : null,
    experiences: f.experiences.map((e) => ({ id: e.id, company: e.company, role: e.role, location: e.location, startDate: e.startDate, endDate: e.endDate, description: e.description, achievements: e.achievements })),
    educations: f.educations.map((e) => ({ id: e.id, school: e.school, degree: e.degree, field: e.field, startDate: e.startDate, endDate: e.endDate, description: e.description })),
    skills: f.skills.map((s) => ({ id: s.id, name: s.name, category: s.category, level: s.level })),
    links: f.links.map((l) => ({ id: l.id, label: l.label, url: l.url })),
  };
}

export async function saveBasics(input: unknown): Promise<ActionResult<{ ok: true }>> {
  const userId = await requireUserId();
  const parsed = basicsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await profileRepository.upsertBasics(userId, parsed.data);
  revalidateProfile();
  return { ok: true, data: { ok: true } };
}

export async function setProfilePhoto(input: unknown): Promise<ActionResult<{ ok: true }>> {
  const userId = await requireUserId();
  const parsed = photoSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (parsed.data.mediaId) {
    const m = await mediaRepository.find(userId, parsed.data.mediaId);
    if (!m || m.status !== "ready" || m.kind !== "image" || m.bucket !== "public-media") return { ok: false, error: "That image is not available" };
  }
  await profileRepository.setPhoto(userId, parsed.data.mediaId);
  revalidateProfile();
  return { ok: true, data: { ok: true } };
}

// ---- generic list CRUD ----

type Kind = "experience" | "education" | "skill" | "link";

const handlers = {
  experience: { schema: experienceSchema, create: profileRepository.createExperience, update: profileRepository.updateExperience, remove: profileRepository.deleteExperience },
  education: { schema: educationSchema, create: profileRepository.createEducation, update: profileRepository.updateEducation, remove: profileRepository.deleteEducation },
  skill: { schema: skillSchema, create: profileRepository.createSkill, update: profileRepository.updateSkill, remove: profileRepository.deleteSkill },
  link: { schema: linkSchema, create: profileRepository.createLink, update: profileRepository.updateLink, remove: profileRepository.deleteLink },
} as const;

async function createItem(kind: Kind, input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const h = handlers[kind];
  const parsed = h.schema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await (h.create as (u: string, v: unknown) => Promise<{ id: string }>)(userId, parsed.data);
  revalidateProfile();
  return { ok: true, data: { id: row.id } };
}

async function updateItem(kind: Kind, input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const h = handlers[kind];
  const parsed = updateSchema(h.schema).safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await (h.update as (u: string, id: string, v: unknown) => Promise<{ id: string } | null>)(userId, parsed.data.id, parsed.data.data);
  if (!row) return { ok: false, error: "Not found" };
  revalidateProfile();
  return { ok: true, data: { id: row.id } };
}

async function deleteItem(kind: Kind, id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid item" };
  const row = await (handlers[kind].remove as (u: string, id: string) => Promise<{ id: string } | null>)(userId, parsed.data.id);
  if (!row) return { ok: false, error: "Not found" };
  revalidateProfile();
  return { ok: true, data: { id: row.id } };
}

export const createExperience = async (input: unknown) => createItem("experience", input);
export const updateExperience = async (input: unknown) => updateItem("experience", input);
export const deleteExperience = async (id: string) => deleteItem("experience", id);
export const createEducation = async (input: unknown) => createItem("education", input);
export const updateEducation = async (input: unknown) => updateItem("education", input);
export const deleteEducation = async (id: string) => deleteItem("education", id);
export const createSkill = async (input: unknown) => createItem("skill", input);
export const updateSkill = async (input: unknown) => updateItem("skill", input);
export const deleteSkill = async (id: string) => deleteItem("skill", id);
export const createLink = async (input: unknown) => createItem("link", input);
export const updateLink = async (input: unknown) => updateItem("link", input);
export const deleteLink = async (id: string) => deleteItem("link", id);

export async function reorderItems(input: unknown): Promise<ActionResult<{ ok: true }>> {
  const userId = await requireUserId();
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await profileRepository.reorder(parsed.data.kind, userId, parsed.data.ids);
  revalidateProfile();
  return { ok: true, data: { ok: true } };
}
