import { describe, expect, it } from "vitest";
import { contactSchema, restoreMessageSchema } from "./schema";

const ok = { name: "Ada", email: "ada@example.com", subject: "Hello", message: "I would like to talk about a project." };

describe("contactSchema", () => {
  it("accepts a normal message and normalises an empty subject to null", () => {
    const r = contactSchema.safeParse({ ...ok, subject: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.subject).toBeNull();
  });

  it("requires a name, a valid email and a real message", () => {
    expect(contactSchema.safeParse({ ...ok, name: "   " }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, email: "not-an-email" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, email: "a@b" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, message: "too short" }).success).toBe(false);
  });

  it("caps field lengths", () => {
    expect(contactSchema.safeParse({ ...ok, name: "x".repeat(101) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, subject: "x".repeat(151) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, message: "x".repeat(4001) }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, message: "x".repeat(4000) }).success).toBe(true);
  });

  it("strips control characters but keeps line breaks in the message", () => {
    const r = contactSchema.safeParse({ ...ok, name: "Ada\u0000\u0007 Lovelace", message: "Line one\nLine two\u0001 with junk here" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe("Ada Lovelace");
      expect(r.data.message).toBe("Line one\nLine two with junk here");
    }
  });

  it("passes the honeypot and timing fields through untouched for the action to judge", () => {
    const r = contactSchema.safeParse({ ...ok, website: "http://spam.example", startedAt: 123 });
    expect(r.success).toBe(true);
    if (r.success) expect([r.data.website, r.data.startedAt]).toEqual(["http://spam.example", 123]);
  });
});

describe("restoreMessageSchema", () => {
  it("accepts a deleted message snapshot and rejects a bad one", () => {
    const snap = { name: "Ada", email: "ada@example.com", subject: null, message: "hi there", createdAt: "2026-09-20T10:00:00.000Z", readAt: null };
    expect(restoreMessageSchema.safeParse(snap).success).toBe(true);
    expect(restoreMessageSchema.safeParse({ ...snap, email: "nope" }).success).toBe(false);
    expect(restoreMessageSchema.safeParse({ ...snap, createdAt: "yesterday" }).success).toBe(false);
  });
});
