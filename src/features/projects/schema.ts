import { z } from "zod";
import { richDocSchema } from "@/features/content/schema";

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const optText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional().transform((v) => v ?? null));
const optDate = z.preprocess(blankToNull, z.iso.date().nullable().optional().transform((v) => v ?? null));

export const techListSchema = z
  .array(z.string().trim().min(1).max(30))
  .max(15, "Use at most 15 technologies")
  .transform((names) => {
    const seen = new Set<string>();
    return names.filter((n) => {
      const k = n.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  });

export const projectLinkSchema = z.object({
  label: z.string().trim().min(1, "Every link needs a label").max(40),
  url: z.string().trim().max(500).refine((v) => /^https?:\/\//i.test(v), "Links must start with http:// or https://"),
});

export const saveProjectSchema = z
  .object({
    id: z.uuid(),
    title: z.string().trim().max(120, "Title is too long"),
    slug: z.string().trim().max(120),
    summary: optText(300),
    outcome: optText(140),
    category: optText(40),
    client: optText(100),
    role: optText(100),
    location: optText(80),
    startDate: optDate,
    endDate: optDate,
    technologies: techListSchema,
    content: richDocSchema,
    coverMediaId: z.uuid().nullable().optional(),
    gallery: z.array(z.object({ mediaId: z.uuid(), caption: optText(160) })).max(24, "A gallery can have at most 24 images"),
    links: z.array(projectLinkSchema).max(8, "Use at most 8 links"),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, { message: "End date must be after the start date", path: ["endDate"] });

export const projectIdSchema = z.object({ id: z.uuid() });
export const projectStatusSchema = z.object({ id: z.uuid(), status: z.enum(["draft", "published", "archived"]) });
export const projectFeaturedSchema = z.object({ id: z.uuid(), featured: z.boolean() });
export const projectReorderSchema = z.object({ ids: z.array(z.uuid()).max(200) });
export const projectFiltersSchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  q: z.string().trim().max(100).optional(),
});

const restoreGallery = z.object({ mediaId: z.uuid(), url: z.string(), caption: z.string().nullable() });
export const restoreProjectSchema = z.object({
  id: z.string(),
  title: z.string().max(120),
  slug: z.string().max(120),
  summary: z.string().nullable(),
  // snapshots taken before outcome existed have no such key
  outcome: z.string().nullable().default(null),
  category: z.string().nullable(),
  client: z.string().nullable(),
  role: z.string().nullable(),
  location: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  technologies: techListSchema,
  content: richDocSchema,
  coverMediaId: z.uuid().nullable(),
  coverUrl: z.string().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean(),
  publishedAt: z.string().nullable(),
  updatedAt: z.string(),
  gallery: z.array(restoreGallery).max(24),
  links: z.array(projectLinkSchema).max(8),
});
