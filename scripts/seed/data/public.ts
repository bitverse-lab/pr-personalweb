import type {
  articles,
  articleTags,
  contactMessages,
  educations,
  experiences,
  media,
  profileHighlights,
  projectLinks,
  projectMedia,
  projects,
  skills,
  socialLinks,
  tags,
  testimonials,
} from "../../../src/db/schema";
import { utcDaysFrom } from "../dates";
import { DEMO_KEY_PREFIX, demoId } from "../ids";
import { derived, doc, type Block } from "./doc";

type Row<T extends { $inferInsert: unknown }> = T["$inferInsert"];

export interface MediaSeed {
  /** `sizeBytes` is filled by the seed runner from the real PNG bytes. */
  row: Row<typeof media> & { id: string; storageKey: string };
  png: { width: number; height: number; seed: number };
}

export type PositionKey = "experience" | "education" | "skill" | "socialLink" | "project" | "testimonial" | "highlight";

/** What the owner already has, so demo rows sit after theirs and never collide with their unique keys. */
export interface PublicContext {
  /** Highest existing `position` per list; demo rows start at max + 1. */
  positions: Partial<Record<PositionKey, number>>;
  projectSlugs: Set<string>;
  articleSlugs: Set<string>;
  /** lower(name) → id of the owner's existing tags; reused instead of creating a duplicate. */
  tagIds: Map<string, string>;
}

export const emptyPublicContext = (): PublicContext => ({ positions: {}, projectSlugs: new Set(), articleSlugs: new Set(), tagIds: new Map() });

export interface PublicSeed {
  media: MediaSeed[];
  experiences: (Row<typeof experiences> & { id: string })[];
  educations: (Row<typeof educations> & { id: string })[];
  skills: (Row<typeof skills> & { id: string })[];
  socialLinks: (Row<typeof socialLinks> & { id: string })[];
  highlights: (Row<typeof profileHighlights> & { id: string })[];
  projects: (Row<typeof projects> & { id: string })[];
  projectLinks: (Row<typeof projectLinks> & { id: string })[];
  projectMedia: (Row<typeof projectMedia> & { id: string })[];
  tags: (Row<typeof tags> & { id: string })[];
  articles: (Row<typeof articles> & { id: string })[];
  articleTags: Row<typeof articleTags>[];
  testimonials: (Row<typeof testimonials> & { id: string })[];
  contactMessages: (Row<typeof contactMessages> & { id: string })[];
}

// ---------------------------------------------------------------- content

const EXPERIENCES = [
  { company: "Nusantara Data Labs", role: "Full Stack Engineer", location: "Surabaya · Hybrid", start: "2025-02-01", end: null, description: "Build internal analytics products for agriculture cooperatives across East Java.", achievements: ["Cut the weekly reporting run from 6 hours to 12 minutes by moving it to incremental SQL", "Shipped a yield-forecast service used by 40+ cooperatives", "Mentor two junior developers on code review and testing"] },
  { company: "Telkom University · Research Lab", role: "Head of IT Support and Research", location: "Bandung", start: "2023-03-01", end: "2025-01-31", description: "Ran the lab's infrastructure and led student research engineering.", achievements: ["Led a team of 4 developers delivering the lab asset tracker", "Co-authored 3 IEEE conference papers on applied ML"] },
  { company: "Telkom University", role: "Lecturer Assistant · Database Systems", location: "Bandung", start: "2022-08-01", end: "2023-06-30", description: "Taught weekly SQL labs and graded projects for 120 students.", achievements: ["Rewrote the lab module around PostgreSQL and real datasets"] },
  { company: "CV Klinik Sehat Trenggalek", role: "Freelance Web Developer", location: "Trenggalek · Remote", start: "2021-06-01", end: "2022-07-31", description: "Built a queue and patient-records system for a regional clinic.", achievements: ["Registered as intellectual property (HKI)", "Reduced average waiting time at reception by 35%"] },
];

const EDUCATIONS = [
  { school: "Telkom University", degree: "Bachelor of Applied Science", field: "Information Technology", start: "2019-08-01", end: "2023-08-31", description: "GPA 3.92 / 4.00, Summa Cum Laude. Thesis on Indonesian-language sentiment models." },
  { school: "SMA Negeri 1 Trenggalek", degree: "High School", field: "Natural Sciences", start: "2016-07-01", end: "2019-05-31", description: null },
];

