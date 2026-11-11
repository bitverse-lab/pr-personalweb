"use client";

import { useState } from "react";
import ContactForm from "./ContactForm";
import { useSite } from "@/lib/site-context";
import { useDict } from "@/lib/i18n/context";

const bare = (url: string) => url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

// Copy and direct details on the left, the form beside them. Only details actually filled in are shown;
// the status row always is, because "not looking" is an answer too.
export default function ContactSection({
  heading,
  id = "contact",
  level = 2,
  dark = false,
}: {
  heading?: string;
  id?: string;
  level?: 1 | 2;
  dark?: boolean;
}) {
  const site = useSite();
  const t = useDict().contact;
  const links = site.links.filter((l) => /^https?:\/\//i.test(l.url));
  const Heading = level === 1 ? "h1" : "h2";
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the mailto link still works.
    }
  };

  return (
    <section className={dark ? "section contact-dark" : "section"} id={id}>
      <div className="container">
        <div className="contact-grid">
          <div>
            <Heading className="contact-title">{heading ?? t.heading}</Heading>
            <p className="contact-lede">{t.lede}</p>
            <dl className="contact-rows">
              {site.email && (
                <div>
                  <dt>{t.email}</dt>
                  <dd>
                    <a href={`mailto:${site.email}`}>{site.email}</a>{" "}
                    <button type="button" className="contact-copy" onClick={copyEmail} aria-label={copied ? t.copiedAria : t.copyAria}>
                      {copied ? t.copied : t.copy}
                    </button>
                    <span className="visually-hidden" aria-live="polite">{copied ? t.copiedAria : ""}</span>
                  </dd>
                </div>
              )}
              {links.map((l) => (
                <div key={l.url}>
                  <dt>{l.label.toLowerCase()}</dt>
                  <dd><a href={l.url} target="_blank" rel="noopener noreferrer">{bare(l.url)}</a></dd>
                </div>
              ))}
              {site.location && (
                <div>
                  <dt>{t.basedIn}</dt>
                  <dd>{site.location}</dd>
                </div>
              )}
              <div data-testid="contact-status">
                <dt>{t.status}</dt>
                <dd className={site.available ? "contact-open" : undefined}>
                  {site.available ? `${t.open}${site.availabilityNote ? ` · ${site.availabilityNote}` : ` ${t.toWork}`}` : t.notLooking}
                </dd>
              </div>
            </dl>
          </div>

          <div className="contact-form-card">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
