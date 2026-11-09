"use client";

import { useState } from "react";
import Link from "next/link";
import Lightbox from "react-18-image-lightbox";
import "react-18-image-lightbox/style.css";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ResponsiveProjectGrid from "@/components/shared/ResponsiveProjectGrid";
import ScrollRevealObserver from "@/components/shared/ScrollRevealObserver";
import type { Project } from "@/features/projects/format";

export default function ProjectsView({ projects, categories, heading, subheading }: { projects: Project[]; categories: string[]; heading: string; subheading: string }) {
  const galleryImages = projects.map((project) => project.image);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setLightboxOpen] = useState(false);

  const handleMovePrev = () => {
    setCurrentImageIndex((prev) => (prev + galleryImages.length - 1) % galleryImages.length);
  };
  const handleMoveNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };
  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const needle = query.trim().toLowerCase();
  const filteredProjects = projects.filter(
    (project) =>
      (!selectedCategory || project.category === selectedCategory) &&
      (!selectedTech || project.technologies.includes(selectedTech)) &&
      (!needle || project.name.toLowerCase().includes(needle) || project.summary.toLowerCase().includes(needle) || project.technologies.some((t) => t.toLowerCase().includes(needle)))
  );
  const allTech = Array.from(new Set(projects.flatMap((p) => p.technologies))).sort((a, b) => a.localeCompare(b));
  const filtersActive = !!selectedCategory || !!selectedTech || !!needle;
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTech(null);
    setQuery("");
  };
  const filters: { value: string | null; label: string }[] = [{ value: null, label: "All" }, ...categories.map((c) => ({ value: c, label: c }))];

  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
      <ScrollRevealObserver />
      <section className="bg-half-170 d-table w-100" style={{ backgroundImage: "url(/images/digital/bg01.jpg)" }} id="hero">
        <div className="bg-overlay bg-primary-gradient-overlay"></div>
        <div className="container">
          <div className="row mt-5 justify-content-center">
            <div className="col-12">
              <div className="title-heading text-center">
                <h1 className="h4 heading text-white title-dark mb-4">{heading}</h1>
                {subheading && <h5 className="para-desc mx-auto fw-normal text-white-50">{subheading}</h5>}

                <div className="mt-4 pt-2">
                  <Link href="/contact" className="btn btn-pills btn-light">
                    Contact Me
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="portfolio" data-scroll-reveal>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 mb-4 filters-group-wrap text-center">
              <div className="filters-group">
                <ul className="container-filter mb-0 categories-filter list-unstyled filter-options">
                  {filters.map((cat) => (
                    <li
                      key={cat.label}
                      className={
                        selectedCategory === cat.value
                          ? "list-inline-item categories h6 position-relative text-dark active"
                          : "list-inline-item categories h6 position-relative text-dark"
                      }
                    >
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-reset text-decoration-none align-baseline"
                        style={{ font: "inherit" }}
                        aria-pressed={selectedCategory === cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                      >
                        {cat.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {projects.length > 0 && (
            <div className="row justify-content-center mb-2">
              <div className="col-lg-8">
                <div className="d-flex flex-wrap gap-2 justify-content-center align-items-center">
                  <input type="search" className="form-control rounded-pill" style={{ maxWidth: 320 }} placeholder="Search projects…" aria-label="Search projects" value={query} onChange={(e) => setQuery(e.target.value)} />
                  {filtersActive && (
                    <button type="button" className="btn btn-sm btn-link" onClick={clearFilters}>
                      Clear filters
                    </button>
                  )}
                </div>
                {allTech.length > 1 && (
                  <div className="d-flex flex-wrap gap-2 justify-content-center mt-3" role="group" aria-label="Filter by technology">
                    {allTech.map((t) => (
                      <button key={t} type="button" aria-pressed={selectedTech === t} className={`badge border-0 ${selectedTech === t ? "bg-primary" : "bg-soft-primary text-primary"}`} style={{ fontSize: 13, padding: "6px 10px" }} onClick={() => setSelectedTech(selectedTech === t ? null : t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-muted small text-center mt-3 mb-0" role="status" aria-live="polite">
                  {filtersActive ? `${filteredProjects.length} of ${projects.length} project${projects.length === 1 ? "" : "s"}` : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="container-fluid">
          {projects.length === 0 && (
            <div className="text-center py-5">
              <h5 className="mb-2">No projects published yet</h5>
              <p className="text-muted mb-0">Check back soon — new work will show up here.</p>
            </div>
          )}
          {projects.length > 0 && filteredProjects.length === 0 && (
            <div className="text-center py-5">
              <h2 className="h5 mb-2">No projects match your filters</h2>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
          <div id="grid">
            <ResponsiveProjectGrid>
              {filteredProjects.map((project) => {
                const galleryIndex = galleryImages.indexOf(project.image);
                return (
                  <div className="picture-item p-2" key={project.id}>
                    <div className="card border-0 portfolio portfolio-primary portfolio-grid position-relative d-block overflow-hidden rounded">
                      <div className="card-body p-0">
                        <button
                          type="button"
                          onClick={() => handleImageClick(galleryIndex)}
                          className="lightbox p-0 border-0 bg-transparent d-block w-100"
                          aria-label={`View ${project.name} larger`}
                        >
                          <img loading="lazy" decoding="async" src={project.image} className="img-fluid" alt={project.name} />
                        </button>
                        <div className="grid-content bg-white p-3 rounded shadow">
                          <h6 className="mb-1">
                            <Link href={`/projects/${project.slug}`} className="text-dark title">
                              {project.name}
                            </Link>
                          </h6>
                          {project.label && <h6 className="text-muted fw-normal tag mb-0">{project.label}</h6>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </ResponsiveProjectGrid>
            {isLightboxOpen && (
              <Lightbox
                mainSrc={galleryImages[currentImageIndex]}
                prevSrc={galleryImages[(currentImageIndex + galleryImages.length - 1) % galleryImages.length]}
                nextSrc={galleryImages[(currentImageIndex + 1) % galleryImages.length]}
                onCloseRequest={() => setLightboxOpen(false)}
                onMovePrevRequest={handleMovePrev}
                onMoveNextRequest={handleMoveNext}
              />
            )}
          </div>

          <div className="row text-center">
            <div className="col-12 mt-4 pt-2">
              <Link href="#portfolio" className="btn btn-pills btn-soft-primary">
                See works
              </Link>
            </div>
          </div>
        </div>

        <div className="container mt-100 mt-60" id="contact" data-scroll-reveal>
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="section-title text-center">
                <h6 className="text-muted fw-normal mb-3">Open to new opportunities</h6>
                <h2 className="h1 title mb-4">
                  Want to work together? <br /> Let&apos;s talk.
                </h2>
                <div className="mt-4 pt-2">
                  <Link href="/contact" className="btn btn-pills btn-primary">
                    Contact me
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
