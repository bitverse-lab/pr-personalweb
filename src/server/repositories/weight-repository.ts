import { and, asc, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { bodyMeasurements, weightEntries } from "@/db/schema";

export interface WeightInput {
  date: string;
  weightKg: number;
  bodyFatPct?: number | null;
  note?: string | null;
}

export interface MeasurementInput {
  date: string;
  waistCm?: number | null;
  chestCm?: number | null;
  hipsCm?: number | null;
  armCm?: number | null;
  thighCm?: number | null;
  neckCm?: number | null;
}

export const weightRepository = {
  list(userId: string, since?: string) {
    return db
      .select()
      .from(weightEntries)
      .where(and(eq(weightEntries.userId, userId), since ? gte(weightEntries.date, since) : undefined))
      .orderBy(asc(weightEntries.date));
  },

  latest(userId: string) {
    return db.query.weightEntries.findFirst({
      where: eq(weightEntries.userId, userId),
      orderBy: [desc(weightEntries.date)],
    });
  },

  // One entry per day: logging the same date again updates it.
  upsert(userId: string, input: WeightInput) {
    const values = {
      weightKg: input.weightKg,
      bodyFatPct: input.bodyFatPct ?? null,
      note: input.note || null,
    };
    return db
      .insert(weightEntries)
      .values({ userId, date: input.date, ...values })
      .onConflictDoUpdate({ target: [weightEntries.userId, weightEntries.date], set: values })
      .returning()
      .then((rows) => rows[0]);
  },

  delete(id: string, userId: string) {
    return db
      .delete(weightEntries)
      .where(and(eq(weightEntries.id, id), eq(weightEntries.userId, userId)))
      .returning()
      .then((rows) => rows[0] ?? null);
  },

  listMeasurements(userId: string) {
    return db.select().from(bodyMeasurements).where(eq(bodyMeasurements.userId, userId)).orderBy(asc(bodyMeasurements.date));
  },

  upsertMeasurement(userId: string, input: MeasurementInput) {
    const values = {
      waistCm: input.waistCm ?? null,
      chestCm: input.chestCm ?? null,
      hipsCm: input.hipsCm ?? null,
      armCm: input.armCm ?? null,
      thighCm: input.thighCm ?? null,
      neckCm: input.neckCm ?? null,
    };
    return db
      .insert(bodyMeasurements)
      .values({ userId, date: input.date, ...values })
      .onConflictDoUpdate({ target: [bodyMeasurements.userId, bodyMeasurements.date], set: values })
      .returning()
      .then((rows) => rows[0]);
  },

  deleteMeasurement(id: string, userId: string) {
    return db
      .delete(bodyMeasurements)
      .where(and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, userId)))
      .returning()
      .then((rows) => rows[0] ?? null);
  },
};
