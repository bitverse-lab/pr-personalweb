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
              <figure className="card border-0 bg-white h-100 mb-0">
                <blockquote className="card-body p-4 rounded shadow m-2 mb-0">
                  <i className="mdi mdi-format-quote-open fs-1 text-primary" aria-hidden="true" />
                  <p className="text-muted mb-0" style={{ whiteSpace: "pre-line" }}>“{t.quote}”</p>
                  <footer className="d-flex align-items-start justify-content-between gap-3 mt-4">
                    <span>
                      <span className="fw-semibold d-block">{t.authorName}</span>
                      {(t.authorRole || t.company) && <span className="text-muted small d-block">{[t.authorRole, t.company].filter(Boolean).join(" · ")}</span>}
                    </span>
                    {t.sourceUrl && (
                      <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="small d-inline-flex align-items-center gap-1 flex-shrink-0">
                        View source <FiExternalLink aria-hidden />
                      </a>
                    )}
                  </footer>
                </blockquote>
              </figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
