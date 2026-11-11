import { sql } from "drizzle-orm";
import { db } from "@/db";
import { siteMetrics } from "@/db/schema";

// Site-wide engineering metrics (see db/schema/site.ts): not owner data, so no userId filter.
export const siteMetricRepository = {
  all() {
    return db.select().from(siteMetrics);
  },

  /** One trivial round trip, for measuring how far away the database is. */
  ping() {
    return db.execute(sql`select 1`);
  },
};
