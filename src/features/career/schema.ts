import { z } from "zod";

export const APPLICATION_STATUSES = [
  "wishlist",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);
export const workModeSchema = z.enum(["onsite", "hybrid", "remote"]);
export const interviewKindSchema = z.enum(["phone", "technical", "hr", "onsite", "other"]);

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const applicationFiltersSchema = z.object({
  status: z.union([applicationStatusSchema, z.literal("all"), z.literal("active"), z.literal("closed")]).default("all"),
  q: z.string().trim().max(100).optional(),
});
export type ApplicationFilters = z.infer<typeof applicationFiltersSchema>;

export const createApplicationSchema = z.object({
  companyName: z.string().trim().min(1, "Company is required").max(120),
  roleTitle: z.string().trim().min(1, "Role is required").max(160),
  status: applicationStatusSchema.default("wishlist"),
  location: optionalText(120),
  workMode: workModeSchema.optional(),
  jobUrl: z.union([z.literal(""), z.url("Enter a valid URL")]).optional(),
  salaryRange: optionalText(80),
  appliedAt: z.iso.date().optional(),
  notes: optionalText(4000),
});
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string().trim().min(1).max(120).optional(),
  roleTitle: z.string().trim().min(1).max(160).optional(),
  location: optionalText(120),
  workMode: workModeSchema.nullable().optional(),
  jobUrl: z.union([z.literal(""), z.url("Enter a valid URL")]).optional(),
  salaryRange: optionalText(80),
  appliedAt: z.iso.date().nullable().optional(),
  notes: optionalText(4000),
});
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

export const changeStatusSchema = z.object({ id: z.string().uuid(), status: applicationStatusSchema });
export const idSchema = z.object({ id: z.string().uuid() });

export const noteSchema = z.object({
  applicationId: z.string().uuid(),
  body: z.string().trim().min(1, "Write something first").max(2000),
});

export const contactSchema = z.object({
  applicationId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(120),
  role: optionalText(120),
  email: z.union([z.literal(""), z.email("Enter a valid email")]).optional(),
  phone: optionalText(40),
  linkedin: optionalText(200),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const interviewSchema = z
  .object({
    applicationId: z.string().uuid(),
    kind: interviewKindSchema.default("other"),
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
    locationOrLink: optionalText(300),
    notes: optionalText(2000),
    contactId: z.string().uuid().nullable().optional(),
  })
  .refine((v) => new Date(v.end) > new Date(v.start), { message: "End must be after start", path: ["end"] });
export type InterviewInput = z.infer<typeof interviewSchema>;

export const updateInterviewSchema = z
  .object({
    id: z.string().uuid(),
    kind: interviewKindSchema.optional(),
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
    locationOrLink: optionalText(300),
    notes: optionalText(2000),
    contactId: z.string().uuid().nullable().optional(),
  })
  .refine((v) => new Date(v.end) > new Date(v.start), { message: "End must be after start", path: ["end"] });
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;

export const interviewRangeSchema = z.object({
  start: z.iso.datetime({ offset: true }),
  end: z.iso.datetime({ offset: true }),
});
