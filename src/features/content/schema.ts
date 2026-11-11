import { z } from "zod";
import { trText, translationsInput } from "./translations";
import { validateDoc } from "./richtext";
import type { RichDoc } from "@/db/schema/content";

export const richDocSchema = z.custom<RichDoc>().superRefine((value, ctx) => {
  const problem = validateDoc(value);
  if (problem) ctx.addIssue({ code: "custom", message: problem });
});

export const tagListSchema = z
  .array(z.string().trim().min(1).max(30))
  .max(10, "Use at most 10 tags")
  .transform((names) => {
    const seen = new Set<string>();
    return names.filter((n) => {
      const k = n.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  });

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Cover image must be an http(s) URL")
  .nullish();

export const articleTranslations = translationsInput({ title: trText(160), excerpt: trText(400), content: richDocSchema.nullable().optional() });

export const saveArticleSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().max(160, "Title is too long"),
  slug: z.string().trim().max(120),
  // True while the slug still follows the title: a clash is then resolved by numbering, not refused.
  slugAuto: z.boolean().optional(),
  excerpt: z.string().trim().max(400, "Excerpt must be 400 characters or fewer").nullish(),
  content: richDocSchema,
  coverUrl: optionalUrl,
  tags: tagListSchema,
  translations: articleTranslations,
});

export const articleStatusSchema = z.object({ id: z.uuid(), status: z.enum(["draft", "published", "archived"]) });
export const articleIdSchema = z.object({ id: z.uuid() });

export const articleFiltersSchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  q: z.string().trim().max(100).optional(),
});

export const restoreArticleSchema = z.object({
  id: z.string(),
  title: z.string().max(160),
  slug: z.string().max(120),
  excerpt: z.string().nullable(),
  content: richDocSchema,
  coverUrl: z.string().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  wordCount: z.number(),
  publishedAt: z.string().nullable(),
  updatedAt: z.string(),
  tags: tagListSchema,
  // snapshots taken before translations existed have no such key
  translations: articleTranslations.transform((v) => v ?? {}),
});

// ---- journal ----

const isoDate = z.iso.date();

export const journalDaySchema = z.object({ date: isoDate });
export const journalIdSchema = z.object({ id: z.uuid() });

export const saveJournalSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().max(160).nullish(),
  content: richDocSchema,
  mood: z.number().int().min(1).max(5).nullable(),
  tags: tagListSchema,
});

export const restoreJournalSchema = z.object({
  date: isoDate,
  title: z.string().max(160).nullable(),
  content: richDocSchema,
  mood: z.number().int().min(1).max(5).nullable(),
  tags: tagListSchema,
});

export const journalFiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(30).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(30),
});

export const journalNoteSchema = z.object({ text: z.string().trim().min(1, "Write something first").max(2000, "Keep quick notes under 2000 characters") });
