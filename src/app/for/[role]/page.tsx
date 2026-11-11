import type { Metadata } from "next";
import { notFound } from "next/navigation";

import HomeView from "../../HomeView";
import { getArticles } from "@/lib/data/articles";
import { getConsoleData } from "@/lib/data/console";
import { getProfile } from "@/lib/data/profile";
import { getProjects } from "@/lib/data/projects";
import { getPublishedTestimonials } from "@/lib/data/testimonials";
import { rankForRole, roleBySlug, ROLES } from "@/features/roles/roles";

export const revalidate = 300;
// Only the known roles exist; anything else is a 404, not a home page with a made-up title.
export const dynamicParams = false;
export const generateStaticParams = () => ROLES.map((r) => ({ role: r.slug }));

export function generateMetadata({ params }: { params: { role: string } }): Metadata {
  const role = roleBySlug(params.role);
  // The same content as the home page, reordered: not a page of its own for search engines.
  return { title: role ? `For a ${role.title} role` : undefined, robots: { index: false }, alternates: { canonical: "/" } };
}

export default async function ForRole({ params }: { params: { role: string } }) {
  const role = roleBySlug(params.role);
  if (!role) notFound();
  // Times the projects read alone, the same contract as the home page's query line.
  const work = (async () => {
    const started = performance.now();
    const data = await getProjects();
    return { data, ms: Math.max(1, Math.round(performance.now() - started)) };
  })();
  const [profile, { data: projects, ms }, articles, testimonials, consoleData] = await Promise.all([getProfile(), work, getArticles(), getPublishedTestimonials(6), getConsoleData()]);
  const skills = profile.skills.map((s) => ({ name: s.label, category: s.category }));
  return <HomeView profile={profile} projects={rankForRole(projects, skills, role)} workMs={ms} articles={articles.slice(0, 3)} testimonials={testimonials} console={consoleData} role={role} />;
}
