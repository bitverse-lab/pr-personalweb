import { ProjectsPage, projectsMetadata } from "../../_views/projects";

export const revalidate = 300;
export const metadata = projectsMetadata("id");

export default function Proyek() {
  return <ProjectsPage />;
}
