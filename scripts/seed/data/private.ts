import type {
  applicationContacts,
  applications,
  ApplicationStatus,
  applicationStatusHistory,
  applicationTimelineEvents,
  bodyMeasurements,
  calendarEvents,
  companies,
  exercises,
  foods,
  healthProfiles,
  interviews,
  journalEntries,
  mealItems,
  meals,
  routineExercises,
  routines,
  subtasks,
  tasks,
  waterEntries,
  weightEntries,
  workouts,
  workoutSets,
} from "../../../src/db/schema";
import { jakartaDate, utcDaysFrom } from "../dates";
import { demoId } from "../ids";
import { derived, doc } from "./doc";

type Row<T extends { $inferInsert: unknown }> = T["$inferInsert"] & { id: string };

export const APPLICATION_STATUSES: ApplicationStatus[] = ["wishlist", "applied", "screening", "interview", "offer", "rejected", "withdrawn"];

/** What the owner already has; their rows always win a unique key. */
export interface PrivateContext {
  healthProfile: boolean;
  weightDates: Set<string>;
  measurementDates: Set<string>;
  journalDates: Set<string>;
  /** `${lower(name)}|${brand ?? ""}` → id */
  foodIds: Map<string, string>;
  /** lower(name) → id */
  exerciseIds: Map<string, string>;
  /** lower(name) → id */
  companyIds: Map<string, string>;
}

export const emptyPrivateContext = (): PrivateContext => ({
  healthProfile: false,
  weightDates: new Set(),
  measurementDates: new Set(),
  journalDates: new Set(),
  foodIds: new Map(),
  exerciseIds: new Map(),
  companyIds: new Map(),
});

export interface PrivateSeed {
  tasks: Row<typeof tasks>[];
  subtasks: Row<typeof subtasks>[];
  calendarEvents: Row<typeof calendarEvents>[];
  companies: Row<typeof companies>[];
  applications: Row<typeof applications>[];
  applicationStatusHistory: Row<typeof applicationStatusHistory>[];
  applicationContacts: Row<typeof applicationContacts>[];
  applicationTimelineEvents: Row<typeof applicationTimelineEvents>[];
  interviews: Row<typeof interviews>[];
  journalEntries: Row<typeof journalEntries>[];
  healthProfiles: Row<typeof healthProfiles>[];
  weightEntries: Row<typeof weightEntries>[];
  bodyMeasurements: Row<typeof bodyMeasurements>[];
  foods: Row<typeof foods>[];
  meals: Row<typeof meals>[];
  mealItems: Row<typeof mealItems>[];
  waterEntries: Row<typeof waterEntries>[];
  exercises: Row<typeof exercises>[];
  routines: Row<typeof routines>[];
  routineExercises: Row<typeof routineExercises>[];
  workouts: Row<typeof workouts>[];
  workoutSets: Row<typeof workoutSets>[];
}

// Deterministic variation so the same day always gets the same numbers.
const wobble = (n: number) => (Math.sin(n * 12.9898) * 43758.5453) % 1;
const r1 = (x: number) => Math.round(x * 10) / 10;
const HOUR = 3_600_000;

// ---------------------------------------------------------------- content

