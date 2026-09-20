import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

// Recommendations from colleagues or clients, shown on the public home page once published.
export const testimonials = pgTable(
  "testimonial",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quote: text("quote").notNull(),
    authorName: text("author_name").notNull(),
    authorRole: text("author_role"),
    company: text("company"),
    // e.g. the LinkedIn recommendation, so visitors can verify it
    sourceUrl: text("source_url"),
    published: boolean("published").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("testimonial_user_position_idx").on(t.userId, t.position)]
);
