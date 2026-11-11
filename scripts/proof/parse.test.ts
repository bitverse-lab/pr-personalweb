import { describe, expect, it } from "vitest";
import { parseBuildOutput, parsePlaywrightList, summarizeOutdated, summarizeVitest } from "./parse.mjs";

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
  it("counts dependencies behind, and those a breaking version behind", () => {
    const json = {
      a: { current: "1.2.0", latest: "1.3.0", isDeprecated: false },
      b: { current: "2.0.0", latest: "3.1.0", isDeprecated: false },
      c: { current: "0.5.9", latest: "0.5.16", isDeprecated: false },
      d: { current: "0.4.1", latest: "0.5.0", isDeprecated: true },
    };
    expect(summarizeOutdated(json, 10)).toEqual({ direct: 10, current: 6, behind: 4, behindMajor: 2, majorNames: ["b", "d"], deprecated: ["d"] });
    expect(summarizeOutdated({}, 3)).toMatchObject({ current: 3, behind: 0, behindMajor: 0 });
  });

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
