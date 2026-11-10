// Sends the owner a morning Telegram digest: interviews and events today, tasks due today, overdue
// tasks. Run daily by .github/workflows/reminders.yml.
//
//   DATABASE_URL, OWNER_EMAIL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID   (required)
//   REMINDER_TZ (default Asia/Jakarta), SITE_URL (optional link)
//   node scripts/reminders/digest.mjs [--dry-run]   (--dry-run prints instead of sending)
import { existsSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";
import { formatDigest } from "./format.mjs";

// Locally the values live in .env.local; in CI they come from repository secrets.
if (existsSync(".env.local")) config({ path: ".env.local", quiet: true });

const dryRun = process.argv.includes("--dry-run");
const { DATABASE_URL, OWNER_EMAIL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SITE_URL } = process.env;
const tz = process.env.REMINDER_TZ || "Asia/Jakarta";
const missing = ["DATABASE_URL", "OWNER_EMAIL", ...(dryRun ? [] : ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"])].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`missing: ${missing.join(", ")}`);
  process.exit(2);
}

const sql = postgres(DATABASE_URL, { max: 1, prepare: false });
try {
  const [owner] = await sql`select id from "user" where lower(email) = lower(${OWNER_EMAIL})`;
  if (!owner) throw new Error("owner not found (check OWNER_EMAIL)");

  // "Today" is the owner's day, and times are shown on their clock.
  const [{ today }] = await sql`select to_char(now() at time zone ${tz}, 'YYYY-MM-DD') as today`;
  const time = (d) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(d);
  const dateLabel = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const [tasks, interviews, events] = await Promise.all([
    sql`
      select title, due_date::text as "dueDate", priority, recurrence is not null as recurring
      from task
      where user_id = ${owner.id} and status <> 'done' and due_date <= ${today}::date
      order by due_date, created_at`,
    sql`
      select i.start_at, i.kind, i.location_or_link as "where", a.role_title as role, c.name as company
      from interview i
      join application a on a.id = i.application_id
      join company c on c.id = a.company_id
      where i.user_id = ${owner.id} and i.status = 'scheduled'
        and (i.start_at at time zone ${tz})::date = ${today}::date
      order by i.start_at`,
    // Interviews already appear above, so their linked calendar events are left out here.
    sql`
      select e.title, e.location, e.all_day, e.start_at
      from calendar_event e
      where e.user_id = ${owner.id}
        and (e.start_at at time zone ${tz})::date <= ${today}::date
        and (e.end_at at time zone ${tz})::date >= ${today}::date
        and not exists (select 1 from interview i where i.calendar_event_id = e.id)
      order by e.all_day desc, e.start_at`,
  ]);

  const text = formatDigest({
    today,
    dateLabel,
    siteUrl: SITE_URL || null,
    tasks: tasks.map((t) => ({ title: t.title, dueDate: t.dueDate, priority: t.priority, recurring: t.recurring })),
    interviews: interviews.map((i) => ({ time: time(i.start_at), role: i.role, company: i.company, kind: i.kind, where: i.where })),
    events: events.map((e) => ({ time: e.all_day ? null : time(e.start_at), title: e.title, location: e.location })),
  });

  if (dryRun) {
    console.log(text);
  } else {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    const body = await res.json().catch(() => ({}));
    // Never echo the token; Telegram's own description is enough to diagnose.
    if (!res.ok || !body.ok) throw new Error(`Telegram refused the message: ${body.description ?? res.status}`);
    console.log(`sent: ${tasks.length} task(s), ${interviews.length} interview(s), ${events.length} event(s)`);
  }
} finally {
  await sql.end();
}
