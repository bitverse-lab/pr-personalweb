import { sql } from "drizzle-orm";
import { date, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

export type ArticleStatus = "draft" | "published" | "archived";

// Tiptap/ProseMirror document JSON. Validated on write by features/content/richtext.ts.
export type RichDoc = { type: "doc"; content?: unknown[] };

const userRef = () =>
  text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

export const articles = pgTable(
  "article",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: userRef(),
    title: text("title").notNull().default(""),
    slug: text("slug").notNull(),
    excerpt: text("excerpt"),
    content: jsonb("content").$type<RichDoc>().notNull().default(sql`'{"type":"doc","content":[]}'::jsonb`),
    // derived from content on every save; used for search, word count and reading time
    plainText: text("plain_text").notNull().default(""),
    wordCount: integer("word_count").notNull().default(0),
    coverUrl: text("cover_url"),
    status: text("status").$type<ArticleStatus>().notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("article_user_slug_idx").on(t.userId, t.slug), index("article_user_status_idx").on(t.userId, t.status)]
);

export const tags = pgTable(
  "tag",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: userRef(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("tag_user_name_idx").on(t.userId, sql`lower(${t.name})`)]
);

export const articleTags = pgTable(
  "article_tag",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.tagId] })]
);

export const journalEntries = pgTable(
  "journal_entry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: userRef(),
    date: date("date", { mode: "string" }).notNull(),
    title: text("title"),
    content: jsonb("content").$type<RichDoc>().notNull().default(sql`'{"type":"doc","content":[]}'::jsonb`),
    plainText: text("plain_text").notNull().default(""),
    wordCount: integer("word_count").notNull().default(0),
    mood: integer("mood"), // 1 (awful) .. 5 (great)
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("journal_user_date_idx").on(t.userId, t.date)]
);
