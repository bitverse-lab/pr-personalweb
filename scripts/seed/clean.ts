// pnpm db:seed:clean [--yes] — removes exactly the demo dataset, and refuses if any of the
// owner's own rows still point at a demo row (a cascade would take the real row with it).
import { getTableColumns, sql } from "drizzle-orm";
import { confirm, describeError, openDatabase, type SeedDb } from "./connect";
import { deleteStatements, foreignKeyEdges, guardQueries } from "./guard";
import { DEMO_PREFIX } from "./ids";
import { findOwnerId, requireOwnerEmail } from "./owner";
import { INSERT_ORDER } from "./plan";
import { isStorageConfigured, listDemoKeys, removeDemoKeys } from "./storage";
import { TABLES } from "./tables";

const count = async (db: SeedDb, query: string) => ((await db.execute(sql.raw(query))) as unknown as { n: number }[])[0]?.n ?? 0;

/** Rows that are not demo, per seeded table: must be identical before and after the delete. */
async function realCounts(db: SeedDb): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const table of INSERT_ORDER) {
    const hasId = "id" in getTableColumns(TABLES[table]);
    const where = hasId ? `"id"::text NOT LIKE '${DEMO_PREFIX}%'` : `"article_id"::text NOT LIKE '${DEMO_PREFIX}%' AND "tag_id"::text NOT LIKE '${DEMO_PREFIX}%'`;
    counts.set(table, await count(db, `SELECT count(*)::int AS n FROM "${table}" WHERE ${where}`));
  }
  return counts;
}

async function main() {
  const email = requireOwnerEmail();
  const { db, host, close } = openDatabase();
  try {
    const userId = await findOwnerId(db, email);
    const statements = deleteStatements(userId); // also rejects an owner id unsafe to inline
    console.log(`Database host: ${host}`);

    const blockers: string[] = [];
    for (const g of guardQueries(foreignKeyEdges())) {
      const n = await count(db, g.sql);
      if (n > 0) blockers.push(`  ${g.child}.${g.column}: ${n} of your own row(s) point at demo data`);
    }
    if (blockers.length) {
      console.error("Refusing to clean: removing demo data would also delete or change your own rows:");
      console.error(blockers.join("\n"));
      console.error("Detach them in /me first (e.g. move a real application off a demo company). Nothing was deleted.");
      process.exitCode = 1;
      return;
    }

    // Counted with the exact WHERE the delete uses, so rows the owner edited (kept) are not listed.
    const plan: { table: string; n: number }[] = [];
    for (const s of [...statements].reverse()) {
      const n = await count(db, `SELECT count(*)::int AS n FROM "${s.table}" WHERE ${s.where}`);
      if (n) plan.push({ table: s.table, n });
    }
    const keys = isStorageConfigured() ? await listDemoKeys() : new Set<string>();
    if (!plan.length && !keys.size) {
      console.log("No demo data found. Nothing to do.");
      return;
    }
    for (const { table, n } of plan) console.log(`  ${table.padEnd(28)} -${n}`);
    console.log(`  ${"storage (public-media)".padEnd(28)} -${keys.size} images`);
    if (!(await confirm("Delete this demo data?", process.argv))) {
      console.log("Cancelled. Nothing was deleted.");
      return;
    }

    const before = await realCounts(db);
    await db.transaction(async (tx) => {
      for (const s of statements) await tx.execute(sql.raw(s.sql));
    });
    const removed = keys.size ? await removeDemoKeys() : 0;
    const after = await realCounts(db);
    const changed = INSERT_ORDER.filter((t) => before.get(t) !== after.get(t));
    if (changed.length) {
      console.error(`Warning: your own row counts changed in: ${changed.join(", ")}. Check these tables.`);
      process.exitCode = 1;
      return;
    }
    console.log(`Done: ${plan.reduce((n, p) => n + p.n, 0)} demo rows and ${removed} images removed. Your own data is unchanged.`);
    console.log("Note: Supabase's CDN can keep serving a deleted public image for up to an hour.");
  } finally {
    await close();
  }
}

main().catch((error: unknown) => {
  console.error(describeError(error));
  process.exit(1);
});
