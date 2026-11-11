import { NextResponse, type NextRequest } from "next/server";
import { roleBySlug } from "@/features/roles/roles";
import { reportError } from "@/lib/report-error";
import { articleRepository } from "@/server/repositories/article-repository";
import { cvFileService } from "@/server/services/cv-file-service";
import { clientIp, createRateLimit } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

// Each call is a database read and a signed-link request to storage.
const perVisitor = createRateLimit(30, 60_000);
const noStore = { "Cache-Control": "no-store" };

/** The owner's CV for one role: a redirect to a short-lived link (?view=1 opens it in the browser). */
export async function GET(req: NextRequest, { params }: { params: { role: string } }) {
  const wait = perVisitor(clientIp(req.headers));
  if (wait) return new NextResponse("Too many requests", { status: 429, headers: { ...noStore, "Retry-After": String(wait) } });

  const toList = () => NextResponse.redirect(new URL("/cv#cv-files", req.url), { headers: noStore });
  if (!roleBySlug(params.role)) return toList(); // not a role this site knows: nothing to look up

  let url: string | null;
  try {
    const owner = await articleRepository.owner();
    url = owner ? await cvFileService.signedUrl(owner.id, params.role, req.nextUrl.searchParams.has("view")) : null;
  } catch (error) {
    // An outage is not "no CV for this role": say so instead of sending the visitor to an empty list.
    reportError("cv-download", error);
    return new NextResponse("The CV cannot be downloaded right now. Please try again in a moment.", { status: 503, headers: noStore });
  }
  return url ? NextResponse.redirect(url, { headers: noStore }) : toList();
}
