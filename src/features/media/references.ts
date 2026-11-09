export interface MediaReferences {
  articles: number;
  journal: number;
  profile: number;
  applications: number;
  projects: number;
}

export function mediaReferenceLabels(refs: MediaReferences): string[] {
  const labels: string[] = [];
  if (refs.articles) labels.push(`${refs.articles} article${refs.articles === 1 ? "" : "s"}`);
  if (refs.journal) labels.push(`${refs.journal} journal entr${refs.journal === 1 ? "y" : "ies"}`);
  if (refs.projects) labels.push(`${refs.projects} project${refs.projects === 1 ? "" : "s"}`);
  if (refs.profile) labels.push("your profile photo");
  if (refs.applications) labels.push(`${refs.applications} application${refs.applications === 1 ? "" : "s"}`);
  return labels;
}
