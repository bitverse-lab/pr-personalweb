import { notFound } from "next/navigation";
import ProjectEditor from "@/components/me/projects/ProjectEditor";
import { getMyProject, getMyProjects } from "@/features/projects/actions";

export default async function ProjectEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, all] = await Promise.all([getMyProject(id), getMyProjects()]);
  if (!project) notFound();

  const categories = Array.from(new Set(all.items.map((p) => p.category).filter((c): c is string => !!c)));
  const techs = Array.from(new Set(all.items.flatMap((p) => p.technologies)));

  return (
    <div className="container-fluid py-4 px-4">
      <ProjectEditor key={project.id} project={project} categorySuggestions={categories} techSuggestions={techs} />
    </div>
  );
}
