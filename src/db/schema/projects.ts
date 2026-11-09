import { sql } from "drizzle-orm";
import { boolean, date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { media } from "./media";
import type { ArticleStatus, RichDoc } from "./content";

const userRef = () =>
  text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

// Same lifecycle as articles: draft (private) → published (public) → archived.
export type ProjectStatus = ArticleStatus;

export const projects = pgTable(
  "project",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: userRef(),
    title: text("title").notNull().default(""),
    slug: text("slug").notNull(),
    summary: text("summary"),
    // One line of measurable result, e.g. "7% median error · 40 cooperatives".
    outcome: text("outcome"),
    category: text("category"),
    client: text("client"),
    role: text("role"),
    location: text("location"),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }), // null with a start date = ongoing
    // Deliberate simplification of the spec's technologies/project_technologies tables: an ordered list on the row.
    technologies: text("technologies")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    // Case study body (problem, approach, architecture, results…) as Tiptap JSON, same model as articles.
    content: jsonb("content").$type<RichDoc>().notNull().default(sql`'{"type":"doc","content":[]}'::jsonb`),
    plainText: text("plain_text").notNull().default(""),
    coverMediaId: uuid("cover_media_id").references(() => media.id, { onDelete: "set null" }),
    status: text("status").$type<ProjectStatus>().notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    position: integer("position").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("project_user_slug_idx").on(t.userId, t.slug), index("project_user_status_idx").on(t.userId, t.status)]
);

export const projectLinks = pgTable("project_link", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userRef(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
});

export const projectMedia = pgTable("project_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userRef(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  // deleting the file from the Media library removes it from every gallery
  mediaId: uuid("media_id")
    .notNull()
    .references(() => media.id, { onDelete: "cascade" }),
  caption: text("caption"),
  position: integer("position").notNull().default(0),
});
