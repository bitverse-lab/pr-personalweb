import { cache } from "react";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";

export interface NewMessage {
  name: string;
  email: string;
  subject: string | null;
  message: string;
  ipHash: string | null;
  createdAt?: Date;
  readAt?: Date | null;
}

export const contactRepository = {
  insert(userId: string, v: NewMessage) {
    return db
      .insert(contactMessages)
      .values({ userId, ...v })
      .returning()
      .then((r) => r[0]);
  },

  // Rate-limit helpers: how many messages arrived recently from one sender, or in total.
  countByIpSince(ipHash: string, since: Date) {
    return db
      .select({ n: sql<number>`count(*)::int` })
      .from(contactMessages)
      .where(and(eq(contactMessages.ipHash, ipHash), gte(contactMessages.createdAt, since)))
      .then((r) => r[0]?.n ?? 0);
  },

  countSince(userId: string, since: Date) {
    return db
      .select({ n: sql<number>`count(*)::int` })
      .from(contactMessages)
      .where(and(eq(contactMessages.userId, userId), gte(contactMessages.createdAt, since)))
      .then((r) => r[0]?.n ?? 0);
  },

  list(userId: string, unreadOnly = false) {
    return db
      .select()
      .from(contactMessages)
      .where(and(eq(contactMessages.userId, userId), unreadOnly ? isNull(contactMessages.readAt) : undefined))
      .orderBy(desc(contactMessages.createdAt))
      .limit(200);
  },

  // The workspace layout and the Overview both ask during one render; cache() makes it one query.
  unreadCount: cache((userId: string) =>
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(contactMessages)
      .where(and(eq(contactMessages.userId, userId), isNull(contactMessages.readAt)))
      .then((r) => r[0]?.n ?? 0)
  ),

  setRead(userId: string, id: string, read: boolean) {
    return db
      .update(contactMessages)
      .set({ readAt: read ? new Date() : null })
      .where(and(eq(contactMessages.id, id), eq(contactMessages.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  delete(userId: string, id: string) {
    return db
      .delete(contactMessages)
      .where(and(eq(contactMessages.id, id), eq(contactMessages.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },
};
