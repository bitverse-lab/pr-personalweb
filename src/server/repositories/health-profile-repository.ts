import { eq } from "drizzle-orm";
import { db } from "@/db";
import { healthProfiles } from "@/db/schema";

type ProfileValues = Omit<typeof healthProfiles.$inferInsert, "id" | "userId" | "updatedAt">;

export const healthProfileRepository = {
  find(userId: string) {
    return db.query.healthProfiles.findFirst({ where: eq(healthProfiles.userId, userId) });
  },

  upsert(userId: string, values: ProfileValues) {
    return db
      .insert(healthProfiles)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: healthProfiles.userId, set: { ...values, updatedAt: new Date() } })
      .returning()
      .then((rows) => rows[0]);
  },
};
