import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { applications, articles, calendarEvents, companies, journalEntries, media, projects, tasks } from "@/db/schema";

export type SearchKind = "task" | "event" | "application" | "article" | "project" | "journal" | "file";

export interface SearchHit {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const PER_KIND = 5;

const clip = (text: string, max = 80) => {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

// Searches everything the signed-in owner has, in parallel, a few hits per area. Every query is scoped by userId.
export const searchService = {
  async search(userId: string, rawQuery: string): Promise<SearchHit[]> {
    const q = rawQuery.trim().slice(0, 80).replace(/[\\%_]/g, "");
    if (q.length < 2) return [];
    const like = `%${q}%`;

    const [taskRows, eventRows, appRows, articleRows, projectRows, journalRows, fileRows] = await Promise.all([
      db
        .select({ id: tasks.id, title: tasks.title, status: tasks.status, dueDate: tasks.dueDate })
        .from(tasks)
        .where(and(eq(tasks.userId, userId), or(ilike(tasks.title, like), ilike(tasks.description, like))))
        .orderBy(desc(tasks.createdAt))
        .limit(PER_KIND),
      db
        .select({ id: calendarEvents.id, title: calendarEvents.title, startAt: calendarEvents.startAt })
        .from(calendarEvents)
        .where(and(eq(calendarEvents.userId, userId), or(ilike(calendarEvents.title, like), ilike(calendarEvents.location, like))))
        .orderBy(desc(calendarEvents.startAt))
        .limit(PER_KIND),
      db
        .select({ id: applications.id, role: applications.roleTitle, company: companies.name, status: applications.status })
        .from(applications)
        .innerJoin(companies, eq(companies.id, applications.companyId))
        .where(and(eq(applications.userId, userId), or(ilike(applications.roleTitle, like), ilike(companies.name, like))))
        .orderBy(desc(applications.createdAt))
        .limit(PER_KIND),
      db
        .select({ id: articles.id, title: articles.title, status: articles.status })
        .from(articles)
        .where(and(eq(articles.userId, userId), or(ilike(articles.title, like), ilike(articles.plainText, like))))
        .orderBy(desc(articles.updatedAt))
        .limit(PER_KIND),
      db
        .select({ id: projects.id, title: projects.title, status: projects.status, category: projects.category })
        .from(projects)
        .where(and(eq(projects.userId, userId), or(ilike(projects.title, like), ilike(projects.summary, like), ilike(projects.category, like), ilike(projects.plainText, like))))
        .orderBy(desc(projects.updatedAt))
        .limit(PER_KIND),
      db
        .select({ id: journalEntries.id, date: journalEntries.date, title: journalEntries.title, text: journalEntries.plainText })
        .from(journalEntries)
        .where(and(eq(journalEntries.userId, userId), or(ilike(journalEntries.title, like), ilike(journalEntries.plainText, like))))
        .orderBy(desc(journalEntries.date))
        .limit(PER_KIND),
      db
        .select({ id: media.id, name: media.originalName, kind: media.kind })
        .from(media)
        .where(and(eq(media.userId, userId), eq(media.status, "ready"), ilike(media.originalName, like)))
        .orderBy(desc(media.createdAt))
        .limit(PER_KIND),
    ]);

    const hits: SearchHit[] = [];
    for (const t of taskRows) {
      hits.push({ kind: "task", id: t.id, title: t.title, subtitle: `Task · ${t.status === "done" ? "done" : t.dueDate ? `due ${t.dueDate}` : "open"}`, href: `/me/tasks?status=all&q=${encodeURIComponent(t.title.slice(0, 100))}` });
    }
    for (const e of eventRows) {
      hits.push({ kind: "event", id: e.id, title: e.title, subtitle: `Event · ${e.startAt.toISOString().slice(0, 10)}`, href: "/me/calendar" });
    }
    for (const a of appRows) {
      hits.push({ kind: "application", id: a.id, title: `${a.role} — ${a.company}`, subtitle: `Application · ${a.status}`, href: `/me/career/applications/${a.id}` });
    }
    for (const a of articleRows) {
      hits.push({ kind: "article", id: a.id, title: a.title || "Untitled article", subtitle: `Article · ${a.status}`, href: `/me/articles/${a.id}` });
    }
    for (const p of projectRows) {
      hits.push({ kind: "project", id: p.id, title: p.title || "Untitled project", subtitle: `Project · ${p.status}${p.category ? ` · ${p.category}` : ""}`, href: `/me/projects/${p.id}` });
    }
    for (const j of journalRows) {
      hits.push({ kind: "journal", id: j.id, title: j.title || clip(j.text, 60) || j.date, subtitle: `Journal · ${j.date}`, href: `/me/journal/${j.id}` });
    }
    for (const f of fileRows) {
      hits.push({ kind: "file", id: f.id, title: f.name, subtitle: `${f.kind === "image" ? "Image" : "Document"} · Media`, href: "/me/media" });
    }
    return hits;
  },
};
