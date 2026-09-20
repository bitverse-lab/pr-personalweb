import { z } from "zod";

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const optText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional().transform((v) => v ?? null));

export const testimonialSchema = z.object({
  quote: z.string().trim().min(10, "The quote is a little short").max(700, "Keep the quote under 700 characters"),
  authorName: z.string().trim().min(1, "Who said it?").max(80),
  authorRole: optText(80),
  company: optText(80),
  sourceUrl: z.preprocess(
    blankToNull,
    z.string().trim().max(500).refine((v) => /^https?:\/\//i.test(v), "Must start with http:// or https://").nullable().optional().transform((v) => v ?? null)
  ),
});

export const updateTestimonialSchema = z.object({ id: z.uuid(), data: testimonialSchema });
export const testimonialIdSchema = z.object({ id: z.uuid() });
export const publishTestimonialSchema = z.object({ id: z.uuid(), published: z.boolean() });
export const reorderTestimonialsSchema = z.object({ ids: z.array(z.uuid()).max(100) });
export const restoreTestimonialSchema = testimonialSchema.extend({ published: z.boolean() });
