import { describe, expect, it } from "vitest";
import { clientIp, createRateLimit } from "./rate-limit";

describe("createRateLimit", () => {
  it("allows the limit per window, then reports the wait", () => {
    const hit = createRateLimit(2, 60_000);
    expect(hit("a", 0)).toBe(0);
    expect(hit("a", 1_000)).toBe(0);
    expect(hit("a", 30_000)).toBe(30);
    expect(hit("b", 30_000)).toBe(0); // keys are counted apart
    expect(hit("a", 60_000)).toBe(0); // a new window
  });
});

describe("clientIp", () => {
  it("takes the first forwarded address", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("");
  });
});
