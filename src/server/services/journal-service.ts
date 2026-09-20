import { journalRepository } from "@/server/repositories/journal-repository";
import { addDays, currentStreak, round1 } from "@/features/health/calc";
import { countWords, docToPlainText, validateDoc } from "@/features/content/richtext";
import type { RichDoc } from "@/db/schema/content";
import type { ServiceResult } from "./article-service";

export interface JournalSummary {
  id: string;
  date: string;
  title: string | null;
  snippet: string;
  mood: number | null;
  tags: string[];
  wordCount: number;
}

export interface JournalEntryDto {
  id: string;
  date: string;
  title: string | null;
  content: RichDoc;
  mood: number | null;
  tags: string[];
  wordCount: number;
  updatedAt: string;
}

export interface JournalOverview {
  today: string;
  month: string;
  todayEntry: { id: string | null; words: number };
  monthEntries: JournalSummary[];
  list: JournalSummary[];
  listTruncated: boolean;
  stats: { monthCount: number; monthWords: number; avgMood: number | null; streak: number; total: number };
  moodSeries: { date: string; mood: number }[];
  onThisDay: JournalSummary[];
  tags: string[];
}

export interface JournalSaveInput {
  title?: string | null;
  content: RichDoc;
  mood: number | null;
  tags: string[];
}

const toSummary = (r: { id: string; date: string; title: string | null; snippet: string; mood: number | null; tags: string[]; wordCount: number }): JournalSummary => ({
  id: r.id,
  date: r.date,
  title: r.title,
  snippet: r.snippet.replace(/\s+/g, " ").trim(),
  mood: r.mood,
  tags: r.tags,
  wordCount: r.wordCount,
});

function monthBounds(month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

function derive(input: JournalSaveInput) {
  const plainText = docToPlainText(input.content);
  return {
    title: input.title?.trim() || null,
    content: input.content,
    plainText,
    wordCount: countWords(plainText),
    mood: input.mood,
    tags: input.tags,
  };
}

export const journalService = {
  async overview(userId: string, opts: { month?: string; q?: string; tag?: string; limit: number }, today: string): Promise<JournalOverview> {
    const month = opts.month ?? today.slice(0, 7);
    const { from, to } = monthBounds(month);
    const [monthRows, listRows, dates, series, onThisDay, tags, todayRow] = await Promise.all([
      journalRepository.range(userId, from, to),
      journalRepository.list(userId, { q: opts.q, tag: opts.tag, limit: opts.limit + 1 }),
      journalRepository.contentDates(userId),
      journalRepository.range(userId, addDays(today, -29), today),
      journalRepository.onThisDay(userId, today.slice(5), today),
      journalRepository.tagNames(userId),
      journalRepository.findByDate(userId, today),
    ]);
    const moods = monthRows.map((r) => r.mood).filter((m): m is number => m !== null);

    return {
      today,
      month,
      todayEntry: { id: todayRow?.id ?? null, words: todayRow?.wordCount ?? 0 },
      monthEntries: monthRows.map(toSummary),
      list: listRows.slice(0, opts.limit).map(toSummary),
      listTruncated: listRows.length > opts.limit,
      stats: {
        monthCount: monthRows.length,
        monthWords: monthRows.reduce((s, r) => s + r.wordCount, 0),
        avgMood: moods.length ? round1(moods.reduce((s, m) => s + m, 0) / moods.length) : null,
        streak: currentStreak(dates, today),
        total: dates.length,
      },
      moodSeries: series.filter((r) => r.mood !== null).map((r) => ({ date: r.date, mood: r.mood as number })),
      onThisDay: onThisDay.map(toSummary),
      tags,
    };
  },

  async entry(userId: string, id: string) {
    const row = await journalRepository.findById(userId, id);
    if (!row) return null;
    const { prev, next } = await journalRepository.adjacent(userId, row.date);
    const dto: JournalEntryDto = {
      id: row.id,
      date: row.date,
      title: row.title,
      content: row.content,
      mood: row.mood,
      tags: row.tags,
      wordCount: row.wordCount,
      updatedAt: row.updatedAt.toISOString(),
    };
    return { entry: dto, prev, next, tagNames: await journalRepository.tagNames(userId) };
  },

  async save(userId: string, id: string, input: JournalSaveInput): Promise<ServiceResult<{ updatedAt: string }>> {
    const problem = validateDoc(input.content);
    if (problem) return { ok: false, error: problem };
    const row = await journalRepository.update(userId, id, derive(input));
    if (!row) return { ok: false, error: "Entry not found" };
    return { ok: true, data: { updatedAt: row.updatedAt.toISOString() } };
  },

  // Quick capture: adds one paragraph to the end of the day's entry (creating the entry if needed).
  async appendNote(userId: string, date: string, text: string): Promise<ServiceResult<{ id: string; words: number }>> {
    const entry = await journalRepository.openDay(userId, date);
    const content = { ...entry.content, content: [...(entry.content.content ?? []), { type: "paragraph", content: [{ type: "text", text }] }] } as RichDoc;
    const problem = validateDoc(content);
    if (problem) return { ok: false, error: problem };
    const row = await journalRepository.update(userId, entry.id, derive({ title: entry.title, content, mood: entry.mood, tags: entry.tags }));
    return row ? { ok: true, data: { id: row.id, words: row.wordCount } } : { ok: false, error: "Entry not found" };
  },

  async restore(userId: string, date: string, input: JournalSaveInput) {
    const problem = validateDoc(input.content);
    if (problem) return null;
    return journalRepository.restore(userId, date, derive(input));
  },
};
