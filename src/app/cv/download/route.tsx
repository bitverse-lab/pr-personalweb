import { renderToBuffer } from "@react-pdf/renderer";
import { getProfile } from "@/lib/data/profile";
import CvDocument from "./CvDocument";

export const runtime = "nodejs";
export const revalidate = 300;

// Generated from the same profile data as the /cv page, so the PDF never goes stale.
export async function GET() {
  const profile = await getProfile();
  if (profile.isPlaceholder) return new Response("CV not available yet", { status: 404 });

  const buffer = await renderToBuffer(<CvDocument profile={profile} />);
  const filename = `${profile.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "cv"}-cv.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
