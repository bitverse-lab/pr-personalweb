/// <reference lib="webworker" />
// A real Postgres (PGlite, WebAssembly) in a worker, loaded with the public snapshot. It lives only
// in this tab's memory: visitors may write to it, and a reload brings the original data back.
import { PGlite } from "@electric-sql/pglite";
import { snapshotDdl, type Snapshot } from "@/features/sandbox/snapshot";

export type SandboxRequest = { type: "init"; snapshot: Snapshot } | { type: "query"; id: number; sql: string };
export type SandboxResponse =
  | { type: "ready"; ms: number; version: string }
  | { type: "result"; id: number; fields: string[]; rows: unknown[][]; total: number; affected: number; ms: number }
  | { type: "error"; id?: number; message: string };

const MAX_ROWS = 500; // enough to read; keeps a cross join from freezing the page that renders it
let db: PGlite | null = null;
const send = (m: SandboxResponse) => postMessage(m);

self.onmessage = async (e: MessageEvent<SandboxRequest>) => {
  const msg = e.data;
  try {
    if (msg.type === "init") {
      const t = performance.now();
      db = new PGlite();
      await db.waitReady;
      await db.exec(snapshotDdl(msg.snapshot));
      await db.transaction(async (tx) => {
        for (const table of msg.snapshot.tables) {
          // Every value travels as text and is cast in SQL, so no driver type guessing is involved.
          const values = table.columns.map((c, i) => `$${i + 1}::text::${c.type}`).join(", ");
          for (const row of table.rows) await tx.query(`insert into ${table.name} values (${values})`, row.map((v) => (v === null ? null : String(v))));
        }
      });
      const version = (await db.query<{ v: string }>("select split_part(version(), ' ', 2) as v")).rows[0]?.v ?? "";
      send({ type: "ready", ms: Math.round(performance.now() - t), version });
    } else if (db) {
      const t = performance.now();
      const results = await db.exec(msg.sql, { rowMode: "array" });
      const last = results[results.length - 1];
      const rows = (last?.rows ?? []) as unknown[][];
      send({
        type: "result",
        id: msg.id,
        fields: last?.fields.map((f) => f.name) ?? [],
        rows: rows.slice(0, MAX_ROWS),
        total: rows.length,
        affected: last?.affectedRows ?? 0,
        ms: Math.max(1, Math.round(performance.now() - t)),
      });
    }
  } catch (err) {
    send({ type: "error", id: msg.type === "query" ? msg.id : undefined, message: err instanceof Error ? err.message : String(err) });
  }
};
