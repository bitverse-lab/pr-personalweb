import { db } from "@/db";
import { careerRepository as repo } from "@/server/repositories/career-repository";
import type { ApplicationStatus } from "@/db/schema/career";
import type {
  ApplicationFilters,
  ContactInput,
  CreateApplicationInput,
  InterviewInput,
  UpdateApplicationInput,
  UpdateInterviewInput,
} from "@/features/career/schema";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const blankToNull = (value: string | undefined) => (value === undefined ? undefined : value.trim() || null);

export const careerService = {
  getApplications(userId: string, filters: ApplicationFilters) {
    return repo.findApplications(userId, filters);
  },

  async getDetail(userId: string, id: string) {
    const application = await repo.findApplicationById(userId, id);
    if (!application) return null;
    const [history, timeline, contacts, interviews] = await Promise.all([
      repo.history(userId, id),
      repo.timeline(userId, id),
      repo.contacts(userId, id),
      repo.interviewsForApplication(userId, id),
    ]);
    return { application, history, timeline, contacts, interviews };
  },

  statusCounts(userId: string) {
    return repo.statusCounts(userId);
  },

  getInterviews(userId: string, start: Date, end: Date) {
    return repo.interviewsInRange(userId, start, end);
  },

  companyNames(userId: string) {
    return repo.companyNames(userId);
  },

  // Company (find-or-create) + application + first history row + "created" timeline event, atomically.
  createApplication(userId: string, input: CreateApplicationInput) {
    return db.transaction(async (tx) => {
      const company = await repo.findOrCreateCompany(userId, input.companyName, tx);
      const appliedAt = input.appliedAt ?? (input.status === "applied" ? new Date().toISOString().slice(0, 10) : undefined);
      const application = await repo.insertApplication(tx, userId, {
        companyId: company.id,
        roleTitle: input.roleTitle,
        status: input.status,
        location: input.location || undefined,
        workMode: input.workMode,
        jobUrl: input.jobUrl || undefined,
        salaryRange: input.salaryRange || undefined,
        appliedAt,
        notes: input.notes || undefined,
      });
      await repo.insertHistory(tx, userId, application.id, null, input.status);
      await repo.insertTimeline(
        tx,
        userId,
        application.id,
        "created",
        `Added to ${STATUS_LABEL[input.status]}`,
        `${input.roleTitle} at ${company.name}`
      );
      return application;
    });
  },

  updateApplication(userId: string, input: UpdateApplicationInput) {
    return db.transaction(async (tx) => {
      const current = await repo.findApplicationById(userId, input.id, tx);
      if (!current) return null;
      const company = input.companyName ? await repo.findOrCreateCompany(userId, input.companyName, tx) : null;
      return repo.updateApplication(tx, userId, input.id, {
        ...(company && { companyId: company.id }),
        ...(input.roleTitle !== undefined && { roleTitle: input.roleTitle }),
        ...(input.location !== undefined && { location: blankToNull(input.location) }),
        ...(input.workMode !== undefined && { workMode: input.workMode }),
        ...(input.jobUrl !== undefined && { jobUrl: blankToNull(input.jobUrl) }),
        ...(input.salaryRange !== undefined && { salaryRange: blankToNull(input.salaryRange) }),
        ...(input.appliedAt !== undefined && { appliedAt: input.appliedAt }),
        ...(input.notes !== undefined && { notes: blankToNull(input.notes) }),
      });
    });
  },

  // Status update + history row + timeline event, atomically. Same-status change is a no-op.
  changeStatus(userId: string, id: string, status: ApplicationStatus) {
    return db.transaction(async (tx) => {
      const current = await repo.findApplicationById(userId, id, tx);
      if (!current) return null;
      if (current.status === status) return current;
      const appliedAt =
        status === "applied" && !current.appliedAt ? new Date().toISOString().slice(0, 10) : undefined;
      const updated = await repo.updateApplication(tx, userId, id, {
        status,
        ...(appliedAt && { appliedAt }),
      });
      await repo.insertHistory(tx, userId, id, current.status, status);
      await repo.insertTimeline(
        tx,
        userId,
        id,
        "status_changed",
        `Moved to ${STATUS_LABEL[status]}`,
        `From ${STATUS_LABEL[current.status]}`
      );
      return updated;
    });
  },

  deleteApplication(userId: string, id: string) {
    return repo.deleteApplication(userId, id);
  },

  async addNote(userId: string, applicationId: string, body: string) {
    const application = await repo.findApplicationById(userId, applicationId);
    if (!application) return null;
    await repo.insertTimeline(db, userId, applicationId, "note", "Note", body);
    return application;
  },

  addContact(userId: string, input: ContactInput) {
    return db.transaction(async (tx) => {
      const application = await repo.findApplicationById(userId, input.applicationId, tx);
      if (!application) return null;
      const contact = await repo.insertContact(tx, userId, {
        applicationId: input.applicationId,
        name: input.name,
        role: input.role || undefined,
        email: input.email || undefined,
        phone: input.phone || undefined,
        linkedin: input.linkedin || undefined,
      });
      await repo.insertTimeline(tx, userId, input.applicationId, "contact_added", `Added contact: ${contact.name}`, contact.role);
      return contact;
    });
  },

  deleteContact(userId: string, id: string) {
    return repo.deleteContact(userId, id);
  },

  // Interview + backing calendar event + timeline event, atomically.
  createInterview(userId: string, input: InterviewInput) {
    return db.transaction(async (tx) => {
      const application = await repo.findApplicationById(userId, input.applicationId, tx);
      if (!application) return null;
      if (input.contactId && !(await repo.findContact(userId, input.contactId, tx))) return null;
      const startAt = new Date(input.start);
      const endAt = new Date(input.end);
      const event = await repo.insertCalendarEvent(tx, userId, {
        title: `Interview: ${application.companyName} — ${application.roleTitle}`,
        description: input.notes || null,
        location: input.locationOrLink || null,
        startAt,
        endAt,
      });
      const interview = await repo.insertInterview(tx, userId, {
        applicationId: input.applicationId,
        kind: input.kind,
        startAt,
        endAt,
        locationOrLink: input.locationOrLink || undefined,
        notes: input.notes || undefined,
        contactId: input.contactId ?? null,
        calendarEventId: event.id,
      });
      await repo.insertTimeline(
        tx,
        userId,
        input.applicationId,
        "interview_scheduled",
        `${input.kind} interview scheduled`,
        startAt.toISOString()
      );
      return interview;
    });
  },

  // Reschedule: interview row and its calendar event move together.
  updateInterview(userId: string, input: UpdateInterviewInput) {
    return db.transaction(async (tx) => {
      const current = await repo.findInterview(userId, input.id, tx);
      if (!current) return null;
      const application = await repo.findApplicationById(userId, current.applicationId, tx);
      if (!application) return null;
      const startAt = new Date(input.start);
      const endAt = new Date(input.end);
      const updated = await repo.updateInterview(tx, userId, input.id, {
        ...(input.kind && { kind: input.kind }),
        startAt,
        endAt,
        ...(input.locationOrLink !== undefined && { locationOrLink: blankToNull(input.locationOrLink) }),
        ...(input.notes !== undefined && { notes: blankToNull(input.notes) }),
        ...(input.contactId !== undefined && { contactId: input.contactId }),
      });
      if (current.calendarEventId) {
        await repo.updateCalendarEvent(tx, userId, current.calendarEventId, {
          startAt,
          endAt,
          ...(input.locationOrLink !== undefined && { location: blankToNull(input.locationOrLink) }),
          ...(input.notes !== undefined && { description: blankToNull(input.notes) }),
        });
      }
      return updated;
    });
  },

  cancelInterview(userId: string, id: string) {
    return db.transaction(async (tx) => {
      const current = await repo.findInterview(userId, id, tx);
      if (!current) return null;
      const updated = await repo.updateInterview(tx, userId, id, { status: "cancelled", calendarEventId: null });
      if (current.calendarEventId) await repo.deleteCalendarEvent(tx, userId, current.calendarEventId);
      await repo.insertTimeline(tx, userId, current.applicationId, "interview_cancelled", `${current.kind} interview cancelled`);
      return updated;
    });
  },

  completeInterview(userId: string, id: string) {
    return db.transaction(async (tx) => {
      const current = await repo.findInterview(userId, id, tx);
      if (!current) return null;
      const updated = await repo.updateInterview(tx, userId, id, { status: "completed" });
      await repo.insertTimeline(tx, userId, current.applicationId, "interview_completed", `${current.kind} interview completed`);
      return updated;
    });
  },
};
