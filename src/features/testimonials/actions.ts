"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { testimonialRepository } from "@/server/repositories/testimonial-repository";
import { publishTestimonialSchema, reorderTestimonialsSchema, restoreTestimonialSchema, testimonialIdSchema, testimonialSchema, updateTestimonialSchema } from "./schema";
import type { ActionResult } from "@/types/action-result";

export interface TestimonialDto {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string | null;
  company: string | null;
  sourceUrl: string | null;
  published: boolean;
}

const invalid = (e: { issues: { message: string }[] }) => ({ ok: false as const, error: e.issues[0]?.message ?? "Invalid input" });
const toDto = (t: TestimonialDto): TestimonialDto => ({ id: t.id, quote: t.quote, authorName: t.authorName, authorRole: t.authorRole, company: t.company, sourceUrl: t.sourceUrl, published: t.published });

function revalidateTestimonials() {
  revalidatePath("/me/testimonials");
  revalidatePath("/");
}

export async function getMyTestimonials(): Promise<TestimonialDto[]> {
  const userId = await requireUserId();
  return (await testimonialRepository.list(userId)).map(toDto);
}

export async function createTestimonial(input: unknown): Promise<ActionResult<TestimonialDto>> {
  const userId = await requireUserId();
  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await testimonialRepository.create(userId, parsed.data);
  revalidateTestimonials();
  return { ok: true, data: toDto(row) };
}

export async function updateTestimonial(input: unknown): Promise<ActionResult<TestimonialDto>> {
  const userId = await requireUserId();
  const parsed = updateTestimonialSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await testimonialRepository.update(userId, parsed.data.id, parsed.data.data);
  if (!row) return { ok: false, error: "Not found" };
  revalidateTestimonials();
  return { ok: true, data: toDto(row) };
}

export async function setTestimonialPublished(input: unknown): Promise<ActionResult<{ published: boolean }>> {
  const userId = await requireUserId();
  const parsed = publishTestimonialSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await testimonialRepository.update(userId, parsed.data.id, { published: parsed.data.published });
  if (!row) return { ok: false, error: "Not found" };
  revalidateTestimonials();
  return { ok: true, data: { published: row.published } };
}

export async function deleteTestimonial(id: string): Promise<ActionResult<TestimonialDto>> {
  const userId = await requireUserId();
  const parsed = testimonialIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid testimonial" };
  const row = await testimonialRepository.delete(userId, parsed.data.id);
  if (!row) return { ok: false, error: "Not found" };
  revalidateTestimonials();
  return { ok: true, data: toDto(row) };
}

export async function restoreTestimonial(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = restoreTestimonialSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await testimonialRepository.create(userId, parsed.data);
  revalidateTestimonials();
  return { ok: true, data: { id: row.id } };
}

export async function reorderTestimonials(input: unknown): Promise<ActionResult<{ ok: true }>> {
  const userId = await requireUserId();
  const parsed = reorderTestimonialsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await testimonialRepository.reorder(userId, parsed.data.ids);
  revalidateTestimonials();
  return { ok: true, data: { ok: true } };
}
