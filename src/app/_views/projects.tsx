import type { Metadata } from "next";
import ProjectsView from "../projects/ProjectsView";
import { getProfile } from "@/lib/data/profile";
import { getProjects } from "@/lib/data/projects";
import { localizeProject } from "@/lib/i18n/content";
import { dict } from "@/lib/i18n/dict";
import { languages, localize, type Locale } from "@/lib/i18n/locale";

export function projectsMetadata(locale: Locale): Metadata {
  const t = dict(locale).meta;
  return { title: t.workTitle, description: t.workDescription, alternates: { canonical: localize(locale, "/projects"), languages: languages("/projects") } };
}

export async function ProjectsPage({ locale }: { locale: Locale }) {
  const [projects, profile] = await Promise.all([getProjects(), getProfile()]);
  return <ProjectsView projects={projects.map((p) => localizeProject(p, locale))} skills={profile.skills.map((s) => ({ name: s.label, category: s.category }))} />;
}
