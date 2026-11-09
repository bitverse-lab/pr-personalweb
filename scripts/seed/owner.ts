import { and, eq, max, sql } from "drizzle-orm";
import { config } from "dotenv";
import * as schema from "../../src/db/schema";
import type { SeedDb } from "./connect";
import type { PrivateContext } from "./data/private";
import type { PositionKey, PublicContext } from "./data/public";
import { DEMO_PREFIX } from "./ids";

/** Read before connecting, so a missing owner never opens a connection or writes anything. */
export function requireOwnerEmail(): string {
  config({ path: ".env.local", quiet: true });
  const email = process.env.OWNER_EMAIL?.trim();
  if (!email) throw new Error("OWNER_EMAIL is not set (.env.local). Nothing was written.");
  return email;
}

export async function findOwnerId(db: SeedDb, email: string): Promise<string> {
  const row = await db.query.users.findFirst({ where: eq(schema.users.email, email), columns: { id: true } });
  if (!row) throw new Error("No user with OWNER_EMAIL exists yet. Sign in to the site once, then re-run. Nothing was written.");
  return row.id;
}

const notDemo = (id: { getSQL(): unknown } & object) => sql`${id}::text not like ${`${DEMO_PREFIX}%`}`;

/** The owner's own rows that demo data must sit after or avoid colliding with. Demo rows are excluded. */
export async function readContexts(db: SeedDb, userId: string): Promise<{ pub: PublicContext; priv: PrivateContext }> {
  const s = schema;
  const maxPos = async (table: typeof s.experiences | typeof s.educations | typeof s.skills | typeof s.socialLinks | typeof s.projects | typeof s.testimonials) => {
    const [row] = await db.select({ m: max(table.position) }).from(table).where(and(eq(table.userId, userId), notDemo(table.id)));
    return row?.m ?? undefined;
  };
  const positionTables: [PositionKey, Parameters<typeof maxPos>[0]][] = [
    ["experience", s.experiences], ["education", s.educations], ["skill", s.skills], ["socialLink", s.socialLinks], ["project", s.projects], ["testimonial", s.testimonials],
  ];
  const positions: PublicContext["positions"] = {};
  for (const [key, table] of positionTables) {
    const m = await maxPos(table);
    if (m !== undefined && m !== null) positions[key] = m;
  }

  const own = <T extends { userId: unknown; id: unknown }>(t: T) => and(eq(t.userId as never, userId), notDemo(t.id as never));
  const projectSlugs = new Set((await db.select({ v: s.projects.slug }).from(s.projects).where(own(s.projects))).map((r) => r.v));
  const articleSlugs = new Set((await db.select({ v: s.articles.slug }).from(s.articles).where(own(s.articles))).map((r) => r.v));
  const tagIds = new Map((await db.select({ id: s.tags.id, name: s.tags.name }).from(s.tags).where(own(s.tags))).map((r) => [r.name.toLowerCase(), r.id]));

  const dates = async (t: typeof s.weightEntries | typeof s.bodyMeasurements | typeof s.journalEntries) =>
    new Set((await db.select({ d: t.date }).from(t).where(own(t))).map((r) => r.d));
  const foodRows = await db.select({ id: s.foods.id, name: s.foods.name, brand: s.foods.brand }).from(s.foods).where(own(s.foods));
  const exerciseRows = await db.select({ id: s.exercises.id, name: s.exercises.name }).from(s.exercises).where(own(s.exercises));
  const companyRows = await db.select({ id: s.companies.id, name: s.companies.name }).from(s.companies).where(own(s.companies));
  const healthProfile = (await db.select({ id: s.healthProfiles.id }).from(s.healthProfiles).where(eq(s.healthProfiles.userId, userId)).limit(1)).length > 0;

  return {
    pub: { positions, projectSlugs, articleSlugs, tagIds },
    priv: {
      healthProfile,
      weightDates: await dates(s.weightEntries),
      measurementDates: await dates(s.bodyMeasurements),
      journalDates: await dates(s.journalEntries),
      foodIds: new Map(foodRows.map((r) => [`${r.name.toLowerCase()}|${r.brand ?? ""}`, r.id])),
      exerciseIds: new Map(exerciseRows.map((r) => [r.name.toLowerCase(), r.id])),
      companyIds: new Map(companyRows.map((r) => [r.name.toLowerCase(), r.id])),
    },
  };
}
