import { describe, expect, it } from "vitest";
import { restoreTestimonialSchema, testimonialSchema } from "./schema";

const ok = { quote: "Working with them was a pleasure from start to finish.", authorName: "Grace Hopper" };

describe("testimonialSchema", () => {
  it("accepts a quote and treats blank optional fields as empty", () => {
    const r = testimonialSchema.safeParse({ ...ok, authorRole: "", company: "  ", sourceUrl: "" });
    expect(r.success).toBe(true);
    if (r.success) expect([r.data.authorRole, r.data.company, r.data.sourceUrl]).toEqual([null, null, null]);
  });

  it("needs a real quote and an author", () => {
    expect(testimonialSchema.safeParse({ ...ok, quote: "great" }).success).toBe(false);
    expect(testimonialSchema.safeParse({ ...ok, authorName: " " }).success).toBe(false);
    expect(testimonialSchema.safeParse({ ...ok, quote: "x".repeat(701) }).success).toBe(false);
  });

  it("only allows http(s) source links", () => {
    expect(testimonialSchema.safeParse({ ...ok, sourceUrl: "https://linkedin.com/in/grace" }).success).toBe(true);
    for (const sourceUrl of ["javascript:alert(1)", "mailto:a@b.co", "//evil.example", "linkedin.com/in/grace"]) {
      expect(testimonialSchema.safeParse({ ...ok, sourceUrl }).success).toBe(false);
    }
  });

  it("restores a deleted testimonial with its published state", () => {
    expect(restoreTestimonialSchema.safeParse({ ...ok, published: true }).success).toBe(true);
    expect(restoreTestimonialSchema.safeParse({ ...ok }).success).toBe(false);
  });
});
