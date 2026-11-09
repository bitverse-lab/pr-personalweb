"use client";

import { useState } from "react";
import Link from "next/link";
import { TypeAnimation } from "react-type-animation";
import Lightbox from "react-18-image-lightbox";
import "react-18-image-lightbox/style.css";
import { FiArrowDown, FiArrowUpRight, FiCamera, FiDownload, FiMapPin } from "react-icons/fi";
import { MdArrowForward } from "react-icons/md";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ArticleCard from "@/components/shared/ArticleCard";
import ContactSection from "@/components/shared/ContactSection";
import ExperienceTimeline from "@/components/shared/ExperienceTimeline";
import CoverBlock from "@/components/shared/CoverBlock";
import FallbackImage, { initialsOf, PortraitInitials } from "@/components/shared/FallbackImage";
import JsonLd from "@/components/shared/JsonLd";
import TestimonialsSection from "@/components/shared/TestimonialsSection";
import ScrollRevealObserver from "@/components/shared/ScrollRevealObserver";
import type { PublicTestimonial } from "@/lib/data/testimonials";
import type { Profile } from "@/lib/data/profile";
import type { Article } from "@/lib/data/articles";
import { projectCategories, type Project } from "@/features/projects/format";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const excerpt = (text: string, max = 190) => {
  if (text.length <= max) return text;
  const excerptEnd = text.slice(0, max).trimEnd().lastIndexOf(" ");
  return `${text.slice(0, excerptEnd > 0 ? excerptEnd : max).trimEnd()}…`;
};

