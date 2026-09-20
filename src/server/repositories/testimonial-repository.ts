import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { testimonials } from "@/db/schema";

export interface TestimonialValues {
  quote: string;
  authorName: string;
  authorRole: string | null;
  company: string | null;
  sourceUrl: string | null;
}

export const testimonialRepository = {
  list(userId: string) {
    return db.select().from(testimonials).where(eq(testimonials.userId, userId)).orderBy(asc(testimonials.position), desc(testimonials.createdAt));
  },

  // New entries go to the top of the manual order.
  async create(userId: string, v: TestimonialValues & { published?: boolean }) {
    const min = await db.select({ min: sql<number>`coalesce(min(${testimonials.position}), 0)::int` }).from(testimonials).where(eq(testimonials.userId, userId));
    return db
      .insert(testimonials)
      .values({ userId, position: (min[0]?.min ?? 0) - 1, ...v })
      .returning()
      .then((r) => r[0]);
  },

  update(userId: string, id: string, v: Partial<TestimonialValues> & { published?: boolean }) {
    return db
      .update(testimonials)
      .set(v)
      .where(and(eq(testimonials.id, id), eq(testimonials.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  delete(userId: string, id: string) {
    return db
      .delete(testimonials)
      .where(and(eq(testimonials.id, id), eq(testimonials.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  async reorder(userId: string, ids: string[]) {
    await db.transaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx.update(testimonials).set({ position: i }).where(and(eq(testimonials.id, ids[i]), eq(testimonials.userId, userId)));
      }
    });
  },

  listPublished(ownerId: string, limit = 6) {
    return db
      .select()
      .from(testimonials)
      .where(and(eq(testimonials.userId, ownerId), eq(testimonials.published, true)))
      .orderBy(asc(testimonials.position), desc(testimonials.createdAt))
      .limit(limit);
  },
};
