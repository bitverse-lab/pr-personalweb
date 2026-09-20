"""Generates docs/jira-backlog.csv for importing the project's work items into Jira.

Run from the project root:  python docs/build_jira_csv.py
Columns: Issue Id, Issue Type, Summary, Description, Status, Priority, Labels, Parent (Issue Id of the epic).
"""
import csv
from collections import Counter

D, P, T = "Done", "In Progress", "To Do"

# (id, name, description, label)
EPICS = [
    (1, "Foundation & authentication", "Project setup, database, and owner-only Google sign-in.", "foundation"),
    (2, "Tasks & Calendar", "Task management and calendar in the private workspace.", "productivity"),
    (3, "Career tracking", "Job application pipeline, contacts, interviews, documents.", "career"),
    (4, "Health & fitness", "Weight, nutrition, workouts, body measurements, goals, dashboard.", "health"),
    (5, "Content: articles, journal, projects", "Rich-text editor and publishing workflows.", "content"),
    (6, "Profile, CV & media", "Profile editor, CV page/PDF, file uploads.", "profile"),
    (7, "Public website", "The portfolio site visitors see: contact, SEO, privacy, accessibility.", "public"),
    (8, "Workspace experience", "Overview, quick capture, global search, settings, export.", "workspace"),
    (9, "Security & quality", "Hardening, tests, validation, dependency risk.", "quality"),
    (10, "Deployment & operations", "Version control, CI, migrations, hosting, monitoring.", "ops"),
    (11, "Future enhancements", "Nice-to-have features deliberately postponed.", "backlog"),
]

