import { describe, expect, it } from "vitest";
import { paginate } from "./pagination";

describe("paginate", () => {
  const items = Array.from({ length: 53 }, (_, index) => index + 1);

  it("returns the requested page and its visible range", () => {
    expect(paginate(items, 2, 25)).toEqual({
      items: Array.from({ length: 25 }, (_, index) => index + 26),
      page: 2,
      pageCount: 3,
      total: 53,
      start: 26,
      end: 50,
    });
  });

  it("clamps page numbers to the available range", () => {
    expect(paginate(items, 99, 25).page).toBe(3);
    expect(paginate(items, 0, 25).page).toBe(1);
    expect(paginate(items, Number.NaN, 25).page).toBe(1);
  });

  it("represents an empty list without an invalid page", () => {
    expect(paginate([], 4, 24)).toEqual({
      items: [],
      page: 1,
      pageCount: 1,
      total: 0,
      start: 0,
      end: 0,
    });
  });

  it("rejects invalid page sizes", () => {
    expect(() => paginate(items, 1, 0)).toThrow(RangeError);
    expect(() => paginate(items, 1, 1.5)).toThrow(RangeError);
  });
});
