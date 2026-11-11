import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Engineering facts about the site itself (test counts, bundle sizes, last backup), written by the
// Proof workflow and shown on /proof. Not owner data: one row per metric for the whole site, so
// there is no user_id here by design.
export const siteMetrics = pgTable("site_metric", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  // The CI run (or commit) that produced the value.
  sourceUrl: text("source_url"),
  measuredAt: timestamp("measured_at", { withTimezone: true }).defaultNow().notNull(),
});
