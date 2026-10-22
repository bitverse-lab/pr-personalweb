import { cache } from "react";
import { unstable_cache } from "next/cache";
import { SITE_REVALIDATE_SECONDS, SITE_TAG } from "@/lib/data/site-cache";
import { articleRepository } from "@/server/repositories/article-repository";
import { profileRepository } from "@/server/repositories/profile-repository";
import { publicObjectUrl } from "@/server/storage/client";
import { projectService } from "@/server/services/project-service";

export interface SkillBar {
  label: string;
  percent: number;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  period: string;
  description: string;
  achievements?: string[];
  location?: string | null;
}

export interface EducationEntry {
  school: string;
  detail: string;
  period: string;
  description: string;
}

export interface ProfileProject {
  title: string;
  slug: string;
  summary: string;
  role: string;
  technologies: string[];
  url: string | null;
}

export interface ProfileLink {
  label: string;
  url: string;
}

export interface Profile {
  /** True until a name has been saved in Profile & CV: public pages then show a neutral "coming soon" state. */
  isPlaceholder: boolean;
  firstName: string;
  fullName: string;
  headline: string;
  summary: string;
  /** One line for the hero; falls back to the start of the summary. */
  tagline: string;
  /** Cycling words shown after the first name in the hero typing animation. */
  roleSequence: string[];
  location: string;
  email: string;
  website: string;
  /** The owner's uploaded photo, or null (no stock photo is ever shown in its place). */
  photoUrl: string | null;
  availableForWork: boolean;
  availabilityNote: string;
  skills: SkillBar[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  links: ProfileLink[];
  /** Featured (else latest) published projects, shown on the CV and in the PDF. */
  projects: ProfileProject[];
  // decorative template artwork used by the hero/CTA sections
  heroOverlayImage: string;
  dotsImage: string;
  ctaImage: string;
}

const ART = {
  heroOverlayImage: "/images/personal/hero-overlay.png",
  dotsImage: "/images/svg/dots.svg",
  ctaImage: "/images/personal/cta.jpg",
};

// Neutral state shown before Profile & CV is filled in: no invented person, no fake experience.
const placeholder: Profile = {
  isPlaceholder: true,
  firstName: "Personal OS",
  fullName: "Personal OS",
  headline: "",
  summary: "",
  tagline: "This website is being set up. Please check back soon.",
  roleSequence: ["Coming soon"],
  location: "",
  email: "",
  website: "",
  photoUrl: null,
  availableForWork: false,
  availabilityNote: "",
  skills: [],
  experience: [],
  education: [],
  links: [],
  projects: [],
  ...ART,
};

const yearOf = (d: string) => d.slice(0, 4);
const rangeLabel = (start: string | null, end: string | null, openEnded: boolean) => {
  if (!start && !end) return "";
  const from = start ? yearOf(start) : "";
  const to = end ? yearOf(end) : openEnded ? "Present" : "";
  return [from, to].filter(Boolean).join(" – ");
};

/** Public profile: the owner's real data once a name is saved, otherwise the neutral placeholder. */
const loadProfile = unstable_cache(async (): Promise<Profile> => {
  {
    const owner = await articleRepository.owner();
    if (!owner) return placeholder;
    const [full, published] = await Promise.all([profileRepository.findFull(owner.id), projectService.published()]);
    const name = full.profile?.displayName?.trim();
    if (!name) return placeholder;

    const roles = full.profile?.roles ?? [];
    const headline = full.profile?.headline ?? "";
    const summary = full.profile?.summary ?? "";
    return {
      isPlaceholder: false,
      fullName: name,
      firstName: name.split(/\s+/)[0],
      roleSequence: roles.length ? roles : [headline || "Welcome"],
      tagline: headline || summary.slice(0, 140),
      headline,
      summary,
      location: full.profile?.location ?? "",
      email: full.profile?.publicEmail ?? "",
      website: full.profile?.website ?? "",
      photoUrl: full.photo ? publicObjectUrl(full.photo.bucket, full.photo.storageKey) : null,
      availableForWork: full.profile?.availableForWork ?? false,
      availabilityNote: full.profile?.availabilityNote ?? "",
      skills: full.skills.map((s) => ({ label: s.name, percent: s.level })),
      experience: full.experiences.map((e) => ({
        company: e.company,
        role: e.role,
        period: rangeLabel(e.startDate, e.endDate, true),
        description: e.description ?? "",
        achievements: e.achievements,
        location: e.location,
      })),
      education: full.educations.map((e) => ({
        school: e.school,
        detail: [e.degree, e.field].filter(Boolean).join(", "),
        period: rangeLabel(e.startDate, e.endDate, false),
        description: e.description ?? "",
      })),
      links: full.links.map((l) => ({ label: l.label, url: l.url })),
      projects: [...published.filter((x) => x.featured), ...published.filter((x) => !x.featured)].slice(0, 5).map((x) => ({
        title: x.title,
        slug: x.slug,
        summary: x.summary ?? "",
        role: x.role ?? "",
        technologies: x.technologies,
        url: x.links[0]?.url ?? null,
      })),
      ...ART,
    };
  }
}, ["public-profile"], { tags: [SITE_TAG], revalidate: SITE_REVALIDATE_SECONDS });

// Read from the shared data cache (a few queries otherwise run on every request, including inside /me).
export const getProfile = cache(async function getProfile(): Promise<Profile> {
  try {
    return await loadProfile();
  } catch {
    return placeholder; // never take the public site down because the profile could not be read
  }
});
