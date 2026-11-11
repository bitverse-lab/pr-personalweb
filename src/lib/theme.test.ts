import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveTheme, THEME_SCRIPT } from "./theme";

describe("resolveTheme", () => {
  it("follows the system until the visitor chooses, and keeps /me light", () => {
    expect(resolveTheme("/", null, true)).toBe("dark");
    expect(resolveTheme("/", null, false)).toBe("light");
    expect(resolveTheme("/articles", "light", true)).toBe("light");
    expect(resolveTheme("/", "dark", false)).toBe("dark");
    expect(resolveTheme("/", "purple", false)).toBe("light");
    expect(resolveTheme("/me", "dark", true)).toBe("light");
    expect(resolveTheme("/me/tasks", "dark", true)).toBe("light");
    expect(resolveTheme("/media", "dark", false)).toBe("dark");
  });
});

describe("THEME_SCRIPT", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("decides like resolveTheme", () => {
    for (const path of ["/", "/me", "/me/tasks", "/media"]) {
      for (const stored of [null, "light", "dark", "purple"]) {
        for (const systemDark of [true, false]) {
          const root = { dataset: {} as Record<string, string> };
          vi.stubGlobal("location", { pathname: path });
          vi.stubGlobal("localStorage", { getItem: () => stored });
          vi.stubGlobal("matchMedia", () => ({ matches: systemDark }));
          vi.stubGlobal("document", { documentElement: root });
          new Function(THEME_SCRIPT)();
          expect(root.dataset.theme, `${path} ${stored} ${systemDark}`).toBe(resolveTheme(path, stored, systemDark));
        }
      }
    }
  });
});
