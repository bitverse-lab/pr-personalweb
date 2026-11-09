import { getTableColumns, getTableName } from "drizzle-orm";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import * as schema from "../../src/db/schema";
import { DEMO_PREFIX } from "./ids";
import { INSERT_ORDER, type SeedTable } from "./plan";
import { TABLES } from "./tables";

export interface Edge {
  child: string;
  column: string;
  parent: string;
  /** false for join tables keyed only by their foreign keys (article_tag) */
  childHasId: boolean;
  /** the join table's other foreign-key columns */
  siblings: string[];
}

const AUTH_TABLES = new Set(["user", "account", "session", "verificationToken"]);

// Join tables: the column of the row that owns the link. A demo article tagged with one of the
// owner's tags is expected (the seed reuses tags) and harmless to delete; only a real owner row
// linked to a demo row would lose something.
const JOIN_OWNER: Record<string, string> = { article_tag: "article_id" };

// The app upserts journal days by (user, date), so the owner's later edits land in the demo row
// itself. Rows touched after seeding are treated as the owner's and kept.
const KEEP_IF_EDITED = new Set(["journal_entry"]);
const LIKE_DEMO = `LIKE '${DEMO_PREFIX}%'`;
const NOT_LIKE_DEMO = `NOT LIKE '${DEMO_PREFIX}%'`;
const q = (name: string) => `"${name}"`;

function allTables(): PgTable[] {
  return Object.values(schema as Record<string, unknown>).filter((v): v is PgTable => {
    try {
      return typeof getTableName(v as PgTable) === "string" && !!getTableConfig(v as PgTable).columns;
    } catch {
      return false;
    }
  });
}

/** Every foreign key in the schema, except those pointing into the auth tables. */
export function foreignKeyEdges(): Edge[] {
  return allTables().flatMap((table) => {
    const config = getTableConfig(table);
    const childHasId = "id" in getTableColumns(table);
    const fkColumns = config.foreignKeys.map((fk) => fk.reference().columns[0].name);
    return config.foreignKeys.flatMap((fk) => {
      const ref = fk.reference();
      const parent = getTableName(ref.foreignTable);
      if (AUTH_TABLES.has(parent) || AUTH_TABLES.has(config.name)) return [];
      const column = ref.columns[0].name;
      const owner = JOIN_OWNER[config.name];
      if (!childHasId && owner === column) return [];
      return [{ child: config.name, column, parent, childHasId, siblings: childHasId ? [] : owner ? [owner] : fkColumns.filter((c) => c !== column) }];
    });
  });
}

/**
 * For each edge: SQL counting rows the owner made (not demo) that point at a demo row. Any such row
 * would be cascade-deleted or nulled by clean, so clean refuses to run while one exists.
 */
export function guardQueries(edges: Edge[]): { child: string; column: string; sql: string }[] {
  return edges.map((e) => {
    const col = `${q(e.child)}.${q(e.column)}::text`;
    const real = e.childHasId
      ? `${q(e.child)}."id"::text ${NOT_LIKE_DEMO}`
      : e.siblings.map((s) => `${q(e.child)}.${q(s)}::text ${NOT_LIKE_DEMO}`).join(" OR ") || "false";
    return { child: e.child, column: e.column, sql: `SELECT count(*)::int AS n FROM ${q(e.child)} WHERE ${col} ${LIKE_DEMO} AND (${real})` };
  });
}

const SAFE_ID = /^[A-Za-z0-9_-]+$/;

/** Children first; each statement touches only the owner's demo-prefixed rows. `where` is reused to count them. */
export function deleteStatements(ownerId: string): { table: SeedTable; where: string; sql: string }[] {
  if (!SAFE_ID.test(ownerId)) throw new Error("Unexpected owner id format; refusing to build delete statements.");
  return [...INSERT_ORDER].reverse().map((table) => {
    const columns = getTableColumns(TABLES[table]);
    let where: string;
    if (!("id" in columns)) {
      // article_tag: a link goes when either end is demo (real article ↔ demo tag was refused by the guard)
      where = getTableConfig(TABLES[table]).foreignKeys.map((fk) => `${q(fk.reference().columns[0].name)}::text ${LIKE_DEMO}`).join(" OR ");
    } else {
      where = `"id"::text ${LIKE_DEMO} AND "user_id" = '${ownerId}'`;
      if (KEEP_IF_EDITED.has(table)) where += ` AND "updated_at" <= "created_at"`;
    }
    return { table, where, sql: `DELETE FROM ${q(table)} WHERE ${where}` };
  });
}
