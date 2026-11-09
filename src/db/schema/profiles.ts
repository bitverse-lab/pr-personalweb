import { boolean, integer, pgTable, text, timestamp, uuid, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { media } from "./media";

const userRef = () =>
  text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

export const profiles = pgTable("profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  headline: text("headline"),
  summary: text("summary"),
  location: text("location"),
  publicEmail: text("public_email"),
  website: text("website"),
  // words cycled by the hero typing animation after the first name
  roles: text("roles")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  // shown as a badge on the public site ("Available for work") with an optional note, e.g. "Remote roles from October"
  availableForWork: boolean("available_for_work").notNull().default(false),
  availabilityNote: text("availability_note"),
  photoMediaId: uuid("photo_media_id").references(() => media.id, { onDelete: "set null" }),
  aboutPhotoMediaId: uuid("about_photo_media_id").references(() => media.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const socialLinks = pgTable("social_link", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userRef(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
});

export const experiences = pgTable("experience", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userRef(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  location: text("location"),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }), // null = current
  description: text("description"),
  // deliberate simplification of spec's experience_achievements table: an ordered list on the row
  achievements: text("achievements")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  position: integer("position").notNull().default(0),
});

export const educations = pgTable("education", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userRef(),
  school: text("school").notNull(),
  degree: text("degree"),
  field: text("field"),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  description: text("description"),
  position: integer("position").notNull().default(0),
});

// Owner-written proof points shown in the hero console (profile.sql) and on the CV.
export const profileHighlights = pgTable("profile_highlight", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userRef(),
  metric: text("metric").notNull(),
  value: text("value").notNull(),
  note: text("note"),
  position: integer("position").notNull().default(0),
});

export const skills = pgTable("skill", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userRef(),
  name: text("name").notNull(),
  category: text("category"),
  level: integer("level").notNull().default(80), // 0-100, shown as the template's progress bars
  position: integer("position").notNull().default(0),
});