const TASKS: [string, "todo" | "in_progress" | "done", "low" | "medium" | "high", string[]][] = [
  ["Prepare portfolio case study for the yield forecasting project", "in_progress", "high", ["portfolio"]],
  ["Update CV with 2025 achievements", "todo", "high", ["career"]],
  ["Reply to Siti about the fintech role", "todo", "high", ["career"]],
  ["Write blog post: Postgres indexes part 2", "todo", "medium", ["writing"]],
  ["Renew domain verindra.dev", "todo", "medium", ["admin"]],
  ["Benchmark model latency on the new instance", "in_progress", "medium", ["work"]],
  ["Review pull requests from the junior devs", "todo", "medium", ["work"]],
  ["Practice system design: rate limiter", "todo", "medium", ["learning"]],
  ["Book dentist appointment", "todo", "low", ["personal"]],
  ["Back up laptop to external drive", "todo", "low", ["personal"]],
  ["Read: Designing Data-Intensive Applications ch. 7", "in_progress", "low", ["learning"]],
  ["Draft guest lecture outline", "in_progress", "medium", ["teaching"]],
  ["Clean up GitHub profile README", "todo", "low", ["portfolio"]],
  ["Set up monitoring alerts for the forecast API", "in_progress", "high", ["work"]],
  ["Prepare questions for the technical interview", "todo", "high", ["career"]],
  ["Ship dashboard filters for cooperative managers", "done", "high", ["work"]],
  ["Fix flaky test in ingestion job", "done", "medium", ["work"]],
  ["Send invoice to the clinic", "done", "medium", ["admin"]],
  ["Publish article on Laravel queues", "done", "medium", ["writing"]],
  ["Migrate personal site to Next.js 14", "done", "medium", ["portfolio"]],
  ["Renew BPJS membership", "done", "low", ["personal"]],
  ["Finish online course on vector databases", "done", "low", ["learning"]],
  ["Write unit tests for the pricing module", "done", "medium", ["work"]],
  ["Organise photos from the cooperative visit", "done", "low", ["personal"]],
  ["Call mom", "done", "low", ["personal"]],
];

const COMPANIES = ["Tokopedia", "Gojek", "Traveloka", "Bukalapak", "Xendit", "Ruangguru", "eFishery", "Halodoc"];

const APPLICATIONS: [number, string, ApplicationStatus, "onsite" | "hybrid" | "remote", string][] = [
  [0, "Software Engineer, Data Platform", "interview", "hybrid", "Jakarta"],
  [1, "Full Stack Engineer", "applied", "hybrid", "Jakarta"],
  [2, "Backend Engineer (Python)", "screening", "remote", "Remote"],
  [3, "Software Engineer", "rejected", "onsite", "Jakarta"],
  [4, "Full Stack Engineer, Payments", "offer", "remote", "Remote"],
  [5, "ML Engineer", "wishlist", "hybrid", "Jakarta"],
  [6, "Data Engineer", "interview", "remote", "Bandung"],
  [7, "Software Engineer, Health Records", "withdrawn", "hybrid", "Jakarta"],
  [0, "Machine Learning Engineer", "applied", "hybrid", "Jakarta"],
  [2, "Senior Full Stack Engineer", "rejected", "remote", "Remote"],
];

const PATHS: Record<ApplicationStatus, ApplicationStatus[]> = {
  wishlist: ["wishlist"],
  applied: ["wishlist", "applied"],
  screening: ["applied", "screening"],
  interview: ["applied", "screening", "interview"],
  offer: ["applied", "screening", "interview", "offer"],
  rejected: ["applied", "screening", "rejected"],
  withdrawn: ["applied", "withdrawn"],
};

const EVENTS: [string, number, number, number, "blue" | "orange" | "green" | "pink" | "violet" | "red", string | null][] = [
  // title, day offset, start hour (UTC), duration hours, colour, location
  ["Team standup", -1, 2, 0.5, "blue", "Google Meet"],
  ["Cooperative data review", -3, 6, 1.5, "green", "Surabaya office"],
  ["Gym · legs", -2, 11, 1, "orange", null],
  ["Dentist", 4, 7, 1, "pink", "Klinik Gigi Sehat"],
  ["Sprint planning", 1, 2, 1, "blue", "Google Meet"],
  ["Guest lecture prep", 2, 8, 2, "violet", null],
  ["Guest lecture: deploying ML models", 9, 3, 2, "violet", "Telkom University"],
  ["Call with mom", 0, 12, 0.5, "pink", null],
  ["Write blog post", 3, 13, 2, "green", null],
  ["Demo to cooperative managers", 6, 4, 1, "blue", "Zoom"],
  ["Retro", -7, 8, 1, "blue", "Google Meet"],
  ["Reading block", -5, 13, 1.5, "green", null],
  ["Gym · push", 5, 11, 1, "orange", null],
  ["Family dinner", 12, 11, 2, "pink", "Trenggalek"],
  ["Mentoring session", -10, 7, 1, "violet", "Google Meet"],
];

