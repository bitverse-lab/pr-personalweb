import { describe, expect, it } from "vitest";
import { envProblems } from "./env";

const good = {
  DATABASE_URL: "postgresql://user:pass@host:5432/db",
  AUTH_SECRET: "x".repeat(32),
  AUTH_GOOGLE_ID: "id",
  AUTH_GOOGLE_SECRET: "secret",
  OWNER_EMAIL: "owner@example.com",
};

describe("environment validation", () => {
  it("accepts a complete configuration, with optional values left empty", () => {
    expect(envProblems(good)).toEqual([]);
    expect(envProblems({ ...good, SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "", RESEND_API_KEY: "", SITE_URL: "" })).toEqual([]);
  });

  it("names every missing required variable", () => {
    const problems = envProblems({}).join("\n");
    for (const name of ["DATABASE_URL", "AUTH_SECRET", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET", "OWNER_EMAIL"]) expect(problems).toContain(name);
  });

  it("catches malformed values without ever printing them", () => {
    const secretish = "not-a-db-url-with-password-hunter2";
    const problems = envProblems({ ...good, DATABASE_URL: secretish, OWNER_EMAIL: "nope", AUTH_SECRET: "short" }).join("\n");
    expect(problems).toContain("DATABASE_URL");
    expect(problems).toContain("OWNER_EMAIL");
    expect(problems).toContain("AUTH_SECRET");
    expect(problems).not.toContain("hunter2");
    expect(problems).not.toContain("short\n");
  });

  it("requires the two Supabase storage variables together", () => {
    expect(envProblems({ ...good, SUPABASE_URL: "https://x.supabase.co" }).join()).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(envProblems({ ...good, SUPABASE_SERVICE_ROLE_KEY: "k" }).join()).toContain("SUPABASE_URL");
    expect(envProblems({ ...good, SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" })).toEqual([]);
  });

  it("rejects a malformed optional URL", () => {
    expect(envProblems({ ...good, SITE_URL: "example.com" }).join()).toContain("SITE_URL");
  });
});
