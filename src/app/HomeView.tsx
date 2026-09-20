"use client";

import { useState } from "react";
import Link from "next/link";
import { TypeAnimation } from "react-type-animation";
import { Parallax } from "react-parallax";
import Lightbox from "react-18-image-lightbox";
import "react-18-image-lightbox/style.css";
import { FiCamera, FiDownload } from "react-icons/fi";
import { MdArrowForward } from "react-icons/md";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ArticleCard from "@/components/shared/ArticleCard";
import ContactSection from "@/components/shared/ContactSection";
import ExperienceTimeline from "@/components/shared/ExperienceTimeline";
import JsonLd from "@/components/shared/JsonLd";
import TestimonialsSection from "@/components/shared/TestimonialsSection";
import type { PublicTestimonial } from "@/lib/data/testimonials";
import type { Profile } from "@/lib/data/profile";
import type { Article } from "@/lib/data/articles";
import { projectCategories, type Project } from "@/features/projects/format";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const excerpt = (text: string, max = 190) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

export default function HomeView({ profile, projects, articles, testimonials }: { profile: Profile; projects: Project[]; articles: Article[]; testimonials: PublicTestimonial[] }) {
  const real = !profile.isPlaceholder;
  const reducedMotion = usePrefersReducedMotion();
  const categories: { value: string | null; label: string }[] = [{ value: null, label: "All" }, ...projectCategories(projects).map((c) => ({ value: c, label: c }))];
  const galleryImages = projects.map((project) => project.image);

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
        {real && (
          <JsonLd
            data={{
              "@type": "Person",
              name: profile.fullName,
              jobTitle: profile.headline || undefined,
              description: profile.summary || undefined,
              image: profile.photoUrl ?? undefined,
              email: profile.email ? `mailto:${profile.email}` : undefined,
              url: profile.website || undefined,
              sameAs: profile.links.map((l) => l.url).filter((u) => /^https?:\/\//.test(u)),
              address: profile.location ? { "@type": "PostalAddress", addressLocality: profile.location } : undefined,
            }}
          />
        )}

        {/* ---- Hero ---- */}
        <section className="bg-home personal-hero d-flex align-items-center background-effect overflow-hidden z-index-1" id="home">
          {reducedMotion ? (
            <div role="presentation" style={{ position: "absolute", inset: 0, backgroundImage: `url(${profile.heroOverlayImage})`, backgroundRepeat: "no-repeat", backgroundSize: "auto 100%" }} />
          ) : (
            <Parallax
              blur={{ min: 0, max: 0 }}
              bgImage={profile.heroOverlayImage}
              bgImageAlt=""
              strength={500}
              bgStyle={{ width: "auto", height: "100%" }}
              style={{ position: "absolute", width: "100%", height: "100%" }}
            />
          )}
          <div className="container-fluid position-relative">
            <div className="container position-relative z-index-1">
              <div className="row mt-5">
                <div className="col">
                  <div className="title-heading">
                    <div className="row">
                      <div className="col-lg-4 col-md-6 order-2 order-lg-1 mt-4 mt-sm-0">
                        <div className="rounded personal-hero-para">
                          {profile.availableForWork && (
                            <span className="badge rounded-pill bg-soft-success text-success d-inline-flex align-items-center gap-2 mb-3">
                              <span className="rounded-circle bg-success d-inline-block" style={{ width: 8, height: 8 }} aria-hidden />
                              Available for work
                            </span>
                          )}
                          {real && profile.headline && <p className="h5 mb-3 sub-title">{profile.headline}</p>}
                          <p className="para-desc para mb-0">{real ? excerpt(profile.summary || profile.tagline) : profile.tagline}</p>
                          {real && (
                            <div className="mt-4 d-flex flex-wrap gap-2">
                              <a href="/cv/download" className="btn btn-primary d-inline-flex align-items-center gap-2">
                                <FiDownload aria-hidden /> Download CV
                              </a>
                              <Link href="/contact" className="btn btn-outline-primary">
                                Contact me
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-lg-4 offset-lg-4 col-md-6 order-1 order-lg-1">
                        <h1 className="display-3 title fw-bold mb-0">
                          {profile.firstName} <br />
                          {reducedMotion ? (
                            <span className="typewrite">{profile.roleSequence[0]}</span>
                          ) : (
                            <TypeAnimation sequence={profile.roleSequence.flatMap((word) => [word, 2000])} wrapper="span" speed={5} className="typewrite" repeat={Infinity} cursor={false} />
                          )}
                        </h1>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="personal-overlay bg-overlay bg-primary-gradient-overlay"></div>
          <ul className="circles p-0 mb-0">
            {Array.from({ length: 10 }, (_, i) => (
              <li key={i}></li>
            ))}
          </ul>
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
        {real && (profile.summary || profile.skills.length > 0 || profile.photoUrl) && (
          <section className="section" id="about">
            <div className="container">
              <div className="row align-items-center">
                {profile.photoUrl && (
                  <div className="col-lg-5 col-md-6">
                    <div className="position-relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={profile.photoUrl} className="rounded-pill shadow img-fluid" alt={`Portrait of ${profile.fullName}`} />
                      <div className="position-absolute top-0 start-0 z-index-m-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={profile.dotsImage} className="avatar avatar-xl-large" alt="" />
                      </div>
                    </div>
                  </div>
                )}

                <div className={`${profile.photoUrl ? "col-lg-7 col-md-6 mt-4 mt-sm-0 pt-2 pt-sm-0" : "col-lg-9 mx-auto"}`}>
                  <div className={profile.photoUrl ? "ms-lg-5" : ""}>
                    <div className="section-title">
                      <span className="badge rounded-pill bg-soft-primary">About Me</span>
                      <h2 className="h4 title mt-2 mb-4">{profile.headline || profile.fullName}</h2>
                      {profile.summary && (
                        <p className="para-desc text-muted pb-0" style={{ whiteSpace: "pre-line" }}>
                          {profile.summary}
                        </p>
                      )}
                    </div>

                    {profile.skills.map((skill) => (
                      <div className="progress-box mt-4" key={skill.label}>
                        <h3 className="h6 title fw-normal text-muted">{skill.label}</h3>
                        <div className="progress" role="progressbar" aria-label={`${skill.label} proficiency`} aria-valuenow={skill.percent} aria-valuemin={0} aria-valuemax={100}>
                          <div className="progress-bar position-relative bg-primary" style={{ width: `${skill.percent}%` }}>
                            <div className="progress-value d-block text-muted h6">{skill.percent}%</div>
                          </div>
                        </div>
                      </div>
                    ))}

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

        {/* ---- Experience ---- */}
        {real && profile.experience.length > 0 && (
          <section className="section bg-light" id="experience">
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
          <section className="section" id="project">
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
                  const galleryIndex = galleryImages.indexOf(project.image);
                  return (
                    <div className="col picture-item" key={project.id}>
                      <div className="position-relative portfolio portfolio-primary portfolio-modern rounded-md">
                        <div className="position-relative port-image">
                          <div className="rounded-md p-0 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img loading="lazy" decoding="async" src={project.image} className="img-fluid shadow" alt={project.name} />
                            <div className="icons text-center">
                              <button type="button" onClick={() => handleImageClick(galleryIndex)} className="btn btn-icon btn-pills btn-lg lightbox" aria-label={`View ${project.name} larger`}>
                                <FiCamera aria-hidden />
                              </button>
                            </div>
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
          <section className="section bg-light" id="articles">
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
          <section className="section pt-0">
            <div className="container">
              <div className="rounded shadow bg-primary text-center text-white p-5">
                <h2 className="h4 text-white title-dark mb-2">I am open to new opportunities</h2>
                {profile.availabilityNote && <p className="text-white-50 mx-auto mb-4" style={{ maxWidth: 560 }}>{profile.availabilityNote}</p>}
                <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                  <Link href="#contact" className="btn btn-light">
                    Get in touch
                  </Link>
                  <a href="/cv/download" className="btn btn-outline-light d-inline-flex align-items-center gap-2">
                    <FiDownload aria-hidden /> Download CV
                  </a>
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
