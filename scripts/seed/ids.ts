import { DEMO_PREFIX } from "../../src/lib/demo";

export { DEMO_KEY_PREFIX, DEMO_PREFIX, isDemoId } from "../../src/lib/demo";

// One fixed code per seeded table keeps ids unique across tables and readable in Drizzle Studio.
const DOMAIN_CODES = {
  media: 0x0001,
  experience: 0x0002,
  education: 0x0003,
  skill: 0x0004,
  social_link: 0x0005,
  project: 0x0006,
  project_link: 0x0007,
  project_media: 0x0008,
  tag: 0x0009,
  article: 0x000a,
  testimonial: 0x000b,
  contact_message: 0x000c,
  task: 0x000d,
  subtask: 0x000e,
  calendar_event: 0x000f,
  company: 0x0010,
  application: 0x0011,
  application_status_history: 0x0012,
  application_contact: 0x0013,
  application_timeline_event: 0x0014,
  interview: 0x0015,
  journal_entry: 0x0016,
  health_profile: 0x0017,
  weight_entry: 0x0018,
  body_measurement: 0x0019,
  exercise: 0x001a,
  food: 0x001b,
  meal: 0x001c,
  meal_item: 0x001d,
  water_entry: 0x001e,
  routine: 0x001f,
  routine_exercise: 0x0020,
  workout: 0x0021,
  workout_set: 0x0022,
  profile_highlight: 0x0023,
} as const;

export type DemoDomain = keyof typeof DOMAIN_CODES;

/** Deterministic demo UUID: `de5eed00-<domain>-4000-8000-<n>`, so a re-run targets the same rows. */
export function demoId(domain: DemoDomain, n: number): string {
  if (!Number.isInteger(n) || n < 0) throw new Error(`demoId: counter must be a non-negative integer, got ${n}`);
  const code = DOMAIN_CODES[domain].toString(16).padStart(4, "0");
  return `${DEMO_PREFIX}${code}-4000-8000-${n.toString(16).padStart(12, "0")}`;
}
