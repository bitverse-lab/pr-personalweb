import { FiExternalLink } from "react-icons/fi";
import type { PublicTestimonial } from "@/lib/data/testimonials";

export default function TestimonialsSection({ items }: { items: PublicTestimonial[] }) {
  if (items.length === 0) return null;
  return (
    <section className="section bg-light" id="testimonials">
      <div className="container">
        <div className="section-title text-center mb-4 pb-2">
          <h2 className="h4 title mb-3">What people say</h2>
        </div>
        <div className="row justify-content-center">
          {items.map((t) => (
            <div className={`${items.length === 1 ? "col-lg-8" : "col-lg-4 col-md-6"} mt-4`} key={t.id}>
              <figure className="card border-0 shadow rounded h-100 mb-0">
                <blockquote className="card-body mb-0">
                  <p className="text-muted mb-0" style={{ whiteSpace: "pre-line" }}>“{t.quote}”</p>
                </blockquote>
                <figcaption className="card-footer bg-transparent border-0 pt-0 pb-4 px-4">
                  <span className="fw-semibold d-block">{t.authorName}</span>
                  {(t.authorRole || t.company) && <span className="text-muted small d-block">{[t.authorRole, t.company].filter(Boolean).join(" · ")}</span>}
                  {t.sourceUrl && (
                    <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="small d-inline-flex align-items-center gap-1 mt-1">
                      View source <FiExternalLink aria-hidden />
                    </a>
                  )}
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
