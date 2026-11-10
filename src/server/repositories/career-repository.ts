import { and, asc, desc, eq, gte, ilike, inArray, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationContacts,
  applicationStatusHistory,
  applicationTimelineEvents,
  applications,
  calendarEvents,
  companies,
  interviews,
} from "@/db/schema";
import type { ApplicationStatus, InterviewKind, TimelineEventType, WorkMode } from "@/db/schema/career";
import type { ApplicationFilters } from "@/features/career/schema";

export type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

const ACTIVE: ApplicationStatus[] = ["wishlist", "applied", "screening", "interview", "offer"];
const CLOSED: ApplicationStatus[] = ["rejected", "withdrawn"];

const applicationColumns = {
  id: applications.id,
  companyId: applications.companyId,
  companyName: companies.name,
  roleTitle: applications.roleTitle,
  status: applications.status,
  location: applications.location,
  workMode: applications.workMode,
  jobUrl: applications.jobUrl,
  salaryRange: applications.salaryRange,
  appliedAt: applications.appliedAt,
  notes: applications.notes,
  createdAt: applications.createdAt,
  updatedAt: applications.updatedAt,
  // When it entered its current stage: the latest status change on record (null for rows that predate history).
  stageSince: sql<Date | null>`(select max(${applicationStatusHistory.changedAt}) from ${applicationStatusHistory} where ${applicationStatusHistory.applicationId} = ${applications.id})`.mapWith(
    applicationStatusHistory.changedAt
  ),
};

