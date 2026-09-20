"use client";

import { FiMail, FiMapPin } from "react-icons/fi";
import ContactForm from "./ContactForm";
import SocialIcon from "./SocialIcon";
import { useSite } from "@/lib/site-context";

// Form on one side, real contact details on the other. Only details you have actually filled in are shown.
export default function ContactSection({ heading = "Get in touch", id = "contact" }: { heading?: string; id?: string }) {
  const site = useSite();
  const links = site.links.filter((l) => /^https?:\/\//i.test(l.url));
  const hasDetails = !!site.email || !!site.location || links.length > 0 || site.available;

  return (
    <section className="section" id={id}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="section-title text-center mb-4 pb-2">
              <h2 className="h4 title mb-3">{heading}</h2>
              <p className="para-desc text-muted mx-auto mb-0">Have a question, an opportunity or a project in mind? Send a message and I will reply as soon as I can.</p>
            </div>
          </div>
        </div>

        <div className="row align-items-start justify-content-center">
          <div className={hasDetails ? "col-lg-7 col-md-7 col-12 mt-4" : "col-lg-8 col-12 mt-4"}>
            <div className="card rounded shadow">
              <div className="card-body">
                <ContactForm />
              </div>
            </div>
          </div>

          {hasDetails && (
            <div className="col-lg-5 col-md-5 col-12 mt-4">
              <div className="ms-lg-4">
                {site.available && (
                  <div className="alert alert-success d-flex align-items-start gap-2 py-2" role="status">
                    <span className="mt-1 rounded-circle bg-success d-inline-block flex-shrink-0" style={{ width: 10, height: 10 }} aria-hidden />
                    <span>
                      <strong>Available for work</strong>
                      {site.availabilityNote && <span className="d-block small">{site.availabilityNote}</span>}
                    </span>
                  </div>
                )}
                {site.email && (
                  <div className="d-flex features feature-primary feature-clean mb-4">
                    <div className="icons text-center mx-auto rounded">
                      <FiMail className="icon d-block h4 mb-0" aria-hidden />
                    </div>
                    <div className="flex-1 ms-3">
                      <h3 className="h5 mb-1">Email</h3>
                      <a href={`mailto:${site.email}`} className="link">{site.email}</a>
                    </div>
                  </div>
                )}
                {site.location && (
                  <div className="d-flex features feature-primary feature-clean mb-4">
                    <div className="icons text-center mx-auto rounded">
                      <FiMapPin className="icon d-block h4 mb-0" aria-hidden />
                    </div>
                    <div className="flex-1 ms-3">
                      <h3 className="h5 mb-1">Location</h3>
                      <p className="text-muted mb-0">{site.location}</p>
                    </div>
                  </div>
                )}
                {links.length > 0 && (
                  <div>
                    <h3 className="h6 mb-2">Find me online</h3>
                    <ul className="list-unstyled mb-0">
                      {links.map((l) => (
                        <li key={l.url} className="mb-1">
                          <a href={l.url} target="_blank" rel="noopener noreferrer" className="d-inline-flex align-items-center gap-2 text-decoration-none">
                            <SocialIcon url={l.url} /> {l.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
