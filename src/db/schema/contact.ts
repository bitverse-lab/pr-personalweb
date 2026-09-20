import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

// Messages sent through the public contact form. They belong to the site owner and are only ever read from /me.
export const contactMessages = pgTable(
  "contact_message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    subject: text("subject"),
    message: text("message").notNull(),
    // salted hash of the sender's IP, used only to rate-limit; the raw address is never stored
    ipHash: text("ip_hash"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("contact_message_user_created_idx").on(t.userId, t.createdAt), index("contact_message_ip_idx").on(t.ipHash, t.createdAt)]
);
