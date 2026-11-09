import { afterEach, expect, test, vi } from "vitest";

const postgresMock = vi.fn(() => ({ end: vi.fn() }));
vi.mock("postgres", () => ({ default: postgresMock }));
vi.mock("drizzle-orm/postgres-js", () => ({ drizzle: vi.fn(() => ({})) }));
vi.mock("@/server/env", () => ({ assertServerEnv: vi.fn() }));

afterEach(() => {
  delete (globalThis as { __pgClient?: unknown }).__pgClient;
  postgresMock.mockClear();
  vi.unstubAllEnvs();
});

// `next dev` evaluates this module once per compiled route bundle and again on every reload;
// a new client each time exhausted Supabase's 200-connection pooler (EMAXCONN).
test("re-evaluating the db module in development reuses one postgres client", async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.resetModules();
  await import("./index");
  vi.resetModules();
  await import("./index");

  expect(postgresMock).toHaveBeenCalledTimes(1);
});

test("the client keeps prepare: false for the transaction pooler", async () => {
  vi.resetModules();
  await import("./index");
  expect(postgresMock).toHaveBeenCalledWith(process.env.DATABASE_URL, expect.objectContaining({ prepare: false }));
});
