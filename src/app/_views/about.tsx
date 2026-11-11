import type { Metadata } from "next";
import Link from "next/link";

import FallbackImage, { PortraitInitials } from "@/components/shared/FallbackImage";
import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ExperienceTimeline from "@/components/shared/ExperienceTimeline";
import JsonLd from "@/components/shared/JsonLd";
import SocialIcon from "@/components/shared/SocialIcon";
import { currentRole, skillsByLayer } from "@/features/projects/layers";
import { getProfile, localizeProfile } from "@/lib/data/profile";
import { dict } from "@/lib/i18n/dict";
import { languages, localize, type Locale } from "@/lib/i18n/locale";

export async function aboutMetadata(locale: Locale): Promise<Metadata> {
  const profile = localizeProfile(await getProfile(), locale);
  const title = dict(locale).meta.aboutTitle;
  const alternates = { canonical: localize(locale, "/about"), languages: languages("/about") };
  return profile.isPlaceholder ? { title, alternates } : { title, description: profile.headline || undefined, alternates };
}

export async function AboutPage({ locale }: { locale: Locale }) {
  const t = dict(locale).about;
  const profile = localizeProfile(await getProfile(), locale);
  const real = !profile.isPlaceholder;
  const links = profile.links.filter((l) => /^https?:\/\//i.test(l.url));
  const now = currentRole(profile.experience);
  const facts = [
    now && { label: t.now, value: `${now.role} · ${now.company}` },
    profile.location && { label: t.basedIn, value: profile.location },
    { label: t.status, value: profile.availableForWork ? `${t.open}${profile.availabilityNote ? ` · ${profile.availabilityNote}` : ""}` : t.notLooking },
  ].filter((f): f is { label: string; value: string } => !!f);

  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
        {real && (
          <JsonLd
            data={{
              "@type": "Person",
              name: profile.fullName,
              jobTitle: profile.headline || undefined,
              description: profile.summary || undefined,
              image: profile.aboutPhotoUrl ?? undefined,
              email: profile.email ? `mailto:${profile.email}` : undefined,
              url: profile.website || undefined,
              sameAs: links.map((l) => l.url),
              address: profile.location ? { "@type": "PostalAddress", addressLocality: profile.location } : undefined,
            }}
          />
        )}

        {!real ? (
          <section className="page-head">
            <div className="container">
              <h1 className="page-head-title">{t.title}</h1>
              <p className="page-head-lede">{t.soon}</p>
            </div>
          </section>
        ) : (
          <>
            <section className="page-head">
              <div className="container">
                <div className="about-head">
                  <div>
                    <p className="path-label mb-3">~/about</p>
                    <h1 className="page-head-title">{profile.fullName}</h1>
                    {profile.headline && <p className="page-head-lede">{profile.headline}</p>}
                    <dl className="facts about-now mt-4" data-now>
                      {facts.map((f) => (
                        <div key={f.label} className="facts-row">
                          <dt className="mono-meta">{f.label}</dt>
                          <dd>{f.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  {profile.aboutPhotoUrl && (
                    <div className="about-portrait">
                      <FallbackImage
                        src={profile.aboutPhotoUrl}
                        className="img-fluid"
                        alt={t.portrait(profile.fullName)}
                        fallback={<PortraitInitials name={profile.fullName} />}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <div className="about-body">
                  <div className="reading-col">
                    {profile.summary && <p style={{ whiteSpace: "pre-line" }}>{profile.summary}</p>}
                    <p className="page-cta mt-4">
                      <a href="/cv/download">{t.downloadCv}</a> {t.or} <Link href={localize(locale, "/contact")}>{t.getInTouch}</Link>
                    </p>
                  </div>

                  {profile.skills.length > 0 && (
                    <div>
                      <h2 className="selected-work-title">{t.workWith}</h2>
                      <dl className="facts">
                        {skillsByLayer(profile.skills.map((s) => ({ name: s.label, category: s.category }))).map(([layer, names]) => (
                          <div key={layer} className="facts-row about-layer">
                            <dt className="mono-meta">{layer}</dt>
                            <dd className="case-layers">
                              {names.map((n) => (
                                <span key={n} className="layer-chip">{n}</span>
                              ))}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>

                {profile.experience.length > 0 && (
                  <div className="mt-5 pt-3">
                    <h2 className="selected-work-title">{dict(locale).experience.title}</h2>
                    <ExperienceTimeline entries={profile.experience} locale={locale} />
                  </div>
                )}

                {links.length > 0 && (
                  <ul className="list-inline mt-5 mb-0">
                    {links.map((l) => (
                      <li className="list-inline-item me-3" key={l.url}>
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="d-inline-flex align-items-center gap-1 text-muted text-decoration-none">
                          <SocialIcon url={l.url} /> {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <SmallFooter />
    </>
  );
}
