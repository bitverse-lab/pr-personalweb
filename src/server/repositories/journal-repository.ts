import { and, asc, desc, eq, gte, ilike, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";
import type { RichDoc } from "@/db/schema/content";

// An entry "counts" once the user has written or set something; freshly opened days stay invisible.
const hasContent = sql`(${journalEntries.plainText} <> '' or coalesce(${journalEntries.title}, '') <> '' or ${journalEntries.mood} is not null)`;

const summaryColumns = {
  id: journalEntries.id,
  date: journalEntries.date,
  title: journalEntries.title,
  snippet: sql<string>`left(${journalEntries.plainText}, 180)`,
  mood: journalEntries.mood,
  tags: journalEntries.tags,
  wordCount: journalEntries.wordCount,
};

export interface JournalValues {
  title: string | null;
  content: RichDoc;
  plainText: string;
  wordCount: number;
  mood: number | null;
  tags: string[];
}

export const journalRepository = {
  findById(userId: string, id: string) {
    return db.query.journalEntries.findFirst({ where: and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)) });
  },

  findByDate(userId: string, date: string) {
    return db.query.journalEntries.findFirst({ where: and(eq(journalEntries.userId, userId), eq(journalEntries.date, date)) });
  },

  // One entry per day: opening a day twice returns the same row.
  async openDay(userId: string, date: string) {
    await db.insert(journalEntries).values({ userId, date }).onConflictDoNothing();
    return (await this.findByDate(userId, date))!;
  },

  update(userId: string, id: string, values: JournalValues) {
    return db
      .update(journalEntries)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  delete(userId: string, id: string) {
    return db
      .delete(journalEntries)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  // Recreates a deleted entry for its date (or refills the empty placeholder that took its place).
  async restore(userId: string, date: string, values: JournalValues) {
    return db
      .insert(journalEntries)
      .values({ userId, date, ...values })
      .onConflictDoUpdate({ target: [journalEntries.userId, journalEntries.date], set: { ...values, updatedAt: new Date() } })
      .returning()
      .then((r) => r[0]);
  },

  list(userId: string, opts: { q?: string; tag?: string; limit: number }) {
    const q = opts.q?.trim().replace(/[%_]/g, "");
    return db
      .select(summaryColumns)
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          hasContent,
          q ? or(ilike(journalEntries.plainText, `%${q}%`), ilike(journalEntries.title, `%${q}%`)) : undefined,
          opts.tag ? sql`${opts.tag} = any(${journalEntries.tags})` : undefined
        )
      )
      .orderBy(desc(journalEntries.date))
      .limit(opts.limit);
  },

  range(userId: string, from: string, to: string) {
    return db
      .select(summaryColumns)
      .from(journalEntries)
      .where(and(eq(journalEntries.userId, userId), hasContent, gte(journalEntries.date, from), lte(journalEntries.date, to)))
      .orderBy(asc(journalEntries.date));
  },

  contentDates(userId: string) {
    return db
      .select({ date: journalEntries.date })
      .from(journalEntries)
      .where(and(eq(journalEntries.userId, userId), hasContent))
      .then((r) => r.map((x) => x.date));
  },

  // Entries written on the same calendar day (month-day) in earlier years.
  onThisDay(userId: string, monthDay: string, beforeDate: string) {
    return db
      .select(summaryColumns)
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          hasContent,
          sql`to_char(${journalEntries.date}, 'MM-DD') = ${monthDay}`,
          lt(journalEntries.date, beforeDate)
        )
      )
      .orderBy(desc(journalEntries.date))
      .limit(5);
  },

  adjacent(userId: string, date: string) {
    const prev = db
      .select({ id: journalEntries.id, date: journalEntries.date })
      .from(journalEntries)
      .where(and(eq(journalEntries.userId, userId), hasContent, lt(journalEntries.date, date)))
      .orderBy(desc(journalEntries.date))
      .limit(1);
    const next = db
      .select({ id: journalEntries.id, date: journalEntries.date })
      .from(journalEntries)
      .where(and(eq(journalEntries.userId, userId), hasContent, sql`${journalEntries.date} > ${date}`))
      .orderBy(asc(journalEntries.date))
      .limit(1);
    return Promise.all([prev, next]).then(([p, n]) => ({ prev: p[0] ?? null, next: n[0] ?? null }));
  },

  tagNames(userId: string) {
    return db
      .execute(sql`select distinct unnest(tags) as name from journal_entry where user_id = ${userId} order by 1`)
      .then((rows) => (rows as unknown as { name: string }[]).map((r) => r.name));
  },
};
