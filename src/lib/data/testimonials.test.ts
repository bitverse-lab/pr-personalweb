import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/server/repositories/article-repository", () => ({ articleRepository: { ownerId: vi.fn() } }));
vi.mock("@/server/repositories/testimonial-repository", () => ({ testimonialRepository: { listPublished: vi.fn() } }));
vi.mock("@/lib/report-error", () => ({ reportError: vi.fn() }));

import { reportError } from "@/lib/report-error";
import { articleRepository } from "@/server/repositories/article-repository";
import { testimonialRepository } from "@/server/repositories/testimonial-repository";
import { getPublishedTestimonials } from "./testimonials";

beforeEach(() => vi.clearAllMocks());

test("a database failure hides the section and is reported, not swallowed", async () => {
  vi.mocked(articleRepository.ownerId).mockResolvedValue("owner-1");
  vi.mocked(testimonialRepository.listPublished).mockRejectedValue(new Error("down"));

  expect(await getPublishedTestimonials()).toEqual([]);
  expect(reportError).toHaveBeenCalledWith("public-read", expect.any(Error));
});

test("published testimonials are mapped with empty strings for missing role and company", async () => {
  vi.mocked(articleRepository.ownerId).mockResolvedValue("owner-1");
  vi.mocked(testimonialRepository.listPublished).mockResolvedValue([
    { id: "t1", quote: "Great", authorName: "Ana", authorRole: null, company: null, sourceUrl: null },
  ] as never);

  expect(await getPublishedTestimonials()).toEqual([
    { id: "t1", quote: "Great", authorName: "Ana", authorRole: "", company: "", sourceUrl: null },
  ]);
});
