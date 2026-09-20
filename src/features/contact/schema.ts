import { z } from "zod";

// Removes control characters (keeps tab, newline and carriage return) so pasted junk cannot reach the inbox or email headers.
const stripControl = (s: string) =>
  Array.from(s)
    .filter((ch) => {
      const c = ch.charCodeAt(0);
      return c === 9 || c === 10 || c === 13 || (c >= 32 && c !== 127);
    })
    .join("");

export const contactSchema = z.object({
  name: z.string().transform(stripControl).pipe(z.string().trim().min(1, "Please enter your name").max(100)),
  email: z.string().trim().max(160).pipe(z.email("Please enter a valid email address")),
  subject: z
    .string()
    .transform(stripControl)
    .pipe(z.string().trim().max(150, "Subject is too long"))
    .optional()
    .transform((v) => v || null),
  message: z.string().transform(stripControl).pipe(z.string().trim().min(10, "Your message is a little short — please add a few more words").max(4000, "Please keep the message under 4000 characters")),
  // Anti-spam: real visitors never see or fill this field, and never submit within a couple of seconds of opening the page.
  website: z.string().max(200).optional(),
  startedAt: z.number().optional(),
});

export const messageIdSchema = z.object({ id: z.uuid() });
export const messageReadSchema = z.object({ id: z.uuid(), read: z.boolean() });

export const restoreMessageSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  subject: z.string().max(150).nullable(),
  message: z.string().min(1).max(4000),
  createdAt: z.iso.datetime({ offset: true }),
  readAt: z.iso.datetime({ offset: true }).nullable(),
});