const INTERVIEWS: [number, "phone" | "technical" | "hr" | "onsite", number, "scheduled" | "completed", string][] = [
  // application index, kind, day offset, status, contact name
  [0, "technical", 3, "scheduled", "Rizky Pratama"],
  [6, "hr", 7, "scheduled", "Nadia Putri"],
  [4, "technical", -12, "completed", "Hendra Gunawan"],
  [0, "phone", -6, "completed", "Rizky Pratama"],
];

const MOODS = ["Long day, but the forecast service finally passed load testing.", "Slow morning. Good walk in the afternoon.", "Interview prep went well; felt confident on SQL questions.", "Tired. Too many meetings.", "Wrote half a blog post and cooked rendang with family.", "Helped a junior debug a race condition. Satisfying.", "Rain all day; stayed in and read."];

const FOODS: [string, string | null, number, "g" | "ml" | "piece" | "cup" | "slice", number, number, number, number, number][] = [
  // name, brand, serving size, unit, kcal, protein, carbs, fat, fiber (per serving)
  ["Nasi putih", null, 150, "g", 195, 4, 43, 0, 1],
  ["Ayam goreng", null, 100, "g", 260, 27, 6, 14, 0],
  ["Tempe goreng", null, 50, "g", 175, 10, 7, 12, 3],
  ["Tahu kukus", null, 100, "g", 80, 8, 2, 5, 1],
  ["Telur rebus", null, 1, "piece", 78, 6, 1, 5, 0],
  ["Oatmeal", "Quaker", 40, "g", 150, 5, 27, 3, 4],
  ["Pisang", null, 1, "piece", 105, 1, 27, 0, 3],
  ["Susu UHT", "Ultra Milk", 250, "ml", 150, 8, 12, 8, 0],
  ["Greek yogurt", "Heavenly Blush", 100, "g", 97, 9, 4, 5, 0],
  ["Sayur bayam", null, 1, "cup", 40, 3, 6, 1, 3],
  ["Gado-gado", null, 300, "g", 420, 15, 35, 25, 8],
  ["Soto ayam", null, 1, "cup", 220, 18, 15, 10, 2],
  ["Rendang", null, 100, "g", 290, 22, 6, 20, 1],
  ["Ikan bakar", null, 150, "g", 230, 34, 2, 9, 0],
  ["Apel", null, 1, "piece", 95, 0, 25, 0, 4],
  ["Roti gandum", "Sari Roti", 1, "slice", 80, 4, 14, 1, 2],
  ["Kopi susu", null, 1, "cup", 140, 4, 20, 5, 0],
  ["Whey protein", "Optimum Nutrition", 30, "g", 120, 24, 3, 1, 0],
  ["Almond", null, 30, "g", 170, 6, 6, 15, 4],
  ["Nasi goreng", null, 300, "g", 520, 14, 70, 20, 3],
];

const MEAL_PLAN: ["breakfast" | "lunch" | "dinner" | "snack", [number, number][]][] = [
  ["breakfast", [[5, 1], [6, 1], [16, 1]]],
  ["lunch", [[0, 1], [1, 1], [9, 1]]],
  ["dinner", [[0, 1], [13, 1], [3, 1.5]]],
  ["snack", [[17, 1], [14, 1]]],
];

const EXERCISES: [string, "chest" | "back" | "shoulders" | "legs" | "core" | "cardio", "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "other", "strength" | "bodyweight" | "cardio"][] = [
  ["Bench Press", "chest", "barbell", "strength"],
  ["Overhead Press", "shoulders", "barbell", "strength"],
  ["Incline Dumbbell Press", "chest", "dumbbell", "strength"],
  ["Barbell Row", "back", "barbell", "strength"],
  ["Pull-up", "back", "bodyweight", "bodyweight"],
  ["Lat Pulldown", "back", "cable", "strength"],
  ["Back Squat", "legs", "barbell", "strength"],
  ["Romanian Deadlift", "legs", "barbell", "strength"],
  ["Plank", "core", "bodyweight", "bodyweight"],
  ["Treadmill Run", "cardio", "machine", "cardio"],
];