export const careerRepository = {
  findApplications(userId: string, filters: ApplicationFilters) {
    const conditions = [eq(applications.userId, userId)];
    if (filters.status === "active") conditions.push(inArray(applications.status, ACTIVE));
    else if (filters.status === "closed") conditions.push(inArray(applications.status, CLOSED));
    else if (filters.status !== "all") conditions.push(eq(applications.status, filters.status));
    if (filters.q) {
      const escaped = filters.q.replace(/[\\%_]/g, (char) => `\\${char}`);
      conditions.push(or(ilike(applications.roleTitle, `%${escaped}%`), ilike(companies.name, `%${escaped}%`))!);
    }
    return db
      .select(applicationColumns)
      .from(applications)
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(and(...conditions))
      .orderBy(desc(applications.updatedAt));
  },

  async findApplicationById(userId: string, id: string, dbx: DbExecutor = db) {
    const rows = await dbx
      .select(applicationColumns)
      .from(applications)
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(and(eq(applications.id, id), eq(applications.userId, userId)));
    return rows[0] ?? null;
  },

  history(userId: string, applicationId: string) {
    return db
      .select()
      .from(applicationStatusHistory)
      .where(and(eq(applicationStatusHistory.userId, userId), eq(applicationStatusHistory.applicationId, applicationId)))
      .orderBy(asc(applicationStatusHistory.changedAt));
  },

  timeline(userId: string, applicationId: string) {
    return db
      .select()
      .from(applicationTimelineEvents)
      .where(and(eq(applicationTimelineEvents.userId, userId), eq(applicationTimelineEvents.applicationId, applicationId)))
      .orderBy(desc(applicationTimelineEvents.occurredAt));
  },

  contacts(userId: string, applicationId: string) {
    return db
      .select()
      .from(applicationContacts)
      .where(and(eq(applicationContacts.userId, userId), eq(applicationContacts.applicationId, applicationId)))
      .orderBy(asc(applicationContacts.createdAt));
  },

  interviewsForApplication(userId: string, applicationId: string) {
    return db
      .select()
      .from(interviews)
      .where(and(eq(interviews.userId, userId), eq(interviews.applicationId, applicationId)))
      .orderBy(asc(interviews.startAt));
  },

  statusCounts(userId: string) {
    return db
      .select({ status: applications.status, count: sql<number>`count(*)::int` })
      .from(applications)
      .where(eq(applications.userId, userId))
      .groupBy(applications.status);
  },

  interviewsInRange(userId: string, start: Date, end: Date) {
    return db
      .select({
        id: interviews.id,
        applicationId: interviews.applicationId,
        kind: interviews.kind,
        startAt: interviews.startAt,
        endAt: interviews.endAt,
        status: interviews.status,
        companyName: companies.name,
        roleTitle: applications.roleTitle,
      })
      .from(interviews)
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(companies, eq(applications.companyId, companies.id))
      .where(
        and(
          eq(interviews.userId, userId),
          ne(interviews.status, "cancelled"),
          lte(interviews.startAt, end),
          gte(interviews.endAt, start)
        )
      )
      .orderBy(asc(interviews.startAt));
  },

  companyNames(userId: string) {
    return db
      .select({ name: companies.name })
      .from(companies)
      .where(eq(companies.userId, userId))
      .orderBy(asc(companies.name));
  },

  async findOrCreateCompany(userId: string, name: string, dbx: DbExecutor = db) {
    const lookup = () =>
      dbx
        .select()
        .from(companies)
        .where(and(eq(companies.userId, userId), sql`lower(${companies.name}) = lower(${name})`));
    const existing = await lookup();
    if (existing[0]) return existing[0];
    const [created] = await dbx.insert(companies).values({ userId, name }).onConflictDoNothing().returning();
    if (created) return created;
    return (await lookup())[0];
  },

  async insertApplication(
    dbx: DbExecutor,
    userId: string,
    values: {
      companyId: string;
      roleTitle: string;
      status: ApplicationStatus;
      location?: string;
      workMode?: WorkMode;
      jobUrl?: string;
      salaryRange?: string;
      appliedAt?: string;
      notes?: string;
    }
  ) {
    const [row] = await dbx
      .insert(applications)
      .values({ userId, ...values, jobUrl: values.jobUrl || null })
      .returning();
    return row;
  },

  async updateApplication(
    dbx: DbExecutor,
    userId: string,
    id: string,
    values: Partial<{
      companyId: string;
      roleTitle: string;
      status: ApplicationStatus;
      location: string | null;
      workMode: WorkMode | null;
      jobUrl: string | null;
      salaryRange: string | null;
      appliedAt: string | null;
      notes: string | null;
    }>
  ) {
    const rows = await dbx
      .update(applications)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning();
    return rows[0] ?? null;
  },

  async deleteApplication(userId: string, id: string) {
    const rows = await db
      .delete(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning();
    return rows[0] ?? null;
  },

  insertHistory(
    dbx: DbExecutor,
    userId: string,
    applicationId: string,
    fromStatus: ApplicationStatus | null,
    toStatus: ApplicationStatus
  ) {
    return dbx.insert(applicationStatusHistory).values({ userId, applicationId, fromStatus, toStatus });
  },

  insertTimeline(
    dbx: DbExecutor,
    userId: string,
    applicationId: string,
    type: TimelineEventType,
    title: string,
    body?: string | null
  ) {
    return dbx.insert(applicationTimelineEvents).values({ userId, applicationId, type, title, body: body ?? null });
  },

  async insertContact(
    dbx: DbExecutor,
    userId: string,
    values: { applicationId: string; name: string; role?: string; email?: string; phone?: string; linkedin?: string }
  ) {
    const [row] = await dbx.insert(applicationContacts).values({ userId, ...values }).returning();
    return row;
  },

  async deleteContact(userId: string, id: string) {
    const rows = await db
      .delete(applicationContacts)
      .where(and(eq(applicationContacts.id, id), eq(applicationContacts.userId, userId)))
      .returning();
    return rows[0] ?? null;
  },

  async findContact(userId: string, id: string, dbx: DbExecutor = db) {
    const rows = await dbx
      .select()
      .from(applicationContacts)
      .where(and(eq(applicationContacts.id, id), eq(applicationContacts.userId, userId)));
    return rows[0] ?? null;
  },

  async insertInterview(
    dbx: DbExecutor,
    userId: string,
    values: {
      applicationId: string;
      kind: InterviewKind;
      startAt: Date;
      endAt: Date;
      locationOrLink?: string;
      notes?: string;
      contactId?: string | null;
      calendarEventId: string;
    }
  ) {
    const [row] = await dbx.insert(interviews).values({ userId, ...values }).returning();
    return row;
  },

  async findInterview(userId: string, id: string, dbx: DbExecutor = db) {
    const rows = await dbx
      .select()
      .from(interviews)
      .where(and(eq(interviews.id, id), eq(interviews.userId, userId)));
    return rows[0] ?? null;
  },

  async updateInterview(
    dbx: DbExecutor,
    userId: string,
    id: string,
    values: Partial<{
      kind: InterviewKind;
      startAt: Date;
      endAt: Date;
      locationOrLink: string | null;
      notes: string | null;
      contactId: string | null;
      status: "scheduled" | "completed" | "cancelled";
      calendarEventId: string | null;
    }>
  ) {
    const rows = await dbx
      .update(interviews)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
      .returning();
    return rows[0] ?? null;
  },

  // Calendar events that back interviews (kept in the same transaction as the interview row).
  async insertCalendarEvent(
    dbx: DbExecutor,
    userId: string,
    values: { title: string; description?: string | null; location?: string | null; startAt: Date; endAt: Date }
  ) {
    const [row] = await dbx
      .insert(calendarEvents)
      .values({ userId, ...values, allDay: false, color: "violet" })
      .returning();
    return row;
  },

  updateCalendarEvent(
    dbx: DbExecutor,
    userId: string,
    id: string,
    values: { title?: string; description?: string | null; location?: string | null; startAt?: Date; endAt?: Date }
  ) {
    return dbx
      .update(calendarEvents)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)));
  },

  deleteCalendarEvent(dbx: DbExecutor, userId: string, id: string) {
    return dbx.delete(calendarEvents).where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)));
  },
};
