import { NextResponse, type NextRequest } from "next/server";
import { getCvFiles } from "@/lib/data/cv-files";

export const dynamic = "force-dynamic";

// "Download CV" without a role (navbar, hero, about, terminal): with one CV it is that file; with
// several, /cv lists them so the visitor picks the one for the job.
export async function GET(req: NextRequest) {
  const files = await getCvFiles();
  const to = files.length === 1 ? `/cv/download/${files[0]!.role}` : "/cv#cv-files";
  return NextResponse.redirect(new URL(to, req.url), { headers: { "Cache-Control": "no-store" } });
}