// The hero console's profile.sql rows (owner-editable in Profile & CV → Highlights).
const HIGHLIGHTS: [string, string, string][] = [
  ["gpa", "3.92 /4.00", "Summa Cum Laude, Telkom University"],
  ["ip_rights", "6 HKI", "Registered intellectual property from systems I built"],
  ["publications", "3 IEEE + 2", "Peer-reviewed research papers"],
  ["team_led", "3–4 devs", "Led teams shipping to real clients"],
];

const SKILLS: [string, string, number][] = [
  ["PostgreSQL", "Data", 90], ["MySQL", "Data", 85], ["SQL", "Data", 92], ["Pandas", "Data", 85],
  ["Node.js", "API", 85], ["Laravel", "API", 88], ["FastAPI", "API", 82], ["REST API design", "API", 88],
  ["React", "UI", 88], ["Next.js", "UI", 86], ["TypeScript", "UI", 85], ["Bootstrap", "UI", 80],
  ["PyTorch", "ML", 78], ["TensorFlow", "ML", 74], ["scikit-learn", "ML", 84], ["LangChain", "ML", 72],
  ["Docker", "Ops", 80], ["GitHub Actions", "Ops", 76],
];

interface ProjectContent {
  key: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  client: string | null;
  role: string;
  location: string;
  start: string;
  end: string | null;
  technologies: string[];
  status: "published" | "draft" | "archived";
  featured: boolean;
  publishedDaysAgo: number | null;
  links: [string, string][];
  gallery: string[];
  body: Block[];
}

const PROJECTS: ProjectContent[] = [
  {
    key: "yield", title: "Rice Yield Forecasting for East Java Cooperatives", slug: "rice-yield-forecasting",
    summary: "A forecasting service and dashboard that tells cooperative managers how much rice to expect, three weeks before harvest.",
    category: "Data & ML", client: "Nusantara Data Labs", role: "Lead engineer", location: "East Java", start: "2025-03-01", end: null,
    technologies: ["PostgreSQL", "FastAPI", "Next.js", "PyTorch", "Docker"], status: "published", featured: true, publishedDaysAgo: 20,
    links: [["Live demo", "https://example.com/yield"], ["Write-up", "https://example.com/yield-notes"]],
    gallery: ["Cooperative dashboard", "Forecast vs actual, 2025 season"],
    body: [
      ["h2", "Problem"], ["p", "Cooperatives sold rice forward without knowing what the harvest would bring, so they either over-committed or left money on the table."],
      ["h2", "My role"], ["p", "I owned the system end to end: the schema, the ingestion jobs, the API, the dashboard and the model in production."],
      ["h2", "What I built"], ["ul", ["Nightly ingestion of rainfall and planting records into PostgreSQL", "A gradient-boosted baseline, then a small PyTorch model that beat it by 18% MAPE", "A FastAPI service with versioned models and a Next.js dashboard for managers"]],
      ["h2", "Outcome"], ["p", "Forecasts arrive three weeks before harvest with a median error of 7%. Forty cooperatives use it every week."],
    ],
  },
  {
    key: "assets", title: "Campus Lab Asset Tracker", slug: "campus-lab-asset-tracker",
    summary: "Loan, maintenance and audit tracking for 1,200 lab devices, built with a team of four.",
    category: "Web application", client: "Telkom University", role: "Team lead", location: "Bandung", start: "2023-04-01", end: "2024-02-28",
    technologies: ["Laravel", "MySQL", "React", "Docker"], status: "published", featured: false, publishedDaysAgo: 120,
    links: [["Case study", "https://example.com/assets"]], gallery: [],
    body: [
      ["h2", "Problem"], ["p", "Lab equipment was tracked in spreadsheets; audits took a week and devices went missing between semesters."],
      ["h2", "What we built"], ["ul", ["QR-based check-in and check-out", "Maintenance schedules with reminders", "An audit view that reconciles in minutes"]],
      ["h2", "Outcome"], ["p", "Audit time dropped from five days to one afternoon. The system is registered as intellectual property (HKI)."],
    ],
  },
  {
    key: "sentiment", title: "Indonesian Review Sentiment API", slug: "indonesian-review-sentiment-api",
    summary: "A fine-tuned IndoBERT model behind a small API that classifies product reviews in Bahasa Indonesia.",
    category: "Machine learning", client: null, role: "Researcher & engineer", location: "Remote", start: "2022-09-01", end: "2023-06-30",
    technologies: ["PyTorch", "FastAPI", "PostgreSQL"], status: "published", featured: false, publishedDaysAgo: 210,
    links: [["Paper (IEEE)", "https://example.com/paper"], ["Source", "https://github.com/example/sentiment"]], gallery: [],
    body: [
      ["h2", "Problem"], ["p", "Off-the-shelf sentiment models misread Indonesian slang and mixed-language reviews."],
      ["h2", "Approach"], ["p", "I labelled 2,000 marketplace reviews, fine-tuned IndoBERT and served it behind FastAPI with request batching."],
      ["code", "POST /v1/sentiment  {\"text\": \"barangnya mantap, pengiriman lama\"}"],
      ["h2", "Outcome"], ["p", "F1 of 0.89 against 0.71 for the baseline. Published at an IEEE conference."],
    ],
  },
  {
    key: "village", title: "Village Fund Transparency Dashboard", slug: "village-fund-dashboard",
    summary: "Making village budget spending readable for residents.", category: "Civic tech", client: null, role: "Solo developer",
    location: "Trenggalek", start: "2026-08-01", end: null, technologies: ["Next.js", "PostgreSQL"], status: "draft", featured: false, publishedDaysAgo: null,
    links: [], gallery: [],
    body: [["h2", "Work in progress"], ["p", "Early prototype that turns village budget PDFs into a searchable dashboard residents can understand."]],
  },
  {
    key: "thesis", title: "Thesis Archive Search", slug: "thesis-archive-search",
    summary: "Full-text search over 8,000 undergraduate theses. Superseded by the university's new repository.", category: "Web application",
    client: "Telkom University", role: "Developer", location: "Bandung", start: "2021-02-01", end: "2021-07-31", technologies: ["Laravel", "MySQL"],
    status: "archived", featured: false, publishedDaysAgo: 600, links: [], gallery: [],
    body: [["h2", "Archived"], ["p", "Built during my second year to make the thesis archive searchable by abstract. Retired when the library moved to a new platform."]],
  },
];

