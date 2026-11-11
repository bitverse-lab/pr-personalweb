import Link from "next/link";
import PersonalNavbar from "@/components/layout/PersonalNavbar";
import type { Metadata } from "next";
import SmallFooter from "@/components/layout/SmallFooter";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
      <section className="page-head page-head--tall">
        <div className="container">
          <p className="path-label mb-3" aria-hidden="true">404 · no such page</p>
          <h1 className="page-head-title">This page could not be found</h1>
          <p className="page-head-lede">The link may be broken, or the page may have been moved or unpublished.</p>
          <div className="d-flex flex-wrap gap-2 mt-4">
            <Link href="/" className="btn btn-primary">Back to home</Link>
            <Link href="/projects" className="btn btn-outline-primary">See work</Link>
            <Link href="/articles" className="btn btn-outline-primary">Read writing</Link>
          </div>
        </div>
      </section>
      </main>
      <SmallFooter />
    </>
  );
}
