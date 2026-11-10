import HomeView from "./HomeView";
import { getArticles } from "@/lib/data/articles";
import { getConsoleData } from "@/lib/data/console";
import { getProfile } from "@/lib/data/profile";
import { getFeaturedProjects } from "@/lib/data/projects";
import { getPublishedTestimonials } from "@/lib/data/testimonials";

export const revalidate = 300;

// Wall-clock time of one public read. The page is regenerated at most every 5 minutes, so the number
// shown is what the read really took at that regeneration — the same contract as the hero console.
async function timed<T>(read: Promise<T>): Promise<{ data: T; ms: number }> {
  const started = performance.now();
  const data = await read;
  return { data, ms: Math.max(1, Math.round(performance.now() - started)) };
}

export default async function Home() {
  const [profile, work, articles, testimonials, consoleData] = await Promise.all([getProfile(), timed(getFeaturedProjects(3)), getArticles(), getPublishedTestimonials(6), getConsoleData()]);
  return <HomeView profile={profile} projects={work.data} workMs={work.ms} articles={articles.slice(0, 3)} testimonials={testimonials} console={consoleData} />;
}
