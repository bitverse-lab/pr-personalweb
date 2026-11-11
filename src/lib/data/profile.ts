import { cache } from "react";
import { unstable_cache } from "next/cache";
import { SITE_REVALIDATE_SECONDS, SITE_TAG } from "@/lib/data/site-cache";
import { articleRepository } from "@/server/repositories/article-repository";
import { profileRepository } from "@/server/repositories/profile-repository";
import { publicObjectUrl } from "@/server/storage/client";
import { projectService } from "@/server/services/project-service";
import { resolveProfilePhotoUrls } from "@/features/profile/photo";
import { pickList, pickText } from "@/features/content/translations";
import type { Locale } from "@/lib/i18n/locale";

export interface SkillBar {
  label: string;
  percent: number;
  /** The owner's own grouping (e.g. Data, API); lower-cased it is the "layer" used across the public site. */
  category: string | null;
}

/** A proof point written by the owner in Profile & CV → Highlights. */
export interface ProfileHighlight {
  metric: string;
  value: string;
  note: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  period: string;
  description: string;
  achievements?: string[];
  location?: string | null;
  /** No end date: the role the owner holds now. */
  current: boolean;
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
  /** The owner's hero photo, or null (no stock photo is ever shown in its place). */
  heroPhotoUrl: string | null;
  /** The About photo, falling back to the hero photo until a separate one is uploaded. */
  aboutPhotoUrl: string | null;
  availableForWork: boolean;
  availabilityNote: string;
  skills: SkillBar[];
  highlights: ProfileHighlight[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  links: ProfileLink[];
  /** Featured (else latest) published projects, shown on the CV and in the PDF. */
  projects: ProfileProject[];
  /** The same profile in Indonesian (set on the English one only); see localizeProfile. */
  indonesian?: Profile;
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
  heroPhotoUrl: null,
  aboutPhotoUrl: null,
  availableForWork: false,
  availabilityNote: "",
  skills: [],
  highlights: [],
  experience: [],
  education: [],
  links: [],
  projects: [],
  ...ART,
};

const yearOf = (d: string) => d.slice(0, 4);
const rangeLabel = (start: string | null, end: string | null, openEnded: boolean, locale: Locale) => {
  if (!start && !end) return "";
  const from = start ? yearOf(start) : "";
  const to = end ? yearOf(end) : openEnded ? (locale === "id" ? "Sekarang" : "Present") : "";
  return [from, to].filter(Boolean).join(" – ");
};

type Full = Awaited<ReturnType<typeof profileRepository.findFull>>;
type Published = Awaited<ReturnType<typeof projectService.published>>;

/** The public profile in one language; Indonesian fields left empty fall back to the English. */
function buildProfile(full: Full, published: Published, name: string, locale: Locale): Profile {
  const tr = full.profile?.translations?.id;
  const roles = full.profile?.roles ?? [];
  const headline = pickText(locale, full.profile?.headline ?? "", tr?.headline);
  const summary = pickText(locale, full.profile?.summary ?? "", tr?.summary);
  const { heroPhotoUrl, aboutPhotoUrl } = resolveProfilePhotoUrls(
    full.photo ? publicObjectUrl(full.photo.bucket, full.photo.storageKey) : null,
    full.aboutPhoto ? publicObjectUrl(full.aboutPhoto.bucket, full.aboutPhoto.storageKey) : null,
  );
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
    heroPhotoUrl,
    aboutPhotoUrl,
    availableForWork: full.profile?.availableForWork ?? false,
    availabilityNote: pickText(locale, full.profile?.availabilityNote ?? "", tr?.availabilityNote),
    skills: full.skills.map((s) => ({ label: s.name, percent: s.level, category: s.category })),
    highlights: full.highlights.map((h) => ({ metric: h.metric, value: h.value, note: pickText(locale, h.note ?? "", h.translations?.id?.note) })),
    experience: full.experiences.map((e) => ({
      company: e.company,
      role: pickText(locale, e.role, e.translations?.id?.role),
      period: rangeLabel(e.startDate, e.endDate, true, locale),
      description: pickText(locale, e.description ?? "", e.translations?.id?.description),
      achievements: pickList(locale, e.achievements, e.translations?.id?.achievements),
      location: e.location,
      current: e.endDate === null,
    })),
    education: full.educations.map((e) => ({
      school: e.school,
      detail: [pickText(locale, e.degree, e.translations?.id?.degree), pickText(locale, e.field, e.translations?.id?.field)].filter(Boolean).join(", "),
      period: rangeLabel(e.startDate, e.endDate, false, locale),
      description: pickText(locale, e.description ?? "", e.translations?.id?.description),
    })),
    links: full.links.map((l) => ({ label: l.label, url: l.url })),
    projects: [...published.filter((x) => x.featured), ...published.filter((x) => !x.featured)].slice(0, 5).map((x) => ({
      title: pickText(locale, x.title, x.translations.id?.title),
      slug: x.slug,
      summary: pickText(locale, x.summary ?? "", x.translations.id?.summary),
      role: x.role ?? "",
      technologies: x.technologies,
      url: x.links[0]?.url ?? null,
    })),
    ...ART,
  };
}

/** Public profile: the owner's real data once a name is saved, otherwise the neutral placeholder. */
const loadProfile = unstable_cache(async (): Promise<Profile> => {
  {
    const owner = await articleRepository.owner();
    if (!owner) return placeholder;
    const [full, published] = await Promise.all([profileRepository.findFull(owner.id), projectService.published()]);
    const name = full.profile?.displayName?.trim();
    if (!name) return placeholder;
    // Built once in both languages, so a page only picks one (localizeProfile).
    return { ...buildProfile(full, published, name, "en"), indonesian: buildProfile(full, published, name, "id") };
  }
  // v2: entries carry the Indonesian version.
}, ["public-profile", "v2"], { tags: [SITE_TAG], revalidate: SITE_REVALIDATE_SECONDS });

// Read from the shared data cache (a few queries otherwise run on every request, including inside /me).
export const getProfile = cache(async function getProfile(): Promise<Profile> {
  try {
    return await loadProfile();
  } catch {
    return placeholder; // never take the public site down because the profile could not be read
  }
});

/** The profile in a page's language. The placeholder has no Indonesian version and stays as it is. */
export function localizeProfile(profile: Profile, locale: Locale): Profile {
  return locale === "id" && profile.indonesian ? profile.indonesian : profile;
}
