"use server";

import { todayInUserTz } from "@/lib/timezone";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { careerService } from "@/server/services/career-service";
import {
  applicationFiltersSchema,
  changeStatusSchema,
  contactSchema,
  createApplicationSchema,
  idSchema,
  interviewRangeSchema,
  interviewSchema,
  noteSchema,
  updateApplicationSchema,
  updateInterviewSchema,
  type ApplicationFilters,
} from "./schema";
import type { ActionResult } from "@/types/action-result";

function revalidateCareer(includeCalendar = false) {
  revalidatePath("/me/career");
  revalidatePath("/me/career/applications");
  revalidatePath("/me/career/applications/[id]", "page");
  revalidatePath("/me");
  if (includeCalendar) revalidatePath("/me/calendar");
}

const firstIssue = (issues: { message: string }[]) => issues[0]?.message ?? "Invalid input";

// --- Queries ---

export async function getApplications(filters: Partial<ApplicationFilters> = {}) {
  const userId = await requireUserId();
  return careerService.getApplications(userId, applicationFiltersSchema.parse(filters));
}

export async function getApplicationDetail(id: string) {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return null;
  return careerService.getDetail(userId, parsed.data.id);
}

export async function getApplicationStatusCounts() {
  const userId = await requireUserId();
  return careerService.statusCounts(userId);
}

export async function getCompanyNames() {
  const userId = await requireUserId();
  return (await careerService.companyNames(userId)).map((row) => row.name);
}

export async function getInterviews(range: { start: string; end: string }) {
  const userId = await requireUserId();
  const parsed = interviewRangeSchema.parse(range);
  return careerService.getInterviews(userId, new Date(parsed.start), new Date(parsed.end));
}

// --- Mutations ---

export async function createApplication(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = createApplicationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error.issues) };
  const application = await careerService.createApplication(userId, parsed.data, await todayInUserTz());
  revalidateCareer();
  return { ok: true, data: { id: application.id } };
}

export async function updateApplication(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = updateApplicationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error.issues) };
  const row = await careerService.updateApplication(userId, parsed.data);
  if (!row) return { ok: false, error: "Application not found" };
  revalidateCareer();
  return { ok: true, data: { id: row.id } };
}

export async function changeApplicationStatus(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = changeStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid status" };
  const row = await careerService.changeStatus(userId, parsed.data.id, parsed.data.status, await todayInUserTz());
  if (!row) return { ok: false, error: "Application not found" };
  revalidateCareer();
  return { ok: true, data: { id: row.id } };
}

export async function deleteApplication(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid application" };
  const row = await careerService.deleteApplication(userId, parsed.data.id);
  if (!row) return { ok: false, error: "Application not found" };
  revalidateCareer(true);
  return { ok: true, data: { id: row.id } };
}

export async function addNote(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error.issues) };
  const row = await careerService.addNote(userId, parsed.data.applicationId, parsed.data.body);
  if (!row) return { ok: false, error: "Application not found" };
  revalidateCareer();
  return { ok: true, data: { id: row.id } };
}

export async function addContact(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error.issues) };
  const row = await careerService.addContact(userId, parsed.data);
  if (!row) return { ok: false, error: "Application not found" };
  revalidateCareer();
  return { ok: true, data: { id: row.id } };
}

export async function deleteContact(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid contact" };
  const row = await careerService.deleteContact(userId, parsed.data.id);
  if (!row) return { ok: false, error: "Contact not found" };
  revalidateCareer();
  return { ok: true, data: { id: row.id } };
}

export async function createInterview(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = interviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error.issues) };
  const row = await careerService.createInterview(userId, parsed.data);
  if (!row) return { ok: false, error: "Application or contact not found" };
  revalidateCareer(true);
  return { ok: true, data: { id: row.id } };
}

export async function updateInterview(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = updateInterviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error.issues) };
  const row = await careerService.updateInterview(userId, parsed.data);
  if (!row) return { ok: false, error: "Interview not found" };
  revalidateCareer(true);
  return { ok: true, data: { id: row.id } };
}

export async function cancelInterview(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid interview" };
  const row = await careerService.cancelInterview(userId, parsed.data.id);
  if (!row) return { ok: false, error: "Interview not found" };
  revalidateCareer(true);
  return { ok: true, data: { id: row.id } };
}

export async function completeInterview(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid interview" };
  const row = await careerService.completeInterview(userId, parsed.data.id);
  if (!row) return { ok: false, error: "Interview not found" };
  revalidateCareer();
  return { ok: true, data: { id: row.id } };
}
