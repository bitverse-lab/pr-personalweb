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
      <section className="bg-half-170 d-table w-100">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-7 text-center">
              <div className="display-1 fw-bold text-primary mb-2" aria-hidden="true">404</div>
              <h1 className="h4 mb-3">This page could not be found</h1>
              <p className="text-muted mb-4">The link may be broken, or the page may have been moved or unpublished.</p>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <Link href="/" className="btn btn-primary">Back to home</Link>
                <Link href="/projects" className="btn btn-outline-primary">See projects</Link>
                <Link href="/articles" className="btn btn-outline-primary">Read articles</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
      <SmallFooter />
    </>
  );
}