export default function HomeView({ profile, projects, articles, testimonials }: { profile: Profile; projects: Project[]; articles: Article[]; testimonials: PublicTestimonial[] }) {
  const real = !profile.isPlaceholder;
  const initials = initialsOf(profile.fullName);
  const reducedMotion = usePrefersReducedMotion();
  const categories: { value: string | null; label: string }[] = [{ value: null, label: "All" }, ...projectCategories(projects).map((c) => ({ value: c, label: c }))];
  const galleryImages = projects.map((project) => project.image).filter((src): src is string => !!src);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setLightboxOpen] = useState(false);

  const handleMovePrev = () => setCurrentImageIndex((prev) => (prev + galleryImages.length - 1) % galleryImages.length);
  const handleMoveNext = () => setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const filteredProjects = selectedCategory ? projects.filter((project) => project.category === selectedCategory) : projects;

  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
        <ScrollRevealObserver />
        {real && (
          <JsonLd
            data={{
              "@type": "Person",
              name: profile.fullName,
              jobTitle: profile.headline || undefined,
              description: profile.summary || undefined,
              image: profile.heroPhotoUrl ?? undefined,
              email: profile.email ? `mailto:${profile.email}` : undefined,
              url: profile.website || undefined,
              sameAs: profile.links.map((l) => l.url).filter((u) => /^https?:\/\//.test(u)),
              address: profile.location ? { "@type": "PostalAddress", addressLocality: profile.location } : undefined,
            }}
          />
        )}

        {/* ---- Hero ---- */}
        <section className="home-hero-personal position-relative background-effect overflow-hidden" id="home">
          <div className="home-personal-overlay" aria-hidden="true" />
          <ul className="home-personal-circles" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => <li key={index} />)}
          </ul>
          <div className="container position-relative z-index-1">
            <div className="row align-items-center home-hero-row">
              <div className="col-lg-6 order-1">
                <div className="home-portrait-stage">
                  <div className="home-portrait-halo" aria-hidden="true" />
                  <div className="home-portrait-frame">
                    {profile.heroPhotoUrl ? (
                      <FallbackImage
                        src={profile.heroPhotoUrl}
                        alt={`Portrait of ${profile.fullName}`}
                        fallback={
                          <div className="home-portrait-placeholder" role="img" aria-label={`Portrait of ${profile.fullName}`}>
                            <span>{initials}</span>
                          </div>
                        }
                      />
                    ) : (
                      <div className="home-portrait-placeholder" aria-label="Profile photo not set">
                        <span>{initials}</span>
                      </div>
                    )}
                  </div>
                  {real && (profile.skills[0] || profile.location) && (
                    <div className="home-portrait-note">
                      <span className="home-portrait-note-mark" aria-hidden="true" />
                      <span>{profile.skills[0]?.label ?? profile.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-lg-6 order-2">
                <div className="home-hero-copy">
                  <div className="home-hero-meta">
                    {profile.availableForWork && (
                      <span className="home-availability">
                        <span className="home-availability-dot" aria-hidden="true" />
                        Available for work
                      </span>
                    )}
                    {profile.location && (
                      <span className="home-hero-location">
                        <FiMapPin aria-hidden="true" />
                        {profile.location}
                      </span>
                    )}
                  </div>
                  <p className="home-hero-kicker">{real ? "Personal portfolio" : "Personal website & workspace"}</p>
                  <h1 className="home-personal-title">
                    {real ? (
                      <>
                        Hi, I’m
                        <br />
                        <span>{profile.fullName}</span>
                      </>
                    ) : (
                      <>Ideas, work, and life in one place.</>
                    )}
                  </h1>
                  <div className="home-hero-roles" aria-label={profile.roleSequence.join(", ")}>
                    <span className="home-hero-role-label">{real ? "Focused on" : "A personal home for"}</span>
                    {reducedMotion ? (
                      <strong className="home-hero-role">{profile.roleSequence[0]}</strong>
                    ) : (
                      <TypeAnimation sequence={profile.roleSequence.flatMap((word) => [word, 2000])} wrapper="strong" className="home-hero-role" speed={5} repeat={Infinity} cursor={false} />
                    )}
                  </div>
                  <div className="home-personal-panel">
                    <p className="home-hero-summary">{real ? excerpt(profile.summary || profile.tagline) : profile.tagline}</p>
                    {real && (
                      <div className="home-hero-actions">
                        <Link href="/contact" className="btn btn-primary btn-pills home-hero-primary">
                          Let’s talk <FiArrowUpRight aria-hidden="true" />
                        </Link>
                        <Link href="#project" className="btn btn-outline-primary btn-pills">
                          Explore my work <FiArrowUpRight aria-hidden="true" />
                        </Link>
                      </div>
                    )}
                    {real && profile.skills.length > 0 && (
                      <div className="home-hero-skills" aria-label="Key skills">
                        {profile.skills.slice(0, 3).map((skill) => (
                          <span key={skill.label}>{skill.label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {real && (
            <a className="home-hero-scroll" href="#project">
              <FiArrowDown aria-hidden="true" />
              <span>Scroll to explore</span>
            </a>
          )}
        </section>

        <div className="position-relative">
          {real && (
            <div className="home-shape-arrow">
              <Link href="#about" aria-label="Scroll to About">
                <i className="mdi mdi-arrow-down arrow-icon text-dark h5 shadow-md"></i>
              </Link>
            </div>
          )}
          <div className="shape overflow-hidden text-white">
            <svg viewBox="0 0 2880 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M0 48H1437.5H2880V0H2160C1442.5 52 720 0 720 0H0V48Z" fill="currentColor"></path>
            </svg>
          </div>
        </div>

        {/* ---- About + skills ---- */}
        {real && (profile.summary || profile.skills.length > 0 || profile.aboutPhotoUrl) && (
          <section className="section" id="about" data-scroll-reveal>
            <div className="container">
              <div className="row align-items-center">
                {profile.aboutPhotoUrl && (
                  <div className="col-lg-5 col-md-6">
                    <div className="position-relative">
                      <FallbackImage
                        src={profile.aboutPhotoUrl}
                        className="rounded-pill shadow img-fluid"
                        alt={`Portrait of ${profile.fullName}`}
                        fallback={<PortraitInitials name={profile.fullName} />}
                      />
                      <div className="position-absolute top-0 start-0 z-index-m-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={profile.dotsImage} className="avatar avatar-xl-large" alt="" />
                      </div>
                    </div>
                  </div>
                )}

                <div className={`${profile.aboutPhotoUrl ? "col-lg-7 col-md-6 mt-4 mt-sm-0 pt-2 pt-sm-0" : "col-lg-9 mx-auto"}`}>
                  <div className={profile.aboutPhotoUrl ? "ms-lg-5" : ""}>
                    <div className="section-title">
                      <span className="badge rounded-pill bg-soft-primary">About Me</span>
                      <h2 className="h4 title mt-2 mb-4">{profile.headline || profile.fullName}</h2>
                      {profile.summary && (
                        <p className="para-desc text-muted pb-0" style={{ whiteSpace: "pre-line" }}>
                          {profile.summary}
                        </p>
                      )}
                    </div>

                    <div className="mt-4">
                      <Link href="/about" className="btn btn-link primary text-muted h6 mb-0">
                        More about me <MdArrowForward className="ms-1" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---- Skills ---- */}
        {real && profile.skills.length > 0 && (
          <section className="section bg-light" id="skills" data-scroll-reveal>
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-lg-8 text-center">
                  <div className="section-title mb-4 pb-2">
                    <span className="badge rounded-pill bg-soft-primary">What I work with</span>
                    <h2 className="h4 title mt-2 mb-3">Skills &amp; Expertise</h2>
                  </div>
                </div>
              </div>
              <div className="row">
                {profile.skills.map((skill) => (
                  <div className="col-lg-4 col-md-6 mt-4 pt-2" key={skill.label}>
                    <div className="features feature-primary feature-clean feature-transition home-skill-card p-4 border-0 shadow rounded-md h-100">
                      <div className="d-flex align-items-start justify-content-between gap-3">
                        <h3 className="h5 title mb-0">{skill.label}</h3>
                        <span className="home-skill-percent text-muted">{skill.percent}%</span>
                      </div>
                      <div className="progress-box mt-4">
                        <div className="progress" role="progressbar" aria-label={`${skill.label} proficiency`} aria-valuenow={skill.percent} aria-valuemin={0} aria-valuemax={100}>
                          <div className="progress-bar bg-primary" style={{ width: `${skill.percent}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---- Experience ---- */}
        {real && profile.experience.length > 0 && (
          <section className="section" id="experience" data-scroll-reveal>
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-12 text-center">
                  <div className="section-title mb-4 pb-2">
                    <h2 className="h4 title mb-4">Work Experience</h2>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-12 mt-4 pt-2">
                  <ExperienceTimeline entries={profile.experience} />
                </div>
              </div>
              <div className="text-center mt-5">
                <Link href="/cv" className="btn btn-outline-primary">
                  See my full CV
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ---- Projects ---- */}
        {projects.length > 0 && (
          <section className="section bg-light" id="project" data-scroll-reveal>
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-12">
                  <div className="section-title text-center mb-4 pb-2">
                    <h2 className="h4 title mb-4">Selected Projects</h2>
                    <p className="para-desc text-muted mx-auto mb-0">A selection of things I have built and shipped.</p>
                  </div>
                </div>
              </div>

              {categories.length > 2 && (
                <div className="row justify-content-center">
                  <div className="col-12 my-4 filters-group-wrap text-center">
                    <div className="filters-group">
                      <ul className="container-filter mb-0 categories-filter list-unstyled filter-options h6">
                        {categories.map((cat) => (
                          <li key={cat.label} className={`${selectedCategory === cat.value ? "active " : ""}list-inline-item categories fw-normal position-relative text-dark`}>
                            <button type="button" className="btn btn-link p-0 border-0 text-reset text-decoration-none align-baseline" style={{ font: "inherit" }} aria-pressed={selectedCategory === cat.value} onClick={() => setSelectedCategory(cat.value)}>
                              {cat.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div id="grid" className="row g-3 row-cols-lg-4 row-cols-md-3 row-cols-sm-2 row-cols-1">
                {filteredProjects.map((project) => {
                  const galleryIndex = project.image ? galleryImages.indexOf(project.image) : -1;
                  return (
                    <div className="col picture-item" key={project.id}>
                      <div className="position-relative portfolio portfolio-primary portfolio-modern rounded-md">
                        <div className="position-relative port-image">
                          <div className="rounded-md p-0 overflow-hidden">
                            <CoverBlock src={project.image} title={project.name} compact />
                            {galleryIndex >= 0 && (
                              <div className="icons text-center">
                                <button type="button" onClick={() => handleImageClick(galleryIndex)} className="btn btn-icon btn-pills btn-lg lightbox" aria-label={`View ${project.name} larger`}>
                                  <FiCamera aria-hidden />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="bg rounded-md"></div>
                      </div>
                      <div className="mt-3">
                        <h3 className="h6 mb-1">
                          <Link href={`/projects/${project.slug}`} className="text-dark title">
                            {project.name}
                          </Link>
                        </h3>
                        {project.label && <p className="text-muted fw-normal tag mb-0 small">{project.label}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
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

              <div className="text-center mt-4 pt-2">
                <Link href="/projects" className="btn btn-link primary text-muted h6 mb-0">
                  All projects <MdArrowForward className="ms-1" aria-hidden />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ---- Latest articles ---- */}
        {articles.length > 0 && (
          <section className="section" id="articles" data-scroll-reveal>
            <div className="container">
              <div className="section-title text-center mb-4 pb-2">
                <h2 className="h4 title mb-4">Latest Articles</h2>
                <p className="para-desc text-muted mx-auto mb-0">Writing on things I am building and learning.</p>
              </div>
              <div className="row">
                {articles.slice(0, 3).map((article) => (
                  <div className="col-lg-4 col-md-6 mt-4 pt-2" key={article.id}>
                    <ArticleCard article={article} />
                  </div>
                ))}
              </div>
              <div className="text-center mt-4 pt-2">
                <Link href="/articles" className="btn btn-link primary text-muted h6 mb-0">
                  All articles <MdArrowForward className="ms-1" aria-hidden />
                </Link>
              </div>
            </div>
          </section>
        )}

        <TestimonialsSection items={testimonials} />

        {/* ---- Availability banner ---- */}
        {real && profile.availableForWork && (
          <section className="home-availability-cta section position-relative overflow-hidden" data-scroll-reveal>
            <div className="bg-overlay bg-primary-gradient-overlay" aria-hidden="true" />
            <div className="container position-relative z-index-1">
              <div className="row justify-content-center">
                <div className="col-lg-8 text-center">
                  <div className="section-title mb-0">
                    <h2 className="h4 text-white title-dark mb-2">I am open to new opportunities</h2>
                    {profile.availabilityNote && <p className="home-availability-note text-white-50 mx-auto mb-0">{profile.availabilityNote}</p>}
                    <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
                      <Link href="#contact" className="btn btn-warning btn-pills text-dark">
                        Get in touch <FiArrowDown aria-hidden="true" />
                      </Link>
                      <a href="/cv/download" className="btn btn-light btn-pills d-inline-flex align-items-center gap-2">
                        <FiDownload aria-hidden="true" /> Download CV
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---- Contact ---- */}
        <ContactSection />
      </main>
      <SmallFooter />
    </>
  );
}
