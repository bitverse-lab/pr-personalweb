"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { journalRepository } from "@/server/repositories/journal-repository";
import { journalService } from "@/server/services/journal-service";
import { todayInUserTz } from "@/lib/timezone";
import { journalDaySchema, journalFiltersSchema, journalIdSchema, journalNoteSchema, restoreJournalSchema, saveJournalSchema } from "./schema";
import type { ActionResult } from "@/types/action-result";

const invalid = (e: { issues: { message: string }[] }) => ({ ok: false as const, error: e.issues[0]?.message ?? "Invalid input" });

function revalidateJournal() {
  revalidatePath("/me/journal");
  revalidatePath("/me");
}

export async function getJournalOverview(filters: { q?: string; tag?: string; month?: string; limit?: number } = {}) {
  const userId = await requireUserId();
  const parsed = journalFiltersSchema.catch({ limit: 30 }).parse(filters);
  return journalService.overview(userId, parsed, await todayInUserTz());
}

export async function getJournalEntry(id: string) {
  const userId = await requireUserId();
  const parsed = journalIdSchema.safeParse({ id });
  if (!parsed.success) return null;
  return journalService.entry(userId, parsed.data.id);
}

/** Opens (creating if needed) the entry for a day, then redirects into the editor. Future days are refused. */
export async function openJournalDay(formData: FormData) {
  const userId = await requireUserId();
  const parsed = journalDaySchema.safeParse({ date: formData.get("date") });
  if (!parsed.success) redirect("/me/journal");
  const today = await todayInUserTz();
  if (parsed.data.date > today) redirect("/me/journal");
  const entry = await journalRepository.openDay(userId, parsed.data.date);
  revalidateJournal();
  redirect(`/me/journal/${entry.id}`);
}

// Called by autosave.
export async function saveJournalEntry(input: unknown): Promise<ActionResult<{ updatedAt: string }>> {
  const userId = await requireUserId();
  const parsed = saveJournalSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...rest } = parsed.data;
  const result = await journalService.save(userId, id, rest);
  if (result.ok) revalidateJournal();
  return result;
}

export async function deleteJournalEntry(id: string) {
  const userId = await requireUserId();
  const parsed = journalIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false as const, error: "Invalid entry" };
  const found = await journalService.entry(userId, parsed.data.id);
  if (!found) return { ok: false as const, error: "Entry not found" };
  await journalRepository.delete(userId, parsed.data.id);
  revalidateJournal();
  const { entry } = found;
  return { ok: true as const, data: { date: entry.date, title: entry.title, content: entry.content, mood: entry.mood, tags: entry.tags } };
}

export async function restoreJournalEntry(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = restoreJournalSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { date, ...rest } = parsed.data;
  const row = await journalService.restore(userId, date, rest);
  if (!row) return { ok: false, error: "Could not restore the entry" };
  revalidateJournal();
  return { ok: true, data: { id: row.id } };
}

/** Quick capture from the Overview: appends a line to today's journal entry. */
export async function addJournalNote(input: unknown): Promise<ActionResult<{ id: string; words: number }>> {
  const userId = await requireUserId();
  const parsed = journalNoteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const result = await journalService.appendNote(userId, await todayInUserTz(), parsed.data.text);
  if (result.ok) revalidateJournal();
  return result;
}
