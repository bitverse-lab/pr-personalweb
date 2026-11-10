// Builds the morning Telegram message. Pure: no database, no network, so it is unit-tested.

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const PRIORITY = { high: " ‼️", medium: " ❗", low: "" };

function daysLate(due, today) {
  const ms = Date.UTC(...today.split("-").map((n, i) => (i === 1 ? n - 1 : +n))) - Date.UTC(...due.split("-").map((n, i) => (i === 1 ? n - 1 : +n)));
  return Math.round(ms / 86_400_000);
}

/**
 * @param {{
 *   today: string,                 // "YYYY-MM-DD" in the owner's timezone
 *   dateLabel: string,             // "Tuesday, 10 November"
 *   tasks: { title: string, dueDate: string, priority: string | null, recurring: boolean }[],
 *   interviews: { time: string, role: string, company: string, kind: string, where: string | null }[],
 *   events: { time: string | null, title: string, location: string | null }[],
 *   openWorkouts?: { name: string, since: string }[],
 *   siteUrl?: string | null,
 * }} input
 * @returns {string} Telegram HTML
 */
export function formatDigest({ today, dateLabel, tasks, interviews, events, siteUrl, openWorkouts = [] }) {
  const overdue = tasks.filter((t) => t.dueDate < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const dueToday = tasks.filter((t) => t.dueDate === today);
  const lines = [`☀️ <b>${esc(dateLabel)}</b>`];

  if (!overdue.length && !dueToday.length && !interviews.length && !events.length && !openWorkouts.length) {
    lines.push("", "Nothing due and nothing scheduled today. ✅");
    return lines.join("\n");
  }

  const task = (t) => `• ${esc(t.title)}${PRIORITY[t.priority] ?? ""}${t.recurring ? " 🔁" : ""}`;
  if (interviews.length) {
    lines.push("", `🎯 <b>Interviews</b>`);
    for (const i of interviews) lines.push(`• ${esc(i.time)} — ${esc(i.role)} at ${esc(i.company)} (${esc(i.kind)})${i.where ? `\n   ${esc(i.where)}` : ""}`);
  }
  if (events.length) {
    lines.push("", `📅 <b>Today</b>`);
    for (const e of events) lines.push(`• ${e.time ? `${esc(e.time)} — ` : ""}${esc(e.title)}${e.location ? ` · ${esc(e.location)}` : ""}`);
  }
  if (dueToday.length) {
    lines.push("", `✅ <b>Due today (${dueToday.length})</b>`);
    for (const t of dueToday) lines.push(task(t));
  }
  if (overdue.length) {
    lines.push("", `⚠️ <b>Overdue (${overdue.length})</b>`);
    // A long backlog would bury today's list; show the oldest few and say how many more.
    for (const t of overdue.slice(0, 8)) lines.push(`${task(t)} <i>(${daysLate(t.dueDate, today)}d)</i>`);
    if (overdue.length > 8) lines.push(`… and ${overdue.length - 8} more`);
  }
  for (const w of openWorkouts) lines.push("", `🏋️ <b>${esc(w.name)}</b> is still open since ${esc(w.since)}. Finish it in Health → Workouts.`);
  if (siteUrl) lines.push("", `<a href="${esc(siteUrl.replace(/\/$/, ""))}/me/tasks">Open Tasks</a>`);
  return lines.join("\n");
}
