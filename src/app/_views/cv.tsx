import type { Metadata } from "next";
import Link from "next/link";
import { FiDownload } from "react-icons/fi";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ExperienceTimeline from "@/components/shared/ExperienceTimeline";
import { skillsByLayer } from "@/features/projects/layers";
import { getCvFiles } from "@/lib/data/cv-files";
import { getProfile, localizeProfile } from "@/lib/data/profile";
import { dict } from "@/lib/i18n/dict";
import { languages, localize, type Locale } from "@/lib/i18n/locale";

export async function cvMetadata(locale: Locale): Promise<Metadata> {
  const profile = localizeProfile(await getProfile(), locale);
  const alternates = { canonical: localize(locale, "/cv"), languages: languages("/cv") };
  return profile.isPlaceholder ? { title: "CV", alternates } : { title: "CV", description: profile.headline || undefined, alternates };
}

const bare = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

// The CV is one sheet: it reads on screen and prints cleanly (the site chrome is hidden in print).
export async function CvPage({ locale }: { locale: Locale }) {
  const t = dict(locale).cv;
  const [full, files] = await Promise.all([getProfile(), getCvFiles()]);
  const profile = localizeProfile(full, locale);
  const real = !profile.isPlaceholder;
  const contact = [
    profile.location && { key: "location", value: profile.location },
    profile.email && { key: "email", value: profile.email, href: `mailto:${profile.email}` },
    profile.website && { key: "web", value: bare(profile.website), href: profile.website },
    ...profile.links.map((l) => ({ key: l.label.toLowerCase(), value: bare(l.url), href: l.url })),
  ].filter((c): c is { key: string; value: string; href?: string } => !!c);
  const empty = profile.experience.length === 0 && profile.education.length === 0 && profile.skills.length === 0 && profile.projects.length === 0;

  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
        {!real ? (
          <section className="page-head">
            <div className="container">
              <h1 className="page-head-title">CV</h1>
              <p className="page-head-lede">{t.soon}</p>
            </div>
          </section>
        ) : (
          <section className="cv-page">
            <div className="container">
              <div className="cv-actions">
                <p className="path-label mb-0">~/cv</p>
                {/* The owner's own PDFs, one per kind of job; the page below is the same CV for the web. */}
                {files.length > 0 && (
                  <div id="cv-files" className="d-flex flex-wrap gap-2" role="group" aria-label={t.downloads}>
                    {files.map((f) => (
                      <a key={f.role} href={`/cv/download/${f.role}`} className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2">
                        <FiDownload aria-hidden /> {t.downloadFor(f.title)}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <article className="cv-sheet">
                <header className="cv-head">
                  <div>
                    <h1 className="cv-name">{profile.fullName}</h1>
                    {profile.headline && <p className="cv-headline">{profile.headline}</p>}
                  </div>
                  {contact.length > 0 && (
                    <dl className="cv-contact">
                      {contact.map((c) => (
                        <div key={`${c.key}-${c.value}`}>
                          <dt className="mono-meta">{c.key}</dt>
                          <dd>{c.href ? <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{c.value}</a> : c.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </header>

                {profile.summary && <p className="cv-summary">{profile.summary}</p>}

                {profile.highlights.length > 0 && (
                  <section className="cv-section">
                    <h2 className="mono-meta cv-label">{t.proof}</h2>
                    <ul className="cv-proof list-unstyled mb-0" data-proof>
                      {profile.highlights.map((h) => (
                        <li key={h.metric}>
                          <span className="cv-proof-value">{h.value}</span>
                          <span className="cv-proof-note">{h.note || h.metric.replace(/_/g, " ")}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {profile.experience.length > 0 && (
                  <section className="cv-section">
                    <h2 className="mono-meta cv-label">{t.experience}</h2>
                    <ExperienceTimeline entries={profile.experience} locale={locale} />
                  </section>
                )}

                {profile.projects.length > 0 && (
                  <section className="cv-section">
                    <h2 className="mono-meta cv-label">{t.projects}</h2>
                    <ul className="list-unstyled mb-0">
                      {profile.projects.map((p) => (
                        <li className="cv-item" key={p.slug}>
                          <p className="cv-item-title">
                            <Link href={localize(locale, `/projects/${p.slug}`)}>{p.title}</Link>
                            {p.role && <span className="cv-item-meta"> · {p.role}</span>}
                          </p>
                          {p.summary && <p className="cv-item-text">{p.summary}</p>}
                          {p.technologies.length > 0 && <p className="mono-meta mb-0">{p.technologies.join(" · ")}</p>}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {profile.education.length > 0 && (
                  <section className="cv-section">
                    <h2 className="mono-meta cv-label">{t.education}</h2>
                    <ul className="list-unstyled mb-0">
                      {profile.education.map((e) => (
                        <li className="cv-item" key={`${e.school}-${e.period}`}>
                          <p className="cv-item-title">
                            {e.school}
                            <span className="cv-item-meta"> · {e.period}</span>
                          </p>
                          {e.detail && <p className="cv-item-text mb-0">{e.detail}</p>}
                          {e.description && <p className="cv-item-text" style={{ whiteSpace: "pre-line" }}>{e.description}</p>}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {profile.skills.length > 0 && (
                  <section className="cv-section">
                    <h2 className="mono-meta cv-label">{t.skills}</h2>
                    <dl className="facts mb-0">
                      {skillsByLayer(profile.skills.map((s) => ({ name: s.label, category: s.category }))).map(([layer, names]) => (
                        <div key={layer} className="facts-row about-layer">
                          <dt className="mono-meta">{layer}</dt>
                          <dd>{names.join(" · ")}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}

                {empty && <p className="cv-item-text mt-4 mb-0">{t.empty}</p>}
              </article>
            </div>
          </section>
        )}
      </main>
      <SmallFooter />
    </>
  );
}
