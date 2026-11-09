import Link from "next/link";
import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import ContactSection from "@/components/shared/ContactSection";
import ExperienceTimeline from "@/components/shared/ExperienceTimeline";
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

interface HomeViewProps {
  profile: Profile;
  projects: Project[];
  articles: Article[];
  testimonials: PublicTestimonial[];
  console: ConsoleData | null;
}

export default function HomeView({ profile, projects, articles, testimonials, console: consoleData }: HomeViewProps) {
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
          <HeroC profile={profile} console={consoleData} />
        ) : (
          <section className="hero-c" aria-labelledby="hero-title">
            <div className="container">
              <h1 id="hero-title" className="hero-c-title">{profile.fullName}</h1>
              <p className="hero-c-role">{profile.tagline}</p>
            </div>
          </section>
        )}

        <SelectedWork projects={projects.slice(0, 3)} skills={skills} />

        <LatestWriting articles={articles} />

        {real && profile.experience.length > 0 && (
          <section className="section home-experience" id="experience" aria-labelledby="experience-title">
            <div className="container">
              <h2 id="experience-title" className="selected-work-title">Experience</h2>
              <ExperienceTimeline entries={profile.experience} />
              <Link href="/cv" className="writing-all d-inline-block mt-4">Full CV →</Link>
            </div>
          </section>
        )}

        <TestimonialsSection items={testimonials} />

        <ContactSection />
      </main>
      <SmallFooter />
    </>
  );
}
