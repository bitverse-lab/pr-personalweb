import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import Link from "next/link";
import CoverBlock from "@/components/shared/CoverBlock";
import { AiOutlineCalendar, AiOutlineUser } from "react-icons/ai";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import RichTextRenderer from "@/components/shared/RichTextRenderer";
import JsonLd from "@/components/shared/JsonLd";
import { siteUrl } from "@/lib/site";
import { getProfile } from "@/lib/data/profile";
import { getAdjacentProjects, getProjectBySlug, getProjects } from "@/lib/data/projects";
import PrevNext from "@/components/shared/PrevNext";
import { docToPlainText } from "@/features/content/richtext";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  const description = project.summary || undefined;
  return {
    title: project.name,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: { type: "article", title: project.name, description, url: `/projects/${project.slug}`, images: [project.detail.coverUrl ? { url: project.detail.coverUrl } : { url: "/og-default.png", width: 1200, height: 630 }] },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  const [profile, all] = await Promise.all([getProfile(), getProjects()]);
  const { prev, next } = getAdjacentProjects(all, project.slug);
  const { detail } = project;
  const hasStory = docToPlainText(detail.content).length > 0;

  const rows = [
    detail.client ? { label: "Client", value: detail.client } : null,
    detail.role ? { label: "Role", value: detail.role } : null,
    project.label ? { label: "Category", value: project.label } : null,
    project.period ? { label: "Date", value: project.period } : null,
    detail.location ? { label: "Location", value: detail.location } : null,
    project.technologies.length ? { label: "Technologies", value: project.technologies.join(", ") } : null,
  ].filter((r): r is { label: string; value: string } => r !== null);

  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
      <JsonLd
        data={{
          "@type": "CreativeWork",
          name: project.name,
          description: project.summary || undefined,
          dateCreated: detail.startDate ?? undefined,
          image: detail.coverUrl ? [detail.coverUrl] : undefined,
          keywords: project.technologies.join(", ") || undefined,
          creator: { "@type": "Person", name: profile.fullName },
          url: `${siteUrl()}/projects/${project.slug}`,
        }}
      />
      <section className="bg-half-170 bg-light d-table w-100">
        <div className="container">
          <div className="row mt-5 justify-content-center">
            <div className="col-12">
              <div className="title-heading text-center">
                <ul className="list-inline">
                  <li className="list-inline-item me-3">
                    <AiOutlineUser className="h5 mb-0" />
                    <Link href="/about" className="text-primary">
                      {" "}
                      {profile.firstName}
                    </Link>
                  </li>
                  {project.period && (
                    <li className="list-inline-item text-muted me-3">
                      <AiOutlineCalendar className="h5 text-dark mb-0" /> {project.period}
                    </li>
                  )}
                </ul>

                <h1 className="h5 heading fw-semibold sub-heading mb-0">{project.name}</h1>
                {project.summary && <p className="text-muted mt-3 mb-0 mx-auto" style={{ maxWidth: 640 }}>{project.summary}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="row">
            <div className="col-md-6 col-lg-8">
              {project.gallery.length > 0 ? (
                project.gallery.map((image, index) => (
                  <figure className={index > 0 ? "mt-4 mb-0" : "mb-0"} key={image.url}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} loading={index === 0 ? "eager" : "lazy"} decoding="async" className="img-fluid rounded shadow" alt={image.caption || `${project.name} — image ${index + 1}`} />
                    {image.caption && <figcaption className="text-muted small mt-2">{image.caption}</figcaption>}
                  </figure>
                ))
              ) : (
                <CoverBlock src={project.image} title={project.name} className="shadow" />
              )}

              {hasStory && (
                <div className="section-title mt-4 pt-2">
                  <h4 className="mb-4">About this project</h4>
                  <RichTextRenderer doc={detail.content} />
                </div>
              )}

              <PrevNext
                prev={prev ? { href: `/projects/${prev.slug}`, title: prev.name } : null}
                next={next ? { href: `/projects/${next.slug}`, title: next.name } : null}
                prevLabel="Previous project"
                nextLabel="Next project"
              />
            </div>

            <div className="col-lg-4 col-md-6 mt-4 mt-sm-0 pt-2 pt-sm-0">
              <div className="sidebar sticky-bar ms-lg-4">
                <div className="widget">
                  <h6 className="widget-title font-weight-bold pt-2 pb-2 bg-light rounded text-center">Project Details</h6>

                  <dl className="row mb-0 mt-4">
                    {rows.map((r) => (
                      <Fragment key={r.label}>
                        <dt className="col-md-4 fw-medium col-5">{r.label} :</dt>
                        <dd className="col-md-8 col-7 text-muted">{r.value}</dd>
                      </Fragment>
                    ))}
                    {detail.links.map((l) => (
                      <Fragment key={l.url}>
                        <dt className="col-md-4 fw-medium col-5">{l.label} :</dt>
                        <dd className="col-md-8 col-7 text-muted">
                          <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-reset">
                            {l.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          </a>
                        </dd>
                      </Fragment>
                    ))}
                  </dl>
                </div>

                {project.technologies.length > 0 && (
                  <div className="widget mt-4 pt-2 text-center">
                    <h6 className="widget-title font-weight-bold pt-2 pb-2 bg-light rounded">Built with</h6>
                    <div className="tagcloud text-center mt-4">
                      {project.technologies.map((tag) => (
                        <span className="badge bg-soft-primary text-primary m-1" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mt-100 mt-60">
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="section-title text-center">
                <h6 className="text-primary fw-normal mb-3">Open to new opportunities</h6>
                <h2 className="h1 title mb-4">
                  Want to work together? <br /> Let&apos;s talk.
                </h2>
                <div className="mt-4 d-flex justify-content-center gap-2">
                  <Link href="/contact" className="btn btn-primary">
                    Contact me
                  </Link>
                  <Link href="/projects" className="btn btn-outline-primary">
                    More projects
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
      <SmallFooter />
    </>
  );
}
