import { describe, expect, it } from "vitest";
import { hasIndonesian, localize, splitLocale, switchTarget } from "./locale";

describe("locale paths", () => {
  it("prefixes Indonesian paths and leaves English ones alone", () => {
    expect(localize("id", "/")).toBe("/id");
    expect(localize("id", "/projects/rice")).toBe("/id/projects/rice");
    expect(localize("id", "/articles?tag=ml")).toBe("/id/articles?tag=ml");
    expect(localize("en", "/projects")).toBe("/projects");
  });

  it("splits a path into locale and root path", () => {
    expect(splitLocale("/id")).toEqual({ locale: "id", path: "/" });
    expect(splitLocale("/id/cv")).toEqual({ locale: "id", path: "/cv" });
    expect(splitLocale("/idea")).toEqual({ locale: "en", path: "/idea" });
    expect(splitLocale("/cv")).toEqual({ locale: "en", path: "/cv" });
  });

  it("knows which pages have an Indonesian version", () => {
    for (const p of ["/", "/about", "/cv", "/projects", "/projects/rice", "/articles", "/articles/x", "/contact"]) expect(hasIndonesian(p), p).toBe(true);
    for (const p of ["/proof", "/match", "/architecture", "/privacy", "/for/backend", "/me"]) expect(hasIndonesian(p), p).toBe(false);
  });

  it("switches to the same page in the other language, or the Indonesian home", () => {
    expect(switchTarget("/projects/rice")).toBe("/id/projects/rice");
    expect(switchTarget("/id/projects/rice")).toBe("/projects/rice");
    expect(switchTarget("/id")).toBe("/");
    expect(switchTarget("/proof")).toBe("/id");
  });
});
