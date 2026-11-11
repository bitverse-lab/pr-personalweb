import { NextResponse } from "next/server";
import { buildSnapshot } from "@/features/sandbox/snapshot";
import { getArticles } from "@/lib/data/articles";
import { getProfile } from "@/lib/data/profile";
import { getProjects } from "@/lib/data/projects";
import { getPublishedTestimonials } from "@/lib/data/testimonials";

export const revalidate = 300;

// The data the hero's live SQL console is loaded with: only what the public pages already show,
// read through the same cached, degrading loaders (an unreachable database yields empty tables).
export async function GET() {
  const [profile, projects, articles, testimonials] = await Promise.all([getProfile(), getProjects(), getArticles(), getPublishedTestimonials(50)]);
  return NextResponse.json(buildSnapshot({ skills: profile.skills, experience: profile.experience, projects, articles, testimonials }));
}
