import { config } from "dotenv";
import postgres from "postgres";

// Test-only database access: finding the owner for the session cookie, and sweeping E2E leftovers.
config({ path: ".env.local", quiet: true });

export function openSql() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set in .env.local");
  return postgres(url, { prepare: false, max: 1 });
}

export async function findOwner(sql: postgres.Sql): Promise<{ id: string; email: string; name: string | null }> {
  const email = process.env.OWNER_EMAIL;
  if (!email) throw new Error("OWNER_EMAIL must be set in .env.local");
  const [row] = await sql<{ id: string; email: string; name: string | null }[]>`select id, email, name from "user" where email = ${email} limit 1`;
  if (!row) throw new Error("The OWNER_EMAIL user does not exist yet; sign in to the site once.");
  return row;
}

/** Deletes every owner row an E2E test may have left behind (title/slug/company prefixed). */
export async function sweepE2ERows(): Promise<Record<string, number>> {
  const sql = openSql();
  try {
    const { id } = await findOwner(sql);
    const counts: Record<string, number> = {};
    counts.project = (await sql`delete from "project" where user_id = ${id} and (title like 'E2E · %' or slug like 'e2e-%')`).count;
    counts.article = (await sql`delete from "article" where user_id = ${id} and (title like 'E2E · %' or slug like 'e2e-%')`).count;
    counts.testimonial = (await sql`delete from "testimonial" where user_id = ${id} and author_name like 'E2E · %'`).count;
    counts.experience = (await sql`delete from "experience" where user_id = ${id} and company like 'E2E · %'`).count;
    return counts;
  } finally {
    await sql.end();
  }
}
