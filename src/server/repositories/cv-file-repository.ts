import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cvFiles, media } from "@/db/schema";

export const cvFileRepository = {
  /** The owner's CV files with what the pages show about each: name, size and when it changed. */
  list(userId: string) {
    return db
      .select({
        role: cvFiles.role,
        mediaId: cvFiles.mediaId,
        updatedAt: cvFiles.updatedAt,
        fileName: media.originalName,
        sizeBytes: media.sizeBytes,
        bucket: media.bucket,
        storageKey: media.storageKey,
      })
      .from(cvFiles)
      .innerJoin(media, eq(media.id, cvFiles.mediaId))
      .where(and(eq(cvFiles.userId, userId), eq(media.status, "ready")))
      .orderBy(cvFiles.role);
  },

  find(userId: string, role: string) {
    return db.query.cvFiles.findFirst({ where: and(eq(cvFiles.userId, userId), eq(cvFiles.role, role)) });
  },

  /** Points a role at a new file; returns the file it replaced, if any. */
  async upsert(userId: string, role: string, mediaId: string): Promise<string | null> {
    return db.transaction(async (tx) => {
      const old = await tx.query.cvFiles.findFirst({ where: and(eq(cvFiles.userId, userId), eq(cvFiles.role, role)) });
      await tx
        .insert(cvFiles)
        .values({ userId, role, mediaId })
        .onConflictDoUpdate({ target: [cvFiles.userId, cvFiles.role], set: { mediaId, updatedAt: new Date() } });
      return old && old.mediaId !== mediaId ? old.mediaId : null;
    });
  },

  remove(userId: string, role: string) {
    return db
      .delete(cvFiles)
      .where(and(eq(cvFiles.userId, userId), eq(cvFiles.role, role)))
      .returning({ mediaId: cvFiles.mediaId })
      .then((r) => r[0]?.mediaId ?? null);
  },
};
