import type { Metadata } from "next";
import ProjectsView from "./ProjectsView";
import { getProfile } from "@/lib/data/profile";
import { getProjects, projectCategories } from "@/lib/data/projects";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Projects",
  description: "A selection of projects and case studies.",
};

export default async function ProjectsPage() {
  const [projects, profile] = await Promise.all([getProjects(), getProfile()]);
  const subheading = profile.isPlaceholder ? "" : profile.headline;
  return <ProjectsView projects={projects} categories={projectCategories(projects)} heading="Projects & case studies" subheading={subheading} />;
}
