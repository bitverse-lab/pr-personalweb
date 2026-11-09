import type { Metadata } from "next";
import Link from "next/link";
import { FiDownload, FiMapPin } from "react-icons/fi";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import JsonLd from "@/components/shared/JsonLd";
import SocialIcon from "@/components/shared/SocialIcon";
import { getProfile } from "@/lib/data/profile";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return profile.isPlaceholder ? { title: "About" } : { title: `About — ${profile.fullName}`, description: profile.headline || undefined };
}

export default async function AboutPage() {
  const profile = await getProfile();
  const real = !profile.isPlaceholder;
  const links = profile.links.filter((l) => /^https?:\/\//i.test(l.url));

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

        <section className="section">
          <div className="container">
            {!real ? (
              <div className="text-center py-5">
                <h1 className="h4 mb-2">About</h1>
                <p className="text-muted mb-0">This page will be available soon.</p>
              </div>
            ) : (
              <div className="row align-items-center">
                {profile.aboutPhotoUrl && (
                  <div className="col-lg-5 col-md-6">
                    <div className="position-relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={profile.aboutPhotoUrl} className="rounded-pill shadow img-fluid" alt={`Portrait of ${profile.fullName}`} />
                      <div className="position-absolute top-0 start-0 z-index-m-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={profile.dotsImage} className="avatar avatar-xl-large" alt="" />
                      </div>
                    </div>
                  </div>
                )}

                <div className={profile.aboutPhotoUrl ? "col-lg-7 col-md-6 mt-4 mt-sm-0 pt-2 pt-sm-0" : "col-lg-9 mx-auto"}>
                  <div className={profile.aboutPhotoUrl ? "ms-lg-5" : ""}>
                    <div className="section-title">
                      <span className="badge rounded-pill bg-soft-primary">About Me</span>
                      <h1 className="h4 title mt-2 mb-2">{profile.fullName}</h1>
                      {profile.headline && <p className="h6 text-primary mb-3">{profile.headline}</p>}
                      {profile.location && (
                        <p className="text-muted small mb-3 d-flex align-items-center gap-1">
                          <FiMapPin aria-hidden /> {profile.location}
                        </p>
                      )}
                      {profile.availableForWork && (
                        <p className="mb-3">
                          <span className="badge rounded-pill bg-soft-success text-success">Available for work{profile.availabilityNote ? ` · ${profile.availabilityNote}` : ""}</span>
                        </p>
                      )}
                      {profile.summary && (
                        <p className="para-desc text-muted pb-0" style={{ whiteSpace: "pre-line" }}>
                          {profile.summary}
                        </p>
                      )}
                    </div>

                    {profile.skills.map((skill) => (
                      <div className="progress-box mt-4" key={skill.label}>
                        <h2 className="h6 title fw-normal text-muted">{skill.label}</h2>
                        <div className="progress" role="progressbar" aria-label={`${skill.label} proficiency`} aria-valuenow={skill.percent} aria-valuemin={0} aria-valuemax={100}>
                          <div className="progress-bar position-relative bg-primary" style={{ width: `${skill.percent}%` }}>
                            <div className="progress-value d-block text-muted h6">{skill.percent}%</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="mt-4 d-flex flex-wrap gap-2">
                      <a href="/cv/download" className="btn btn-primary d-inline-flex align-items-center gap-2">
                        <FiDownload aria-hidden /> Download CV
                      </a>
                      <Link href="/contact" className="btn btn-outline-primary">
                        Contact me
                      </Link>
                    </div>

                    {links.length > 0 && (
                      <ul className="list-inline mt-4 mb-0">
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
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <SmallFooter />
    </>
  );
}
