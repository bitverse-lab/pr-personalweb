// Indonesian versions of owner-written content, stored beside the English in one `translations`
// jsonb column per table: { "id": { "summary": "…" } }. English stays in the original columns and
// is always the fallback: a field left empty in Indonesian shows the English on /id.
// Pure module: used by the schema, the Zod inputs, the public read models and the /me forms.
import { z } from "zod";
import type { RichDoc } from "@/db/schema/content";

export type ProfileTr = { id?: { headline?: string | null; summary?: string | null; availabilityNote?: string | null } };
export type ExperienceTr = { id?: { role?: string | null; description?: string | null; achievements?: string[] } };
export type EducationTr = { id?: { degree?: string | null; field?: string | null; description?: string | null } };
export type HighlightTr = { id?: { note?: string | null } };
export type ProjectTr = { id?: { title?: string | null; summary?: string | null; outcome?: string | null; content?: RichDoc | null } };
export type ArticleTr = { id?: { title?: string | null; excerpt?: string | null; content?: RichDoc | null } };

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
export const trText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional());

/**
 * The `translations` input of a form. Optional on purpose: a caller that does not send it leaves the
 * stored translations untouched (Drizzle skips undefined), so older callers cannot wipe them.
 */
export const translationsInput = <T extends z.ZodRawShape>(shape: T) => z.object({ id: z.object(shape).optional() }).optional();

/** The Indonesian text when the owner wrote one, otherwise the English. */
export function pickText(locale: "en" | "id", english: string, indonesian: string | null | undefined): string;
export function pickText(locale: "en" | "id", english: string | null, indonesian: string | null | undefined): string | null;
export function pickText(locale: "en" | "id", english: string | null, indonesian: string | null | undefined) {
  return locale === "id" && indonesian && indonesian.trim() ? indonesian : english;
}

/** Same for a list (achievements): the Indonesian list if it has any entries. */
export const pickList = (locale: "en" | "id", english: string[], indonesian: string[] | undefined) => (locale === "id" && indonesian && indonesian.length ? indonesian : english);

/** Same for a rich document: the Indonesian body if it has any text. */
export function pickDoc(locale: "en" | "id", english: RichDoc, indonesian: RichDoc | null | undefined): RichDoc {
  return locale === "id" && indonesian && (indonesian.content?.length ?? 0) > 0 ? indonesian : english;
}

/** Fields of an Indonesian version that have text, for "ID ✓ / partial / missing" badges in /me. */
export function coverage(tr: { id?: Record<string, unknown> } | null | undefined, fields: string[]): { done: number; total: number } {
  const id = tr?.id ?? {};
  const has = (v: unknown) => (typeof v === "string" ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : v && typeof v === "object" ? ((v as RichDoc).content?.length ?? 0) > 0 : false);
  return { done: fields.filter((f) => has(id[f])).length, total: fields.length };
}
