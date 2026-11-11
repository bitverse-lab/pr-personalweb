import { ProjectsPage, projectsMetadata } from "../_views/projects";

export const revalidate = 300;
export const metadata = projectsMetadata("en");

export default function Projects() {
  return <ProjectsPage locale="en" />;
}
