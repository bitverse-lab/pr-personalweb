"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/server/auth";
import { articleRepository } from "@/server/repositories/article-repository";
import { contactRepository } from "@/server/repositories/contact-repository";
import { sendContactNotification } from "@/server/email/send";
import { contactSchema, messageIdSchema, messageReadSchema, restoreMessageSchema } from "./schema";
import type { ActionResult } from "@/types/action-result";

const PER_SENDER_PER_HOUR = 3;
const PER_DAY_TOTAL = 30;
const MIN_FILL_MS = 2500;

export interface InboxMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  createdAt: string;
  readAt: string | null;
}

const invalid = (e: { issues: { message: string }[] }) => ({ ok: false as const, error: e.issues[0]?.message ?? "Invalid input" });

async function senderHash(): Promise<string | null> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
  if (!ip) return null;
  // salted so the raw address is never stored and the hash cannot be reversed with a rainbow table
  return createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}:${ip}`).digest("hex").slice(0, 32);
}

// ---- public: the contact form (no sign-in) ----

export async function sendContactMessage(input: unknown): Promise<ActionResult<{ sent: true }>> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { website, startedAt, ...data } = parsed.data;

  // Bots fill the hidden field or submit instantly. Pretend it worked so they learn nothing.
  if (website && website.trim() !== "") return { ok: true, data: { sent: true } };
  if (typeof startedAt === "number" && Date.now() - startedAt < MIN_FILL_MS) return { ok: true, data: { sent: true } };

  const owner = await articleRepository.owner();
  if (!owner) return { ok: false, error: "The contact form is not available right now. Please try again later." };

  const ipHash = await senderHash();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [fromSender, today] = await Promise.all([ipHash ? contactRepository.countByIpSince(ipHash, hourAgo) : Promise.resolve(0), contactRepository.countSince(owner.id, dayAgo)]);
  if (fromSender >= PER_SENDER_PER_HOUR) return { ok: false, error: "You have sent several messages recently. Please try again in a while." };
  if (today >= PER_DAY_TOTAL) return { ok: false, error: "The inbox is full for today. Please try again tomorrow." };

  await contactRepository.insert(owner.id, { ...data, ipHash });
  await sendContactNotification(data); // best effort; the message is already saved
  revalidatePath("/me/inbox");
  revalidatePath("/me");
  return { ok: true, data: { sent: true } };
}

// ---- owner only: the inbox ----

export async function getInbox(unreadOnly = false): Promise<InboxMessage[]> {
  const userId = await requireUserId();
  const rows = await contactRepository.list(userId, unreadOnly);
  return rows.map((m) => ({ id: m.id, name: m.name, email: m.email, subject: m.subject, message: m.message, createdAt: m.createdAt.toISOString(), readAt: m.readAt ? m.readAt.toISOString() : null }));
}

export async function getUnreadMessageCount(): Promise<number> {
  const userId = await requireUserId();
  return contactRepository.unreadCount(userId);
}

export async function setMessageRead(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = messageReadSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const row = await contactRepository.setRead(userId, parsed.data.id, parsed.data.read);
  if (!row) return { ok: false, error: "Message not found" };
  revalidatePath("/me", "layout");
  return { ok: true, data: { id: row.id } };
}

export async function deleteMessage(id: string): Promise<ActionResult<InboxMessage>> {
  const userId = await requireUserId();
  const parsed = messageIdSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid message" };
  const m = await contactRepository.delete(userId, parsed.data.id);
  if (!m) return { ok: false, error: "Message not found" };
  revalidatePath("/me", "layout");
  return { ok: true, data: { id: m.id, name: m.name, email: m.email, subject: m.subject, message: m.message, createdAt: m.createdAt.toISOString(), readAt: m.readAt ? m.readAt.toISOString() : null } };
}

export async function restoreMessage(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = restoreMessageSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { createdAt, readAt, ...rest } = parsed.data;
  const row = await contactRepository.insert(userId, { ...rest, ipHash: null, createdAt: new Date(createdAt), readAt: readAt ? new Date(readAt) : null });
  revalidatePath("/me", "layout");
  return { ok: true, data: { id: row.id } };
}