interface ArticleContent {
  key: string;
  title: string;
  slug: string;
  excerpt: string;
  status: "published" | "draft" | "archived";
  publishedDaysAgo: number | null;
  tags: string[];
  body: Block[];
}

const ARTICLES: ArticleContent[] = [
  {
    key: "fastapi", title: "Serving a PyTorch model behind Next.js without a GPU", slug: "pytorch-model-behind-nextjs-without-gpu",
    excerpt: "How a small CPU box handles our forecast traffic, and the three settings that mattered.", status: "published", publishedDaysAgo: 6,
    tags: ["Machine Learning", "FastAPI", "Next.js"],
    body: [["p", "Our forecast model runs on a two-core CPU instance and answers in under 80 ms. Here is what made that possible."], ["h2", "Batch small, batch often"], ["p", "Micro-batching requests for 10 ms gave us four times the throughput with no visible latency cost."], ["h2", "Export once"], ["p", "TorchScript removed Python overhead from the hot path and halved cold-start time."], ["ul", ["Pin threads to cores", "Warm the model on boot", "Cache by input hash"]]],
  },
  {
    key: "indexes", title: "The Postgres indexes I add on day one", slug: "postgres-indexes-day-one",
    excerpt: "Every table I create gets the same three questions before it gets data.", status: "published", publishedDaysAgo: 27,
    tags: ["PostgreSQL", "Backend"],
    body: [["p", "Most slow queries I have fixed were missing an index that the access pattern made obvious on day one."], ["h2", "Owner first"], ["p", "In multi-tenant tables, every query filters by owner. Lead the index with it."], ["code", "create index on project (user_id, status);"], ["h2", "Order by what you sort"], ["p", "If a list is always newest first, the index should say so."]],
  },
  {
    key: "queues", title: "Why my Laravel queue stopped dropping jobs", slug: "laravel-queue-dropping-jobs",
    excerpt: "A timeout shorter than the retry window, and how we found it.", status: "published", publishedDaysAgo: 52,
    tags: ["Laravel", "Backend"],
    body: [["p", "For two weeks a small share of report jobs disappeared without an error."], ["h2", "The cause"], ["p", "The worker timeout was shorter than retry_after, so a slow job was picked up twice and the second copy failed silently."], ["h2", "The fix"], ["ul", ["timeout below retry_after", "Idempotent job keys", "An alert on failed_jobs growth"]]],
  },
  {
    key: "indobert", title: "Evaluating IndoBERT on 2,000 marketplace reviews", slug: "evaluating-indobert-marketplace-reviews",
    excerpt: "What fine-tuning bought us over a strong baseline, and where it still fails.", status: "published", publishedDaysAgo: 84,
    tags: ["Machine Learning", "NLP"],
    body: [["p", "Fine-tuning moved F1 from 0.71 to 0.89. The remaining errors are almost all sarcasm."], ["h2", "Data"], ["p", "2,000 reviews, labelled twice, disagreements resolved by a third reader."], ["quote", "Labelling guidelines mattered more than model size."]],
  },
  {
    key: "drizzle", title: "Notes on moving to Drizzle migrations", slug: "notes-drizzle-migrations",
    excerpt: "Draft: what changes when the schema is TypeScript.", status: "draft", publishedDaysAgo: null, tags: ["Backend"],
    body: [["p", "Draft notes. Push-based schema changes were fast to start with; production needs reviewable migrations."]],
  },
  {
    key: "xampp", title: "Setting up a PHP stack on Windows in 2021", slug: "php-stack-windows-2021",
    excerpt: "Archived: an old setup guide kept for reference.", status: "archived", publishedDaysAgo: 700, tags: ["Backend"],
    body: [["p", "This guide is out of date and kept only for reference."]],
  },
];

