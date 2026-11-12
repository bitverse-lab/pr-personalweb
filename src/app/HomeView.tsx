import Link from "next/link";
import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ContactSection from "@/components/shared/ContactSection";
import GitLog from "@/components/home/GitLog";
import QueryPlan from "@/components/home/QueryPlan";
import JsonLd from "@/components/shared/JsonLd";
import TestimonialsSection from "@/components/shared/TestimonialsSection";
import HeroC from "@/components/home/HeroC";
import LatestWriting from "@/components/home/LatestWriting";
import SelectedWork from "@/components/home/SelectedWork";
import type { ConsoleData } from "@/lib/data/console";
import type { PublicTestimonial } from "@/lib/data/testimonials";
import type { Profile } from "@/lib/data/profile";
import type { Article } from "@/lib/data/articles";
import type { Project } from "@/features/projects/format";
import type { Role } from "@/features/roles/roles";
import { dict } from "@/lib/i18n/dict";
import { localize, type Locale } from "@/lib/i18n/locale";

interface HomeViewProps {
  profile: Profile;
  projects: Project[];
  /** How long the projects read took when this page was generated. */
  workMs: number;
  articles: Article[];
  testimonials: PublicTestimonial[];
  console: ConsoleData | null;
  /** Set on /for/<role>: projects arrive ranked for that role, and the page says so. */
  role?: Role;
  locale?: Locale;
}

// The sections, as the plan of the query that builds the page.
const PLAN = [
  { id: "intro", op: "Result" },
  { id: "work", op: "Seq Scan on project" },
  { id: "writing", op: "Index Scan on article" },
  { id: "experience", op: "Sort on experience" },
  { id: "testimonials", op: "Seq Scan on review" },
  { id: "contact", op: "Insert on message" },
];

export default function HomeView({ profile, projects, workMs, articles, testimonials, console: consoleData, role, locale = "en" }: HomeViewProps) {
  const t = dict(locale);
  const real = !profile.isPlaceholder;
  const skills = profile.skills.map((s) => ({ name: s.label, category: s.category }));

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
              image: profile.heroPhotoUrl ?? undefined,
              email: profile.email ? `mailto:${profile.email}` : undefined,
              url: profile.website || undefined,
              sameAs: profile.links.map((l) => l.url).filter((u) => /^https?:\/\//.test(u)),
              address: profile.location ? { "@type": "PostalAddress", addressLocality: profile.location } : undefined,
            }}
          />
        )}

        {real ? (
          <HeroC profile={profile} console={consoleData} cvHref={role ? `/cv/download/${role.slug}` : undefined} />
        ) : (
          <section className="hero-c" aria-labelledby="hero-title">
            <div className="container">
              <h1 id="hero-title" className="hero-c-title">{profile.fullName}</h1>
              <p className="hero-c-role">{profile.tagline}</p>
            </div>
          </section>
        )}

        <SelectedWork
          projects={projects.slice(0, 3)}
          skills={skills}
          locale={locale}
          moreHref={localize(locale, "/projects")}
          query={{
            sql: role
              ? `SELECT title, layers, outcome FROM project WHERE published ORDER BY role_fit('${role.layers.join("', '")}') DESC, featured DESC LIMIT 3;`
              : "SELECT title, layers, outcome FROM project WHERE published ORDER BY featured DESC LIMIT 3;",
            ms: workMs,
          }}
        >
          {role && (
            <p className="role-note" data-testid="role-note">
              Arranged for a <strong>{role.title}</strong> role: work in {role.layers.join(", ")} comes first. Nothing is hidden.{" "}
              <Link href="/">See the general page</Link>
            </p>
          )}
        </SelectedWork>

        <LatestWriting articles={articles} locale={locale} />

        {real && profile.experience.length > 0 && (
          <section className="section home-experience" id="experience" aria-labelledby="experience-title">
            <div className="container">
              {/* Heading column stays in view while the timeline scrolls, so the wide screen isn't half empty. */}
              <div className="row">
                <div className="col-lg-4">
                  <div className="xp-head">
                    <h2 id="experience-title" className="selected-work-title">{t.experience.title}</h2>
                    <p className="section-query mb-3"><code className="section-query-sql">git log --graph main</code></p>
                    <Link href={localize(locale, "/cv")} className="writing-all d-inline-block">{t.experience.fullCv} <span className="link-arrow" aria-hidden="true">→</span></Link>
                  </div>
                </div>
                <div className="col-lg-8">
                  <GitLog entries={profile.experience} locale={locale} />
                </div>
              </div>
            </div>
          </section>
        )}

        <TestimonialsSection items={testimonials} locale={locale} />

        <ContactSection dark />
      </main>
      <QueryPlan nodes={PLAN} />
      <SmallFooter />
    </>
  );
}
