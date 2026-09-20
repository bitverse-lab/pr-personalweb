import { z } from "zod";

// Treat an empty value (KEY=) as "not set", which is how .env.local.example ships.
const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optional = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(blank, schema.optional());

export const serverEnvSchema = z
  .object({
    DATABASE_URL: z.preprocess(blank, z.string({ error: "is required" }).refine((v) => /^postgres(ql)?:\/\//.test(v), "must start with postgres:// or postgresql://")),
    AUTH_SECRET: z.preprocess(blank, z.string({ error: "is required" }).min(16, "is too short (use at least 16 random characters)")),
    AUTH_GOOGLE_ID: z.preprocess(blank, z.string({ error: "is required" })),
    AUTH_GOOGLE_SECRET: z.preprocess(blank, z.string({ error: "is required" })),
    OWNER_EMAIL: z.preprocess(blank, z.email({ error: "must be a valid email address" })),
    // optional features
    DIRECT_URL: optional(z.string()),
    AUTH_URL: optional(z.url({ error: "must be a full URL, e.g. https://example.com" })),
    SITE_URL: optional(z.url({ error: "must be a full URL, e.g. https://example.com" })),
    SUPABASE_URL: optional(z.url({ error: "must be a full URL, e.g. https://xyz.supabase.co" })),
    SUPABASE_SERVICE_ROLE_KEY: optional(z.string()),
    RESEND_API_KEY: optional(z.string()),
    CONTACT_TO: optional(z.email({ error: "must be a valid email address" })),
    CONTACT_FROM: optional(z.string()),
  })
  .superRefine((env, ctx) => {
    if (!!env.SUPABASE_URL !== !!env.SUPABASE_SERVICE_ROLE_KEY) {
      ctx.addIssue({ code: "custom", path: [env.SUPABASE_URL ? "SUPABASE_SERVICE_ROLE_KEY" : "SUPABASE_URL"], message: "must be set together with the other Supabase storage variable (or leave both empty)" });
    }
  });

/** Human-readable problems with the given environment. Values are never included, only variable names. */
export function envProblems(source: Record<string, string | undefined>): string[] {
  const result = serverEnvSchema.safeParse(source);
  if (result.success) return [];
  return result.error.issues.map((i) => `${String(i.path[0] ?? "environment")} ${i.message}`);
}

let checked = false;

/** Fails fast with one clear message instead of a cryptic error deep inside a query or sign-in. */
export function assertServerEnv(): void {
  if (checked) return;
  const problems = envProblems(process.env as Record<string, string | undefined>);
  if (problems.length > 0) {
    throw new Error(`Invalid environment configuration:\n - ${problems.join("\n - ")}\nCopy .env.local.example to .env.local and fill in the values (see the README).`);
  }
  checked = true;
}