const TESTIMONIALS = [
  { quote: "Verindra took our forecast idea from a spreadsheet to a service managers rely on every week. He asks the right questions before he writes code.", authorName: "Rina Kusumawati", authorRole: "Head of Product", company: "Nusantara Data Labs", published: true },
  { quote: "He led four students through a real deployment and still had time to document everything. The lab still runs on it.", authorName: "Dr. Agus Prasetyo", authorRole: "Lab Supervisor", company: "Telkom University", published: true },
  { quote: "Clear, calm and fast. Our reception queue finally works, and the staff learned it in a day.", authorName: "dr. Maya Lestari", authorRole: "Clinic Director", company: "Klinik Sehat Trenggalek", published: true },
  { quote: "The best lab assistant we had that year. Students understood indexes because he made them see the query plan.", authorName: "Fajar Nugroho", authorRole: "Lecturer, Database Systems", company: "Telkom University", published: true },
  { quote: "Great collaborator on our sentiment paper; careful with data and honest about limits.", authorName: "Dewi Anggraini", authorRole: "Research Partner", company: "Universitas Brawijaya", published: false },
];

const MESSAGES = [
  { name: "Siti Rahma", email: "siti.rahma@example.com", subject: "Full stack role at a fintech in Jakarta", message: "Hi Verindra, we are hiring a full stack engineer with data experience. Would you be open to a 30-minute call next week?", read: false, daysAgo: 1 },
  { name: "Budi Santoso", email: "budi@example.com", subject: "Freelance dashboard project", message: "We need a dashboard for our cooperative's sales data. Your rice forecasting project looks close to what we want.", read: false, daysAgo: 3 },
  { name: "Andreas Wijaya", email: "andreas.w@example.com", subject: "Question about your IndoBERT article", message: "Did you try class weights for the neutral reviews? Curious how much it helped.", read: true, daysAgo: 9 },
  { name: "Talent Team", email: "talent@example.com", subject: "Data engineer opening (remote)", message: "Your profile matches a remote data engineer opening. Are you available to interview this month?", read: false, daysAgo: 12 },
  { name: "Putri Ayu", email: "putri.ayu@example.com", subject: "Guest lecture", message: "Would you give a guest lecture on deploying ML models for our final-year students?", read: true, daysAgo: 20 },
  { name: "Kevin Hartono", email: "kevin@example.com", subject: "Thanks for the Postgres post", message: "The owner-first index tip fixed a slow page for us. Thank you!", read: true, daysAgo: 31 },
];

// ---------------------------------------------------------------- builder

const start = (ctx: PublicContext, key: PositionKey) => (ctx.positions[key] ?? -1) + 1;
const AT_NOON = 12 * 60 * 60 * 1000;

