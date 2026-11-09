import HomeView from "./HomeView";
import { getArticles } from "@/lib/data/articles";
import { getConsoleData } from "@/lib/data/console";
import { getProfile } from "@/lib/data/profile";
import { getFeaturedProjects } from "@/lib/data/projects";
import { getPublishedTestimonials } from "@/lib/data/testimonials";

export const revalidate = 300;

export default async function Home() {
  const [profile, projects, articles, testimonials, consoleData] = await Promise.all([getProfile(), getFeaturedProjects(3), getArticles(), getPublishedTestimonials(6), getConsoleData()]);
  return <HomeView profile={profile} projects={projects} articles={articles.slice(0, 3)} testimonials={testimonials} console={consoleData} />;
}
