import { auth } from "@/server/auth";
import { exportService } from "@/server/services/export-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Downloads everything the signed-in owner has stored, as one JSON file. Never cached, never public.
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const payload = await exportService.build(userId);
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="personal-os-export-${stamp}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
