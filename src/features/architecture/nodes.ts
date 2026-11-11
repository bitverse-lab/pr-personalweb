// The stops a public request makes in this site, each with the decision behind it and where that
// decision lives in the code. The excerpt is read from the real file at build time (see excerpt.ts);
// nodes.test.ts fails if a marker no longer exists, so the page cannot quote code that is gone.

export interface ArchNode {
  id: "browser" | "server" | "cache" | "db";
  name: string;
  where: string;
  /** What was decided, and why (an architecture decision record in two sentences). */
  decision: string;
  source: { file: string; marker: string; lines: number };
}

export const ARCH_NODES: ArchNode[] = [
  {
    id: "browser",
    name: "Your browser",
    where: "this page",
    decision:
      "Heavy features load only when asked for. The in-browser Postgres and the sentence model are megabytes each, so they never block the first paint; a button names their size first.",
    source: { file: "src/components/home/HeroC.tsx", marker: "const LiveConsole = dynamic(", lines: 1 },
  },
  {
    id: "server",
    name: "Next.js server",
    where: "route handler / page render",
    decision:
      "Public list pages degrade instead of failing. If the database cannot be reached, a section is left out and the page still renders, which also keeps a deploy from failing on a database hiccup. Detail pages do the opposite: an outage must not look like a deleted article.",
    source: { file: "src/lib/data/site-cache.ts", marker: "export async function publicRead", lines: 8 },
  },
  {
    id: "cache",
    name: "Data cache",
    where: "5 minutes, tagged",
    decision:
      "Public reads are cached for five minutes under one tag, and every change visitors can see drops that tag at once. The cache sits inside the degrade wrapper, so a failure is never cached.",
    source: { file: "src/lib/data/site-cache.ts", marker: "export function revalidateSiteData", lines: 9 },
  },
  {
    id: "db",
    name: "Postgres",
    where: "Supabase, Singapore",
    decision:
      "Every query on owner data filters by the owner's id; it is the one thing that separates the owner's rows from anyone else's. Deployed code goes through the transaction pooler, which cannot keep prepared statements.",
    source: { file: "src/server/repositories/project-repository.ts", marker: "listPublished(ownerId: string)", lines: 7 },
  },
];
