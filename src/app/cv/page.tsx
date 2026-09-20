import type { Metadata } from "next";
import Link from "next/link";
import { FiDownload, FiGlobe, FiLink, FiMail, FiMapPin } from "react-icons/fi";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ExperienceTimeline from "@/components/shared/ExperienceTimeline";
import { getProfile } from "@/lib/data/profile";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return profile.isPlaceholder ? { title: "CV" } : { title: `CV — ${profile.fullName}`, description: profile.headline || undefined };
}

export default async function CvPage() {
  const profile = await getProfile();
  const real = !profile.isPlaceholder;

  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>

      {!real && (
        <section className="section">
          <div className="container text-center py-5">
            <h1 className="h4 mb-2">CV</h1>
            <p className="text-muted mb-0">My CV will be available soon.</p>
          </div>
        </section>
      )}

      {real && (
        <section className="section pb-0">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-9">
                <div className="card border-0 shadow rounded p-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                    <div>
                      <h1 className="h3 mb-1">{profile.fullName}</h1>
                      {profile.headline && <p className="text-primary mb-2">{profile.headline}</p>}
                      <ul className="list-inline text-muted small mb-0">
                        {profile.location && (
                          <li className="list-inline-item me-3"><FiMapPin className="me-1" aria-hidden />{profile.location}</li>
                        )}
                        {profile.email && (
                          <li className="list-inline-item me-3"><FiMail className="me-1" aria-hidden /><a href={`mailto:${profile.email}`} className="text-muted">{profile.email}</a></li>
                        )}
                        {profile.website && (
                          <li className="list-inline-item me-3"><FiGlobe className="me-1" aria-hidden /><a href={profile.website} className="text-muted" rel="noopener noreferrer">{profile.website.replace(/^https?:\/\//, "")}</a></li>
                        )}
                        {profile.links.map((l) => (
                          <li className="list-inline-item me-3" key={l.url}>
                            <FiLink className="me-1" aria-hidden />
                            <a href={l.url} className="text-muted" target="_blank" rel="noopener noreferrer">{l.label}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <a href="/cv/download" className="btn btn-primary d-inline-flex align-items-center gap-1">
                      <FiDownload aria-hidden /> Download PDF
                    </a>
                  </div>
                  {profile.summary && <p className="text-muted mt-4 mb-0" style={{ whiteSpace: "pre-line" }}>{profile.summary}</p>}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {profile.experience.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 text-center">
                <div className="section-title mb-4 pb-2">
                  <div className="position-relative">
                    <h2 className="h4 title mb-4">Work Experience</h2>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-12 mt-4 pt-2">
                <ExperienceTimeline entries={profile.experience} />
              </div>
            </div>
          </div>
        </section>
      )}

      {real && profile.education.length > 0 && (
        <section className="section bg-light">
          <div className="container">
            <div className="section-title text-center mb-4">
              <h4 className="title mb-0">Education</h4>
            </div>
            <div className="row justify-content-center">
              <div className="col-lg-8">
                {profile.education.map((e) => (
                  <div className="card border-0 shadow rounded p-4 mt-3" key={`${e.school}-${e.period}`}>
                    <div className="d-flex justify-content-between flex-wrap gap-2">
                      <h6 className="mb-0">{e.school}</h6>
                      <small className="text-muted">{e.period}</small>
                    </div>
                    {e.detail && <div className="text-muted">{e.detail}</div>}
                    {e.description && <p className="text-muted small mt-2 mb-0" style={{ whiteSpace: "pre-line" }}>{e.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {real && profile.projects.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-title text-center mb-4">
              <h4 className="title mb-0">Selected Projects</h4>
            </div>
            <div className="row justify-content-center">
              <div className="col-lg-8">
                {profile.projects.map((p) => (
                  <div className="card border-0 shadow rounded p-4 mt-3" key={p.slug}>
                    <div className="d-flex justify-content-between flex-wrap gap-2">
                      <h6 className="mb-0"><Link href={`/projects/${p.slug}`} className="text-dark">{p.title}</Link></h6>
                      {p.role && <small className="text-muted">{p.role}</small>}
                    </div>
                    {p.summary && <p className="text-muted small mt-2 mb-0">{p.summary}</p>}
                    {p.technologies.length > 0 && <div className="text-muted small mt-2">{p.technologies.join(" · ")}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {real && profile.skills.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-title text-center mb-4">
              <h4 className="title mb-0">Skills</h4>
            </div>
            <div className="row justify-content-center">
              <div className="col-lg-8">
                {profile.skills.map((skill) => (
                  <div className="progress-box mt-4" key={skill.label}>
                    <h6 className="title fw-normal text-muted">{skill.label}</h6>
                    <div className="progress">
                      <div className="progress-bar position-relative bg-primary" style={{ width: `${skill.percent}%` }}>
                        <div className="progress-value d-block text-muted h6">{skill.percent}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {real && profile.experience.length === 0 && profile.education.length === 0 && profile.skills.length === 0 && profile.projects.length === 0 && (
        <section className="section">
          <div className="container text-center text-muted">Experience, education and skills will show up here once added.</div>
        </section>
      )}

      </main>
      <SmallFooter />
    </>
  );
}
