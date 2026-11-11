import { ProjectDetailPage, projectMetadata } from "../../../_views/project";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return projectMetadata("id", (await params).slug);
}

// Deliberately not wrapped in publicRead (CLAUDE.md): null means "no such project" → 404; an outage must error.
export default async function Project({ params }: Props) {
  return <ProjectDetailPage locale="id" slug={(await params).slug} />;
}