# (epic id, summary, description, status, priority)
ITEMS = [
    (1, "Set up Next.js 14 + TypeScript + Drizzle ORM + Supabase", "App Router project, PostgreSQL schema management, pooled and session connection strings.", D, "High"),
    (1, "Google OAuth sign-in restricted to the owner", "NextAuth v5, JWT sessions, OWNER_EMAIL gate, /me protected by middleware.", D, "High"),
    (1, "Adopt the Fronter template for the public pages", "Bootstrap/SCSS pages: home, about, CV, projects, articles, contact.", D, "Medium"),
    (2, "Task CRUD with priority, tags, due dates and undo", "Server actions, ownership checks, toasts with Undo.", D, "High"),
    (2, "Calendar with drag-and-drop scheduling and event colors", "FullCalendar month/week/day, edit dialog, drag tasks onto the calendar.", D, "High"),
    (2, "Kanban board, subtasks/checklists and task search", "Drag between columns, progress, keyboard shortcuts.", D, "Medium"),
    (2, "Productivity heatmap, trend chart and stat tiles", "Completed-tasks activity visualizations on the overview.", D, "Low"),
    (3, "Application pipeline board and list", "Wishlist to Offer stages, drag between stages, filters.", D, "High"),
    (3, "Application workspace: timeline, contacts, interviews", "Interviews sync to the calendar; status history.", D, "High"),
    (3, "Private application documents", "Attach CV/cover letter/offer files, signed 60-second downloads.", D, "Medium"),
    (4, "Weight tracking with weekly/monthly averages", "Trend chart with 7-day average and target line, BMI, goal progress.", D, "High"),
    (4, "Nutrition and water tracking", "Food library (Indonesian staples), meals, macros, copy-yesterday, water tracker.", D, "High"),
    (4, "Workout logger, routines and personal records", "Sets/reps/kg, rest timer, previous-performance hints, PR badges, exercise library.", D, "High"),
    (4, "Body measurements, goals and TDEE calculator", "Measurement charts; calorie/macro suggestions from goals.", D, "Medium"),
    (4, "Health overview dashboard", "Today, weekly trends and streaks in one place.", D, "Medium"),
    (5, "Rich-text editor (Tiptap) with autosave", "Validated JSON storage, image upload, safe renderer without raw HTML.", D, "High"),
    (5, "Articles: draft, publish, archive, SEO, RSS", "Public articles from the database with table of contents, sharing, prev/next.", D, "High"),
    (5, "Journal with mood, calendar, streak and prompts", "Daily entries, search, tags, on-this-day.", D, "Medium"),
    (5, "Projects portfolio (case studies, gallery, filters)", "Database-driven projects with cover/gallery, search and technology filter.", D, "High"),
    (5, "Testimonials managed from the workspace", "Publish/hide, reorder, shown on the home page.", D, "Low"),
    (6, "Profile & CV editor", "Experience, education, skills, links, photo, availability status.", D, "High"),
    (6, "Public CV page and generated PDF download", "PDF built from the same data so it never goes stale.", D, "High"),
    (6, "Media library on Supabase Storage", "Signed uploads, real file-type verification, usage tracking.", D, "High"),
    (7, "Contact form with /me inbox and spam protection", "Honeypot, timing, rate limit, hashed IPs; optional email via Resend.", D, "High"),
    (7, "Dynamic navbar/footer, neutral placeholder state, no template leftovers", "Site name, links and menu items follow the profile.", D, "High"),
    (7, "SEO: sitemap, robots, canonical, JSON-LD, RSS, social preview", "Static default preview image and favicon.", D, "Medium"),
    (7, "Privacy notice, custom 404/error pages, reduced-motion support", "The notice mirrors the real configuration.", D, "Medium"),
    (7, "Accessibility pass: labels, landmarks, focus ring, contrast", "One h1 per page, skip links, AA colors, jsx-a11y lint.", D, "Medium"),
    (8, "Overview quick capture and setup checklist", "Task, weight, meal, water, note, job lead from one bar; press c to focus.", D, "High"),
    (8, "Global search and command palette (Ctrl+K)", "Search across tasks, events, applications, articles, projects, journal, files.", D, "Medium"),
    (8, "Account and Data settings with JSON export", "Full data export without login tokens.", D, "Medium"),
    (9, "Security headers, input validation and ownership checks", "Zod on every action, userId scoping; CSP not yet enabled.", D, "High"),
    (9, "Unit tests (67) and environment validation", "Vitest for calculations, validation, upload rules and env.", D, "Medium"),
    (9, "Mitigate known dependency advisories", "Image optimizer disabled, prototype-pollution guard, PostCSS override.", D, "High"),
    (10, "Prepare release: initial commit, GitHub Actions CI, DB migrations", "Repository has no commits yet; replace db:push with tracked migrations for production.", P, "Highest"),
    (10, "End-to-end manual test in the browser (desktop and phone)", "Owner test round, including the still-unverified 'newer article' link on article pages.", P, "Highest"),
    (10, "Fill in real content", "Profile & CV, photo, first project, first article, testimonials.", P, "High"),
    (10, "Deploy to Vercel", "Environment variables, Google OAuth redirect URI, SITE_URL, run migrations, verify robots/sitemap.", T, "Highest"),
    (10, "Add error monitoring (e.g. Sentry)", "Know about production errors; keep personal data out of reports.", T, "Medium"),
    (10, "Scheduled backups for database and storage buckets", "Both are needed for a real restore; verify a restore once.", T, "High"),
    (9, "Playwright end-to-end tests", "Cover public pages, the contact form and a signed-in flow.", T, "High"),
    (9, "Permanent integration tests for services and repositories", "Turn the throwaway database checks into tests against a test database.", T, "Medium"),
    (9, "Upgrade to Next.js 15+", "The only fix for the remaining Next 14 advisories; requires React 19 compatibility checks.", T, "High"),
    (9, "Add a Content-Security-Policy (report-only first)", "Needs tuning for the template's inline styles.", T, "Medium"),
    (9, "Screen-reader audit (NVDA/VoiceOver) and automated axe checks", "Only static and lint checks are done so far.", T, "Medium"),
    (7, "Optimize uploaded images (thumbnails / responsive sizes)", "Galleries currently load full-size images.", T, "Medium"),
    (11, "Reminders and notifications", "Due tasks, interviews, workout schedule.", T, "Medium"),
    (11, "Installable PWA with offline quick capture", "Log workouts and notes with poor connectivity.", T, "Medium"),
    (11, "Recurring tasks/events and Google Calendar sync", "Deferred by the original spec.", T, "Low"),
    (11, "Dark mode for the workspace", "The public site is already prepared for it.", T, "Low"),
    (11, "Indonesian/English language switch", "Only if targeting local recruiters.", T, "Low"),
    (11, "Scheduled publishing and revision history for articles", "Deferred by the original spec.", T, "Low"),
    (11, "Skeleton loaders and keyboard shortcut cheat sheet", "UX polish for the workspace.", T, "Low"),
]

rows = []
n = 0
epic_row_id = {}
labels = {}
for eid, name, desc, label in EPICS:
    n += 1
    epic_row_id[eid] = n
    labels[eid] = label
    mine = [status for e, _, _, status, _ in ITEMS if e == eid]
    if P in mine:
        status = P
    elif all(s == D for s in mine):
        status = D
    else:
        status = T
    rows.append([n, "Epic", name, desc, status, "Medium", label, ""])

for eid, summary, desc, status, prio in ITEMS:
    n += 1
    rows.append([n, "Task", summary, desc, status, prio, labels[eid], epic_row_id[eid]])

with open("docs/jira-backlog.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)
    writer.writerow(["Issue Id", "Issue Type", "Summary", "Description", "Status", "Priority", "Labels", "Parent"])
    writer.writerows(rows)

tasks = Counter(r[4] for r in rows if r[1] == "Task")
print("tasks by status:", dict(tasks), "| epics:", len(EPICS), "| rows:", len(rows))
