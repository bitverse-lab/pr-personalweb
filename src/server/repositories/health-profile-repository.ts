import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { healthProfiles } from "@/db/schema";

type ProfileValues = Omit<typeof healthProfiles.$inferInsert, "id" | "userId" | "updatedAt">;

export const healthProfileRepository = {
  // Nutrition, weight and workouts each read the profile while one page renders; cache() makes it
  // one query per request. Outside a render (Server Actions) it is a plain call, so writes never go stale.
  find: cache((userId: string) => db.query.healthProfiles.findFirst({ where: eq(healthProfiles.userId, userId) })),

  upsert(userId: string, values: ProfileValues) {
    return db
      .insert(healthProfiles)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: healthProfiles.userId, set: { ...values, updatedAt: new Date() } })
      .returning()
      .then((rows) => rows[0]);
  },
};
