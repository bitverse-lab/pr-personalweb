import { sql } from "drizzle-orm";
import { date, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { calendarEvents } from "./productivity";

export type ApplicationStatus =
  | "wishlist"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";
export type WorkMode = "onsite" | "hybrid" | "remote";
export type InterviewKind = "phone" | "technical" | "hr" | "onsite" | "other";
export type InterviewStatus = "scheduled" | "completed" | "cancelled";
export type TimelineEventType =
  | "created"
  | "status_changed"
  | "note"
  | "interview_scheduled"
  | "interview_completed"
  | "interview_cancelled"
  | "contact_added";

const ownerColumn = () =>
  text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

export const companies = pgTable(
  "company",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: ownerColumn(),
    name: text("name").notNull(),
    website: text("website"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("company_user_name_idx").on(table.userId, sql`lower(${table.name})`)]
);

export const applications = pgTable("application", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: ownerColumn(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  roleTitle: text("role_title").notNull(),
  status: text("status").$type<ApplicationStatus>().notNull().default("wishlist"),
  location: text("location"),
  workMode: text("work_mode").$type<WorkMode | null>(),
  jobUrl: text("job_url"),
  salaryRange: text("salary_range"),
  appliedAt: date("applied_at", { mode: "string" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const applicationStatusHistory = pgTable("application_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: ownerColumn(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  fromStatus: text("from_status").$type<ApplicationStatus | null>(),
  toStatus: text("to_status").$type<ApplicationStatus>().notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const applicationTimelineEvents = pgTable("application_timeline_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: ownerColumn(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  type: text("type").$type<TimelineEventType>().notNull(),
  title: text("title").notNull(),
  body: text("body"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
});

export const applicationContacts = pgTable("application_contact", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: ownerColumn(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role"),
  email: text("email"),
  phone: text("phone"),
  linkedin: text("linkedin"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const interviews = pgTable("interview", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: ownerColumn(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  kind: text("kind").$type<InterviewKind>().notNull().default("other"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  locationOrLink: text("location_or_link"),
  status: text("status").$type<InterviewStatus>().notNull().default("scheduled"),
  notes: text("notes"),
  contactId: uuid("contact_id").references(() => applicationContacts.id, { onDelete: "set null" }),
  calendarEventId: uuid("calendar_event_id").references(() => calendarEvents.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