const ROUTINES: [string, string, number[]][] = [
  ["Push", "Chest, shoulders, triceps", [0, 1, 2]],
  ["Pull", "Back and biceps", [3, 4, 5]],
  ["Legs", "Squat day", [6, 7, 8]],
  ["Full Body", "When short on time", [0, 3, 6, 9]],
];

// ---------------------------------------------------------------- builder

export function buildPrivate(ownerId: string, today: Date, ctx: PrivateContext): PrivateSeed {
  const s: PrivateSeed = {
    tasks: [], subtasks: [], calendarEvents: [], companies: [], applications: [], applicationStatusHistory: [], applicationContacts: [],
    applicationTimelineEvents: [], interviews: [], journalEntries: [], healthProfiles: [], weightEntries: [], bodyMeasurements: [], foods: [],
    meals: [], mealItems: [], waterEntries: [], exercises: [], routines: [], routineExercises: [], workouts: [], workoutSets: [],
  };
  const userId = ownerId;
  const utc = (offset: number, hour = 0) => new Date(utcDaysFrom(today, offset).getTime() + hour * HOUR);
  const isoDay = (offset: number) => utcDaysFrom(today, offset).toISOString().slice(0, 10);

  // Tasks: overdue and upcoming todos, work in progress, and a recent run of completed work.
  let doneN = 0;
  TASKS.forEach(([title, status, priority, tags], i) => {
    const id = demoId("task", i + 1);
    const recentDone = status === "done" && doneN++ < 5;
    const doneAgo = recentDone ? doneN : 8 + doneN * 2;
    s.tasks.push({
      id, userId, title, description: i % 3 === 0 ? "Notes and links are in the project doc." : null,
      dueDate: status === "done" ? isoDay(-doneAgo) : isoDay(i % 4 === 0 ? -(2 + (i % 5)) : 1 + (i % 9)),
      status, priority, tags, completedAt: status === "done" ? utc(-doneAgo, 9) : null, createdAt: utc(-(20 + (i % 10)), 3),
    });
    if (i < 6) ["Outline", "First draft", "Review"].forEach((t, j) => s.subtasks.push({ id: demoId("subtask", i * 10 + j + 1), userId, taskId: id, title: t, done: j < (status === "in_progress" ? 1 : 0) }));
  });

  EVENTS.forEach(([title, day, hour, hours, color, location], i) =>
    s.calendarEvents.push({ id: demoId("calendar_event", i + 1), userId, title, description: null, location, startAt: utc(day, hour), endAt: utc(day, hour + hours), allDay: false, color }),
  );

  // Career: companies (reusing the owner's), applications across every status with history.
  const companyId = COMPANIES.map((name, i) => {
    const existing = ctx.companyIds.get(name.toLowerCase());
    if (existing) return existing;
    const id = demoId("company", i + 1);
    s.companies.push({ id, userId, name, website: `https://www.${name.toLowerCase()}.com` });
    return id;
  });
  APPLICATIONS.forEach(([company, roleTitle, status, workMode, location], i) => {
    const id = demoId("application", i + 1);
    const path = PATHS[status];
    const startedAgo = 40 - i * 3;
    s.applications.push({
      id, userId, companyId: companyId[company], roleTitle, status, location, workMode, jobUrl: `https://careers.example.com/${i + 1}`,
      salaryRange: status === "wishlist" ? null : "IDR 18–28 jt / month", appliedAt: status === "wishlist" ? null : isoDay(-startedAgo), notes: null,
      createdAt: utc(-startedAgo - 2, 2), updatedAt: utc(-startedAgo + path.length * 3, 2),
    });
    path.forEach((to, j) =>
      s.applicationStatusHistory.push({ id: demoId("application_status_history", i * 10 + j + 1), userId, applicationId: id, fromStatus: j === 0 ? null : path[j - 1], toStatus: to, changedAt: utc(-startedAgo + j * 3, 4) }),
    );
    s.applicationTimelineEvents.push({ id: demoId("application_timeline_event", i * 10 + 1), userId, applicationId: id, type: "created", title: "Application added", body: null, occurredAt: utc(-startedAgo - 2, 2) });
    if (i % 3 === 0) s.applicationTimelineEvents.push({ id: demoId("application_timeline_event", i * 10 + 2), userId, applicationId: id, type: "note", title: "Note", body: "Team works on the data platform; ask about on-call.", occurredAt: utc(-startedAgo + 1, 5) });
  });

  INTERVIEWS.forEach(([app, kind, day, status, contact], i) => {
    const applicationId = demoId("application", app + 1);
    const contactId = demoId("application_contact", i + 1);
    const eventId = demoId("calendar_event", 100 + i);
    const company = COMPANIES[APPLICATIONS[app][0]];
    s.applicationContacts.push({ id: contactId, userId, applicationId, name: contact, role: kind === "hr" ? "Talent Acquisition" : "Engineering Manager", email: `${contact.split(" ")[0].toLowerCase()}@example.com`, phone: null, linkedin: null });
    s.calendarEvents.push({ id: eventId, userId, title: `Interview · ${company}`, description: `${kind} interview`, location: "Google Meet", startAt: utc(day, 3), endAt: utc(day, 4), allDay: false, color: "red" });
    s.interviews.push({ id: demoId("interview", i + 1), userId, applicationId, kind, startAt: utc(day, 3), endAt: utc(day, 4), locationOrLink: "https://meet.google.com/demo", status, notes: status === "completed" ? "Went well; follow-up expected." : null, contactId, calendarEventId: eventId });
  });

  // Journal: 30 of the last 35 days, a few gaps like a real habit.
  for (let d = 0, n = 0; d < 35 && n < 30; d++) {
    if (d % 7 === 5) continue;
    const date = jakartaDate(today, -d);
    n++;
    if (ctx.journalDates.has(date)) continue;
    const text = MOODS[d % MOODS.length];
    s.journalEntries.push({ id: demoId("journal_entry", d + 1), userId, date, title: null, ...derived(doc([["p", text]])), mood: 1 + ((d * 3 + 2) % 5), tags: d % 4 === 0 ? ["work"] : [] });
  }

  // Health
  if (!ctx.healthProfile) {
    s.healthProfiles.push({ id: demoId("health_profile", 1), userId, heightCm: 172, sex: "male", birthDate: "2001-05-14", activityLevel: "moderate", goalType: "lose", targetWeightKg: 68, weeklyRateKg: 0.25, dailyCalories: 2100, proteinG: 140, carbsG: 220, fatG: 70, waterMl: 2500, weeklyWorkoutTarget: 4 });
  }
  for (let d = 0; d < 60; d++) {
    const date = jakartaDate(today, -d);
    if (ctx.weightDates.has(date)) continue;
    s.weightEntries.push({ id: demoId("weight_entry", d + 1), userId, date, weightKg: r1(69.4 + d * 0.045 + wobble(d) * 0.6), bodyFatPct: d % 7 === 0 ? r1(19 + d * 0.03) : null, note: null });
  }
  for (let k = 0; k < 6; k++) {
    const date = jakartaDate(today, -k * 10);
    if (ctx.measurementDates.has(date)) continue;
    s.bodyMeasurements.push({ id: demoId("body_measurement", k + 1), userId, date, waistCm: r1(84 + k * 0.4), chestCm: r1(98 - k * 0.1), hipsCm: r1(96 + k * 0.2), armCm: r1(33.5 - k * 0.1), thighCm: r1(56 + k * 0.1), neckCm: 38 });
  }

  const food = FOODS.map(([name, brand, servingSize, servingUnit, calories, protein, carbs, fat, fiber], i) => {
    const existing = ctx.foodIds.get(`${name.toLowerCase()}|${brand ?? ""}`);
    const row = { id: existing ?? demoId("food", i + 1), userId, name, brand, servingSize, servingUnit, calories, protein, carbs, fat, fiber, isFavorite: i % 6 === 0 };
    if (!existing) s.foods.push(row);
    return row;
  });
  for (let d = 0; d < 21; d++) {
    const date = jakartaDate(today, -d);
    MEAL_PLAN.forEach(([mealType, items], m) => {
      const mealId = demoId("meal", d * 10 + m + 1);
      s.meals.push({ id: mealId, userId, date, mealType });
      items.forEach(([f, base], j) => {
        if ((d + j) % 4 === 3 && j > 0) return; // vary the plate day to day
        const servings = base + ((d + m + j) % 3 === 0 ? 0.5 : 0);
        const fd = food[f];
        // Snapshot at log time (CLAUDE.md): editing the food later must not rewrite this history.
        s.mealItems.push({
          id: demoId("meal_item", d * 100 + m * 10 + j + 1), userId, mealId, foodId: fd.id, name: fd.name, servings,
          servingLabel: `${servings} × ${fd.servingSize} ${fd.servingUnit}`, calories: r1(fd.calories * servings), protein: r1(fd.protein * servings), carbs: r1(fd.carbs * servings), fat: r1(fd.fat * servings),
        });
      });
    });
    [250, 500, 330, 500].forEach((ml, w) => {
      if (w === 3 && d % 2 === 1) return;
      s.waterEntries.push({ id: demoId("water_entry", d * 10 + w + 1), userId, date, amountMl: ml });
    });
  }

  const exerciseId = EXERCISES.map(([name, muscleGroup, equipment, kind], i) => {
    const existing = ctx.exerciseIds.get(name.toLowerCase());
    if (existing) return existing;
    const id = demoId("exercise", i + 1);
    s.exercises.push({ id, userId, name, muscleGroup, equipment, kind, isCustom: true });
    return id;
  });
  ROUTINES.forEach(([name, notes, list], i) => {
    const routineId = demoId("routine", i + 1);
    s.routines.push({ id: routineId, userId, name, notes });
    list.forEach((e, j) => s.routineExercises.push({ id: demoId("routine_exercise", i * 10 + j + 1), userId, routineId, exerciseId: exerciseId[e], position: j, targetSets: 3, targetReps: e === 8 ? 1 : 8 }));
  });
  // 12 completed workouts over four weeks with gentle progression, so PRs and volume charts have data.
  for (let w = 0; w < 12; w++) {
    const day = -(w * 2 + 1 + Math.floor(w / 3));
    const r = w % 3;
    const [name, , list] = ROUTINES[r];
    const workoutId = demoId("workout", w + 1);
    const started = new Date(utcDaysFrom(today, day).getTime() + 11 * HOUR);
    s.workouts.push({ id: workoutId, userId, date: jakartaDate(today, day), name, startedAt: started, endedAt: new Date(started.getTime() + 65 * 60_000), notes: null, routineId: demoId("routine", r + 1), status: "completed" });
    list.forEach((e, order) => {
      const [, , , kind] = EXERCISES[e];
      for (let set = 1; set <= 3; set++) {
        const base = [60, 40, 22, 55, 0, 50, 80, 70, 0, 0][e];
        s.workoutSets.push({
          id: demoId("workout_set", w * 100 + order * 10 + set), userId, workoutId, exerciseId: exerciseId[e], exerciseOrder: order, setNumber: set,
          reps: kind === "strength" ? 8 - (set === 3 ? 1 : 0) : kind === "bodyweight" ? (e === 8 ? null : 8) : null,
          weightKg: kind === "strength" ? base + (11 - w) * 1.25 : null, durationSec: e === 8 ? 60 : null, distanceKm: null, isWarmup: false, done: true,
        });
      }
    });
  }
  return s;
}
