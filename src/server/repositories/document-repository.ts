import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationDocuments, applications, media } from "@/db/schema";
import type { DocumentType } from "@/db/schema/media";

export const documentRepository = {
  listForApplication(userId: string, applicationId: string) {
    return db
      .select({ doc: applicationDocuments, media })
      .from(applicationDocuments)
      .innerJoin(media, eq(media.id, applicationDocuments.mediaId))
      .where(and(eq(applicationDocuments.userId, userId), eq(applicationDocuments.applicationId, applicationId), eq(media.status, "ready")))
      .orderBy(desc(applicationDocuments.createdAt));
  },

  // Both the application and the file must belong to the user, and the file must be a verified private document.
  async attach(userId: string, v: { applicationId: string; mediaId: string; type: DocumentType; note: string | null }) {
    const [app, file] = await Promise.all([
      db.query.applications.findFirst({ where: and(eq(applications.id, v.applicationId), eq(applications.userId, userId)), columns: { id: true } }),
      db.query.media.findFirst({ where: and(eq(media.id, v.mediaId), eq(media.userId, userId)) }),
    ]);
    if (!app || !file || file.status !== "ready" || file.kind !== "document" || file.bucket !== "private-docs") return null;
    return db
      .insert(applicationDocuments)
      .values({ userId, ...v })
      .returning()
      .then((r) => r[0]);
  },

  update(userId: string, id: string, v: { type: DocumentType; note: string | null }) {
    return db
      .update(applicationDocuments)
      .set(v)
      .where(and(eq(applicationDocuments.id, id), eq(applicationDocuments.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null);
  },

  find(userId: string, id: string) {
    return db.query.applicationDocuments.findFirst({ where: and(eq(applicationDocuments.id, id), eq(applicationDocuments.userId, userId)) });
  },
};
