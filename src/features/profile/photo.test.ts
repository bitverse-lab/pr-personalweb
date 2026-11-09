import { describe, expect, it } from "vitest";
import { resolveProfilePhotoUrls } from "./photo";

describe("profile photo display", () => {
  it("uses the hero photo for About until a dedicated About photo is chosen", () => {
    expect(resolveProfilePhotoUrls("/hero.jpg", null)).toEqual({
      heroPhotoUrl: "/hero.jpg",
      aboutPhotoUrl: "/hero.jpg",
    });
  });

  it("keeps the hero and About photos independent when both are set", () => {
    expect(resolveProfilePhotoUrls("/hero.jpg", "/about.jpg")).toEqual({
      heroPhotoUrl: "/hero.jpg",
      aboutPhotoUrl: "/about.jpg",
    });
  });

  it("allows both photos to be absent", () => {
    expect(resolveProfilePhotoUrls(null, null)).toEqual({
      heroPhotoUrl: null,
      aboutPhotoUrl: null,
    });
  });
});
