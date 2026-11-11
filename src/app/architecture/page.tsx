import type { Metadata } from "next";
import Link from "next/link";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import RequestTrace from "@/components/architecture/RequestTrace";
import { ARCH_NODES } from "@/features/architecture/nodes";
import { excerpt } from "@/features/architecture/excerpt";

export const metadata: Metadata = {
  title: "Architecture",
  description: "How a request moves through this website, timed live, with the decision and the code behind each stop.",
};

// Built once: the code excerpts are read from the repository at build time, and the timings come
// from the visitor's own request, so nothing here needs the server at render time.
export const dynamic = "force-static";

export default function ArchitecturePage() {
  const nodes = ARCH_NODES.map((n) => ({ ...n, excerpt: excerpt(n.source.file, n.source.marker, n.source.lines) }));
  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
        <section className="page-head">
          <div className="container">
            <p className="path-label mb-3">~/architecture</p>
            <h1 className="page-head-title">How a request moves through this site</h1>
            <p className="page-head-lede">
              Send one and watch it travel. The times are your request&apos;s, measured as it happens. Open any stop to read the decision behind it and the code that carries it out.
            </p>
          </div>
        </section>
        <section className="section pt-5">
          <div className="container">
            <RequestTrace nodes={nodes} />
            <p className="arch-foot">
              More numbers about this site, measured by its own pipeline, are on <Link href="/proof">/proof</Link>.
            </p>
          </div>
        </section>
      </main>
      <SmallFooter />
    </>
  );
}
