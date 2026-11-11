// Marks the existing migrations as applied on a database that was built with `drizzle-kit push`
// before migrations existed, so `pnpm db:migrate` only runs what comes after. Run it once per
// such database. A new, empty database does not need it: `pnpm db:migrate` builds it from scratch.
//
//   pnpm db:baseline            # the database in DIRECT_URL (.env.local)
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });
const url = process.env.DIRECT_URL;
if (!url) throw new Error("DIRECT_URL is not set");

const dir = "src/db/migrations";
const journal = JSON.parse(readFileSync(`${dir}/meta/_journal.json`, "utf8"));
const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  // Same table and hash drizzle's migrator uses: sha256 of the file, and the journal's timestamp.
  await sql`create schema if not exists drizzle`;
  await sql`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`;
  const [{ n }] = await sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
  if (n > 0) {
    console.log(`Already tracked: ${n} migration(s) recorded. Nothing to do.`);
  } else {
    const [{ t }] = await sql`select to_regclass('public.profile') as t`;
    if (!t) throw new Error("This database has no tables. Run `pnpm db:migrate` instead.");
    for (const e of journal.entries) {
      const hash = createHash("sha256").update(readFileSync(`${dir}/${e.tag}.sql`, "utf8")).digest("hex");
      await sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${hash}, ${e.when})`;
      console.log(`Marked as applied: ${e.tag}`);
    }
  }
} finally {
  await sql.end();
}
