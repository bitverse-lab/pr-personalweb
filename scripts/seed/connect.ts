import { createInterface } from "node:readline/promises";
import { config } from "dotenv";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/db/schema";

export type SeedDb = PostgresJsDatabase<typeof schema>;

/** Opens the database named in .env.local. Only the host is ever printed, never the URL. */
export function openDatabase(): { db: SeedDb; host: string; close(): Promise<void> } {
  config({ path: ".env.local", quiet: true });
  // Session pooler first (CLAUDE.md gotcha 7); the transaction pooler works too with prepare: false.
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL or DATABASE_URL must be set in .env.local");
  const client = postgres(url, { prepare: false, max: 1 });
  return { db: drizzle(client, { schema }), host: new URL(url).hostname, close: () => client.end() };
}

/**
 * One line for the terminal. Drizzle wraps driver errors as "Failed query: … params: …", which
 * hides the real cause (e.g. DNS) and echoes parameters such as the owner's email; show the cause.
 */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return "Unexpected failure.";
  if (error.message.startsWith("Failed query:")) {
    return error.cause instanceof Error ? `Database error: ${error.cause.message}` : "Database query failed.";
  }
  return error.message;
}

/** `--yes` skips the prompt; otherwise only a typed "yes" proceeds. */
export async function confirm(question: string, argv: string[]): Promise<boolean> {
  if (argv.includes("--yes")) return true;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(`${question} Type "yes" to continue: `)).trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}
