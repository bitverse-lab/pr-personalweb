import { describe, expect, it } from "vitest";
import { formatDigest } from "./format.mjs";

const base = { today: "2026-11-10", dateLabel: "Tuesday, 10 November", tasks: [], interviews: [], events: [] };

describe("formatDigest", () => {
  it("says so when the day is clear", () => {
    expect(formatDigest(base)).toContain("Nothing due and nothing scheduled today");
  });

  it("lists today's tasks, then overdue ones with how late they are, oldest first", () => {
    const text: string = formatDigest({
      ...base,
      tasks: [
        { title: "Stretch", dueDate: "2026-11-10", priority: null, recurring: true },
        { title: "Book dentist", dueDate: "2026-11-04", priority: "low", recurring: false },
        { title: "Pay rent", dueDate: "2026-11-01", priority: "high", recurring: false },
      ],
    });
    expect(text).toContain("Due today (1)");
    expect(text).toContain("• Stretch 🔁");
    expect(text.indexOf("Pay rent")).toBeLessThan(text.indexOf("Book dentist"));
    expect(text).toContain("Pay rent ‼️ <i>(9d)</i>");
  });

  it("escapes HTML in user text", () => {
    expect(formatDigest({ ...base, tasks: [{ title: "Fix <b> & co", dueDate: "2026-11-10", priority: null, recurring: false }] })).toContain("Fix &lt;b&gt; &amp; co");
  });

  it("caps a long overdue list", () => {
    const tasks = Array.from({ length: 11 }, (_, i) => ({ title: `T${i}`, dueDate: "2026-11-01", priority: null, recurring: false }));
    expect(formatDigest({ ...base, tasks })).toContain("… and 3 more");
  });
});
