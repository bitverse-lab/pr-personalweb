import type { Metadata } from "next";
import ProjectsView from "./ProjectsView";
import { getProfile } from "@/lib/data/profile";
import { getProjects } from "@/lib/data/projects";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Work",
  description: "Projects and case studies, by the layers I built: data, API, UI and machine learning.",
};

export default async function ProjectsPage() {
  const [projects, profile] = await Promise.all([getProjects(), getProfile()]);
  return <ProjectsView projects={projects} skills={profile.skills.map((s) => ({ name: s.label, category: s.category }))} />;
}
