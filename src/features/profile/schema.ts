import { z } from "zod";
import { trText, translationsInput } from "@/features/content/translations";

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const optText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional().transform((v) => v ?? null));
const optDate = z.preprocess(blankToNull, z.iso.date().nullable().optional().transform((v) => v ?? null));
const httpUrl = z.string().trim().max(500).refine((v) => /^https?:\/\//i.test(v), "Must start with http:// or https://");

export const basicsSchema = z.object({
  displayName: z.string().trim().min(1, "Your name is required").max(80),
  headline: optText(120),
  summary: optText(2000),
  location: optText(80),
  publicEmail: z.preprocess(blankToNull, z.email("Enter a valid email").max(120).nullable().optional().transform((v) => v ?? null)),
  website: z.preprocess(blankToNull, httpUrl.nullable().optional().transform((v) => v ?? null)),
  roles: z
    .array(z.string().trim().min(1).max(30))
    .max(6, "Use at most 6 hero words")
    .default([]),
  availableForWork: z.boolean().default(false),
  availabilityNote: optText(120),
  translations: translationsInput({ headline: trText(120), summary: trText(2000), availabilityNote: trText(120) }),
});

export const experienceSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required").max(100),
    role: z.string().trim().min(1, "Role is required").max(100),
    location: optText(80),
    startDate: z.iso.date("Start date is required"),
    endDate: optDate,
    description: optText(1000),
    achievements: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
    translations: translationsInput({ role: trText(100), description: trText(1000), achievements: z.array(z.string().trim().min(1).max(200)).max(10).optional() }),
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, { message: "End date must be after the start date", path: ["endDate"] });

export const educationSchema = z
  .object({
    school: z.string().trim().min(1, "School is required").max(120),
    degree: optText(100),
    field: optText(100),
    startDate: optDate,
    endDate: optDate,
    description: optText(600),
    translations: translationsInput({ degree: trText(100), field: trText(100), description: trText(600) }),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, { message: "End date must be after the start date", path: ["endDate"] });

export const skillSchema = z.object({
  name: z.string().trim().min(1, "Skill name is required").max(50),
  category: optText(40),
  level: z.coerce.number().int().min(0).max(100),
});

// One row of the hero's profile.sql: a snake_case key, the value as displayed, and a plain-language note.
export const highlightSchema = z.object({
  metric: z.string().trim().min(1, "Key is required").max(40).regex(/^[a-z0-9_]+$/, "Use lower-case letters, digits and underscores, e.g. gpa or ip_rights"),
  value: z.string().trim().min(1, "Value is required").max(60),
  note: optText(140),
  translations: translationsInput({ note: trText(140) }),
});

export const linkSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(40),
  url: z.string().trim().max(500).refine((v) => /^(https?:\/\/|mailto:)/i.test(v), "Must start with http://, https:// or mailto:"),
});

export const idSchema = z.object({ id: z.uuid() });
export const updateSchema = <T extends z.ZodTypeAny>(data: T) => z.object({ id: z.uuid(), data });
export const reorderSchema = z.object({
  kind: z.enum(["experiences", "educations", "skills", "links", "highlights"]),
  ids: z.array(z.uuid()).max(100),
});
export const photoSchema = z.object({ mediaId: z.uuid().nullable() });