export function buildPublic(ownerId: string, today: Date, ctx: PublicContext, publicUrl: (key: string) => string | null): PublicSeed {
  const seed: PublicSeed = { media: [], experiences: [], educations: [], skills: [], socialLinks: [], highlights: [], projects: [], projectLinks: [], projectMedia: [], tags: [], articles: [], articleTags: [], testimonials: [], contactMessages: [] };
  const daysAgo = (n: number) => new Date(utcDaysFrom(today, -n).getTime() + AT_NOON);
  // Every id below depends only on the item's fixed place in the content lists, never on what
  // was skipped, so a re-run after the owner takes a slug still targets the same rows.
  const addImage = (n: number, name: string, width: number, height: number): MediaSeed => {
    const id = demoId("media", n);
    const item: MediaSeed = {
      row: { id, userId: ownerId, bucket: "public-media", storageKey: `${DEMO_KEY_PREFIX}${id}.png`, originalName: `${name}.png`, mimeType: "image/png", sizeBytes: 0, kind: "image", purpose: "cover", status: "ready" },
      png: { width, height, seed: n },
    };
    seed.media.push(item);
    return item;
  };

  EXPERIENCES.forEach((e, i) =>
    seed.experiences.push({ id: demoId("experience", i + 1), userId: ownerId, company: e.company, role: e.role, location: e.location, startDate: e.start, endDate: e.end, description: e.description, achievements: e.achievements, position: start(ctx, "experience") + i }),
  );
  EDUCATIONS.forEach((e, i) =>
    seed.educations.push({ id: demoId("education", i + 1), userId: ownerId, school: e.school, degree: e.degree, field: e.field, startDate: e.start, endDate: e.end, description: e.description, position: start(ctx, "education") + i }),
  );
  HIGHLIGHTS.forEach(([metric, value, note], i) =>
    seed.highlights.push({ id: demoId("profile_highlight", i + 1), userId: ownerId, metric, value, note, position: start(ctx, "highlight") + i }),
  );
  SKILLS.forEach(([name, category, level], i) => seed.skills.push({ id: demoId("skill", i + 1), userId: ownerId, name, category, level, position: start(ctx, "skill") + i }));
  [["GitHub", "https://github.com/example"], ["LinkedIn", "https://www.linkedin.com/in/example"]].forEach(([label, url], i) =>
    seed.socialLinks.push({ id: demoId("social_link", i + 1), userId: ownerId, label, url, position: start(ctx, "socialLink") + i }),
  );

  PROJECTS.forEach((p, i) => {
    if (ctx.projectSlugs.has(p.slug)) return; // the owner already uses this slug: skip the project and everything under it
    const id = demoId("project", i + 1);
    const cover = addImage(i * 10 + 1, `${p.slug}-cover`, 1600, 1000);
    seed.projects.push({
      id, userId: ownerId, title: p.title, slug: p.slug, summary: p.summary, category: p.category, client: p.client, role: p.role, location: p.location,
      startDate: p.start, endDate: p.end, technologies: p.technologies, ...pick(derived(doc(p.body))), coverMediaId: cover.row.id, status: p.status,
      featured: p.featured, position: start(ctx, "project") + i, publishedAt: p.publishedDaysAgo === null ? null : daysAgo(p.publishedDaysAgo),
    });
    p.links.forEach(([label, url], j) => seed.projectLinks.push({ id: demoId("project_link", i * 10 + j + 1), userId: ownerId, projectId: id, label, url, position: j }));
    p.gallery.forEach((caption, j) => {
      const image = addImage(i * 10 + j + 2, `${p.slug}-gallery-${j + 1}`, 1600, 1000);
      image.row.purpose = "library";
      seed.projectMedia.push({ id: demoId("project_media", i * 10 + j + 1), userId: ownerId, projectId: id, mediaId: image.row.id, caption, position: j });
    });
  });

  const tagNames = Array.from(new Set(ARTICLES.flatMap((a) => a.tags)));
  const addedTags = new Set<string>();
  ARTICLES.forEach((a, i) => {
    if (ctx.articleSlugs.has(a.slug)) return;
    const id = demoId("article", i + 1);
    const cover = a.status === "published" ? addImage(100 + i, `${a.slug}-cover`, 1600, 900) : null;
    seed.articles.push({
      id, userId: ownerId, title: a.title, slug: a.slug, excerpt: a.excerpt, ...derived(doc(a.body)),
      coverUrl: cover ? publicUrl(cover.row.storageKey) : null, status: a.status, publishedAt: a.publishedDaysAgo === null ? null : daysAgo(a.publishedDaysAgo),
    });
    for (const name of a.tags) {
      const existing = ctx.tagIds.get(name.toLowerCase());
      const tagId = existing ?? demoId("tag", tagNames.indexOf(name) + 1);
      if (!existing && !addedTags.has(tagId)) {
        addedTags.add(tagId);
        seed.tags.push({ id: tagId, userId: ownerId, name });
      }
      seed.articleTags.push({ articleId: id, tagId });
    }
  });

  TESTIMONIALS.forEach((t, i) => seed.testimonials.push({ id: demoId("testimonial", i + 1), userId: ownerId, ...t, sourceUrl: null, position: start(ctx, "testimonial") + i }));
  MESSAGES.forEach((m, i) =>
    seed.contactMessages.push({ id: demoId("contact_message", i + 1), userId: ownerId, name: m.name, email: m.email, subject: m.subject, message: m.message, readAt: m.read ? daysAgo(m.daysAgo - 1) : null, createdAt: daysAgo(m.daysAgo) }),
  );
  return seed;
}

// Projects store plainText but have no word count column.
function pick({ content, plainText }: ReturnType<typeof derived>) {
  return { content, plainText };
}
