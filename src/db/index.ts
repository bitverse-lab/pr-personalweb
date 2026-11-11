import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { assertServerEnv } from "@/server/env";

assertServerEnv();

// `next dev` evaluates this module once per route bundle and on every reload; without reuse each
// evaluation opened its own pool and exhausted Supabase's 200-connection pooler (EMAXCONN).
const globalForDb = globalThis as unknown as { __pgClient?: ReturnType<typeof postgres> };
// In development, the Session pooler (DIRECT_URL) keeps prepared statements, so a parameterised query
// costs one round trip to the database region instead of two. Deployed code stays on the transaction
// pooler, which cannot hold prepared statements.
const devSession = process.env.NODE_ENV === "development" && process.env.DIRECT_URL;
const client =
  globalForDb.__pgClient ??
  (devSession ? postgres(devSession, { prepare: true }) : postgres(process.env.DATABASE_URL!, { prepare: false }));
if (process.env.NODE_ENV !== "production") globalForDb.__pgClient = client;

export const db = drizzle(client, { schema });
