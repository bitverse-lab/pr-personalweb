import { describe, expect, it } from "vitest";
import { parseBuildOutput, parsePlaywrightList, summarizeVitest } from "./parse.mjs";

const BUILD = `
Route (app)                              Size     First Load JS
┌ ○ /                                    3.74 kB         111 kB
├ ƒ /api/auth/[...nextauth]              0 B                0 B
├ ƒ /me/tasks                            8.35 kB         127 kB
└ ○ /sitemap.xml                         0 B                0 B
+ First Load JS shared by all            87.6 kB
  ├ chunks/4050-abb1ae7334ec66ea.js      31.9 kB
ƒ Middleware                             79 kB
`;

describe("proof parsers", () => {
  it("reads routes and the shared bundle from next build output", () => {
    const { sharedKb, routes } = parseBuildOutput(BUILD);
    expect(sharedKb).toBe(87.6);
    expect(routes).toHaveLength(4);
    expect(routes[0]).toEqual({ route: "/", kind: "static", sizeKb: 3.74, firstLoadKb: 111 });
    expect(routes[2]).toEqual({ route: "/me/tasks", kind: "dynamic", sizeKb: 8.35, firstLoadKb: 127 });
  });

  it("reads the playwright total", () => {
    expect(parsePlaywrightList("  [chromium] › a.spec.ts:3:5 › x\nTotal: 93 tests in 14 files")).toEqual({ total: 93, files: 14 });
    expect(parsePlaywrightList("nothing")).toBeNull();
  });

  it("summarises the vitest report, failures included", () => {
    expect(summarizeVitest({ numTotalTests: 10, numPassedTests: 9, numFailedTests: 1, numTotalTestSuites: 7, testResults: [{}, {}, {}] })).toEqual({ total: 10, passed: 9, failed: 1, files: 3 });
  });
});
