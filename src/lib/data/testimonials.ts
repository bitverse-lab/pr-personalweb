import { articleRepository } from "@/server/repositories/article-repository";
import { testimonialRepository } from "@/server/repositories/testimonial-repository";

export interface PublicTestimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  company: string;
  sourceUrl: string | null;
}

// Published testimonials of the site owner, for the home page. Never throws: a failure just hides the section.
export async function getPublishedTestimonials(limit = 6): Promise<PublicTestimonial[]> {
  try {
    const owner = await articleRepository.ownerId();
    if (!owner) return [];
    const rows = await testimonialRepository.listPublished(owner, limit);
    return rows.map((r) => ({ id: r.id, quote: r.quote, authorName: r.authorName, authorRole: r.authorRole ?? "", company: r.company ?? "", sourceUrl: r.sourceUrl }));
  } catch {
    return [];
  }
}
