import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import CoverBlock from "@/components/shared/CoverBlock";
import { vt } from "@/lib/view-transition";
import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import RichTextRenderer from "@/components/shared/RichTextRenderer";
import JsonLd from "@/components/shared/JsonLd";
import PrevNext from "@/components/shared/PrevNext";
import ProjectGallery from "@/components/projects/ProjectGallery";
import { siteUrl } from "@/lib/site";
import { getProfile } from "@/lib/data/profile";
import { getAdjacentProjects, getProjectBySlug, getProjects } from "@/lib/data/projects";
import { docToPlainText } from "@/features/content/richtext";
import { layersOf } from "@/features/projects/layers";
import { dict } from "@/lib/i18n/dict";
import { languages, localize, type Locale } from "@/lib/i18n/locale";
import { localizeProject, localizeProjectPage } from "@/lib/i18n/content";

export async function projectMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const found = await getProjectBySlug(slug);
  const project = found && localizeProjectPage(found, locale);
  if (!project) return { title: dict(locale).project.notFound };
  const description = project.summary || undefined;
  return {
    title: project.name,
    description,
    alternates: { canonical: localize(locale, `/projects/${project.slug}`), languages: languages(`/projects/${project.slug}`) },
    openGraph: { type: "article", title: project.name, description, url: localize(locale, `/projects/${project.slug}`), images: [project.detail.coverUrl ? { url: project.detail.coverUrl } : { url: "/og-default.png", width: 1200, height: 630 }] },
  };
}

// Deliberately not wrapped in publicRead (CLAUDE.md): null means "no such project" → 404; an outage must error.
export async function ProjectDetailPage({ locale, slug }: { locale: Locale; slug: string }) {
  const t = dict(locale).project;
  const found = await getProjectBySlug(slug);
  if (!found) notFound();
  const project = localizeProjectPage(found, locale);
  const [profile, all] = await Promise.all([getProfile(), getProjects().then((list) => list.map((p) => localizeProject(p, locale)))]);
  const { prev, next } = getAdjacentProjects(all, project.slug);
  const { detail } = project;
  const hasStory = docToPlainText(detail.content).length > 0;
  // Only an image that is the card's cover morphs from it; otherwise just the title moves.
  const coverIndex = project.gallery.findIndex((g) => g.url === project.image);
  const layers = layersOf(project.technologies, profile.skills.map((s) => ({ name: s.label, category: s.category })));
  const meta = [project.period, detail.client, detail.role].filter(Boolean).join(" · ");

  const facts = [
    detail.client ? { label: t.client, value: detail.client } : null,
    detail.role ? { label: t.role, value: detail.role } : null,
    project.label ? { label: t.category, value: project.label } : null,
    detail.location ? { label: t.location, value: detail.location } : null,
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
            url: `${siteUrl()}${localize(locale, `/projects/${project.slug}`)}`,
          }}
        />
        <section className="page-head">
          <div className="container">
            <p className="mono-meta mb-3">
              <Link href={localize(locale, "/projects")} className="path-label">← ~/work</Link>
              {meta && <span> · {meta}</span>}
            </p>
            <h1 className="page-head-title" style={vt("title", project.slug)}>{project.name}</h1>
            {project.summary && <p className="page-head-lede">{project.summary}</p>}
            {layers.length > 0 && (
              <div className="case-layers mt-3" data-testid="project-layers" aria-label={t.layersAria}>
                {layers.map((l) => (
                  <span key={l} className={`layer-chip ${l === "ml" || l === "model" ? "layer-chip--ml" : ""}`}>{l}</span>
                ))}
              </div>
            )}
            {project.outcome && <p className="project-outcome" data-testid="project-outcome">{project.outcome}</p>}
          </div>
        </section>

        <section className="section pt-4">
          <div className="container">
            <div className="project-layout">
              <div className="project-main">
                {project.gallery.length > 0 ? (
                  <ProjectGallery images={project.gallery} name={project.name} vtIndex={coverIndex} vtStyle={vt("cover", project.slug)} />
                ) : (
                  <CoverBlock src={project.image} title={project.name} vtStyle={vt("cover", project.slug)} />
                )}

                {hasStory && (
                  <div className="reading-col mt-5">
                    <RichTextRenderer doc={detail.content} />
                  </div>
                )}

                <PrevNext
                  prev={prev ? { href: localize(locale, `/projects/${prev.slug}`), title: prev.name } : null}
                  next={next ? { href: localize(locale, `/projects/${next.slug}`), title: next.name } : null}
                  prevLabel={t.prev}
                  nextLabel={t.next}
                  aria={dict(locale).more.aria}
                />
              </div>

              <aside className="project-facts" aria-label={t.factsAria}>
                {facts.length > 0 && (
                  <dl className="facts">
                    {facts.map((f) => (
                      <div key={f.label} className="facts-row">
                        <dt className="mono-meta">{f.label}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {project.technologies.length > 0 && (
                  <div className="mt-4">
                    <p className="mono-meta mb-2">{t.builtWith}</p>
                    <p className="facts-tech">{project.technologies.join(" · ")}</p>
                  </div>
                )}
                {detail.links.length > 0 && (
                  <ul className="list-unstyled mt-4 mb-0">
                    {detail.links.map((l) => (
                      <li key={l.url} className="mb-2">
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="facts-link">{l.label} ↗</a>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            </div>

            <p className="page-cta mt-5">
              {t.cta} <Link href={localize(locale, "/contact")}>{t.ctaLink}</Link>
            </p>
          </div>
        </section>
      </main>
      <SmallFooter />
    </>
  );
}
