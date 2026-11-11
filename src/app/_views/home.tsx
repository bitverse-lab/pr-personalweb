import HomeView from "../HomeView";
import { getArticles } from "@/lib/data/articles";
import { getConsoleData } from "@/lib/data/console";
import { getProfile } from "@/lib/data/profile";
import { getFeaturedProjects } from "@/lib/data/projects";
import { getPublishedTestimonials } from "@/lib/data/testimonials";
import type { Locale } from "@/lib/i18n/locale";

// Pages shared by both languages live in app/_views (a private folder, not a route): the page
// files under / and /id only pick the locale.

// Wall-clock time of one public read. The page is regenerated at most every 5 minutes, so the number
// shown is what the read really took at that regeneration — the same contract as the hero console.
async function timed<T>(read: Promise<T>): Promise<{ data: T; ms: number }> {
  const started = performance.now();
  const data = await read;
  return { data, ms: Math.max(1, Math.round(performance.now() - started)) };
}

export async function HomePage({ locale }: { locale: Locale }) {
  const [profile, work, articles, testimonials, consoleData] = await Promise.all([getProfile(), timed(getFeaturedProjects(3)), getArticles(), getPublishedTestimonials(6), getConsoleData()]);
  return <HomeView profile={profile} projects={work.data} workMs={work.ms} articles={articles.slice(0, 3)} testimonials={testimonials} console={consoleData} locale={locale} />;
}
