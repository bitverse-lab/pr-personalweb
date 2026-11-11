import { describe, expect, it } from "vitest";
import { monthGrid } from "./format";

describe("monthGrid", () => {
  it("starts on the right weekday and lists every day of the month, whatever the machine's timezone", () => {
    const cells = monthGrid("2026-11-10"); // 1 Nov 2026 is a Sunday
    expect(cells[0]).toBe("2026-11-01");
    expect(cells.filter(Boolean)).toHaveLength(30);
    expect(cells.at(-1)).toBe("2026-11-30");
  });

  it("pads the first week with blanks", () => {
    const cells = monthGrid("2026-10-05"); // 1 Oct 2026 is a Thursday
    expect(cells.slice(0, 4)).toEqual([null, null, null, null]);
    expect(cells[4]).toBe("2026-10-01");
  });
});
