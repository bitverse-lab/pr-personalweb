import { FiExternalLink } from "react-icons/fi";
import type { PublicTestimonial } from "@/lib/data/testimonials";

const initials = (name: string) =>
  name
    .replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

// Testimonials read as code-review approvals: who reviewed, in what role, and what they said.
// The words are theirs, unedited; only the frame is a pull-request review.
export default function TestimonialsSection({ items }: { items: PublicTestimonial[] }) {
  if (items.length === 0) return null;
  return (
    <section className="section bg-light" id="testimonials" aria-labelledby="testimonials-title">
      <div className="container">
        <h2 id="testimonials-title" className="selected-work-title">
          What people say <span className="path-label review-count">{items.length} approving review{items.length === 1 ? "" : "s"}</span>
        </h2>
        <div className="reviews">
          {items.map((t) => (
            <figure className="review" key={t.id}>
              <figcaption className="review-head">
                <span className="review-avatar" aria-hidden="true">{initials(t.authorName)}</span>
                <span className="review-who">
                  <span className="review-name">{t.authorName}</span>
                  {(t.authorRole || t.company) && <span className="review-role">{[t.authorRole, t.company].filter(Boolean).join(" · ")}</span>}
                </span>
                <span className="review-badge">✓ approved</span>
              </figcaption>
              <blockquote className="review-body testimonial-quote" style={{ whiteSpace: "pre-line" }}>
                {t.quote}
              </blockquote>
              {t.sourceUrl && (
                <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="review-source small d-inline-flex align-items-center gap-1">
                  View source <FiExternalLink aria-hidden />
                </a>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
