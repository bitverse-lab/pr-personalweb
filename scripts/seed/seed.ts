// pnpm db:seed [--yes] — adds the demo dataset for the owner. Insert-only; re-running adds nothing.
import { and, eq, sql } from "drizzle-orm";
import { publicObjectUrl } from "../../src/server/storage/client";
import { confirm, describeError, openDatabase } from "./connect";
import { buildPrivate } from "./data/private";
import { buildPublic } from "./data/public";
import { DEMO_PREFIX } from "./ids";
import { findOwnerId, readContexts, requireOwnerEmail } from "./owner";
import { planInserts, toTables, withoutMedia, type SeedTable } from "./plan";
import { placeholderPng } from "./png";
import { isStorageConfigured, listDemoKeys, uploadPlaceholders } from "./storage";
import { TABLES } from "./tables";

const CHUNK = 500;

async function main() {
  const email = requireOwnerEmail();
  const { db, host, close } = openDatabase();
  try {
    const userId = await findOwnerId(db, email);
    const ctx = await readContexts(db, userId);
    const today = new Date();

    const storage = isStorageConfigured();
    let pub = buildPublic(userId, today, ctx.pub, (key) => publicObjectUrl("public-media", key));
    if (!storage) {
      console.warn("Storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY): demo images are skipped.");
      pub = withoutMedia(pub);
    }
    const priv = buildPrivate(userId, today, ctx.priv);

    const images = pub.media.map((m) => ({ id: m.row.id, key: m.row.storageKey, bytes: placeholderPng(m.png) }));
    const all = toTables(pub, priv, new Map(images.map((i) => [i.id, i.bytes.byteLength])));

    const existing = new Set<string>();
    for (const name of Object.keys(all) as SeedTable[]) {
      const table = TABLES[name] as unknown as { id?: never; userId?: never };
      if (!table.id || !table.userId) continue; // join rows without ids rely on ON CONFLICT DO NOTHING
      const rows = await db.select({ id: table.id as never }).from(TABLES[name]).where(and(eq(table.userId, userId), sql`${table.id}::text like ${`${DEMO_PREFIX}%`}`));
      for (const r of rows as { id: string }[]) existing.add(r.id);
    }
    const plan = planInserts(all, existing);
    const existingKeys = storage ? await listDemoKeys() : new Set<string>();
    const toUpload = images.filter((i) => !existingKeys.has(i.key));

    console.log(`Database host: ${host}`);
    if (!plan.length && !toUpload.length) {
      console.log("Demo data is already complete. Nothing to do.");
      return;
    }
    for (const { table, rows } of plan) console.log(`  ${table.padEnd(28)} +${rows.length}`);
    console.log(`  ${"storage (public-media)".padEnd(28)} +${toUpload.length} images`);
    if (!(await confirm("Add this demo data for the site owner?", process.argv))) {
      console.log("Cancelled. Nothing was written.");
      return;
    }

    // Uploads first: a failed upload leaves no rows behind. Orphaned images from a failed
    // insert below are still removed by db:seed:clean, which sweeps the prefix.
    const uploaded = storage ? await uploadPlaceholders(toUpload, existingKeys) : 0;
    await db.transaction(async (tx) => {
      for (const { table, rows } of plan) {
        for (let i = 0; i < rows.length; i += CHUNK) {
          await tx.insert(TABLES[table]).values(rows.slice(i, i + CHUNK) as never).onConflictDoNothing();
        }
      }
    });
    const total = plan.reduce((n, t) => n + t.rows.length, 0);
    console.log(`Done: ${total} rows and ${uploaded} images added. Remove them with: pnpm db:seed:clean`);
  } finally {
    await close();
  }
}

main().catch((error: unknown) => {
  console.error(describeError(error));
  process.exit(1);
});
