"use client";

import Link from "next/link";
import { useEffect } from "react";
import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";

// Shown when a page fails while rendering. The details stay in the server logs; visitors only see this.
// It keeps the site's own header and footer so a visitor who lands here can still get somewhere useful.
export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
        <section className="bg-half-170 d-table w-100">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-7 text-center">
                <div className="display-1 fw-bold text-primary mb-2" aria-hidden="true">
                  Oops
                </div>
                <h1 className="h4 mb-3">This page is temporarily unavailable</h1>
                <p className="text-muted mb-4">
                  Something went wrong while loading it. This is usually brief — please try again in a moment.
                  {error.digest && <span className="d-block small mt-2">Reference: {error.digest}</span>}
                </p>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  <button type="button" className="btn btn-primary" onClick={reset}>
                    Try again
                  </button>
                  <Link href="/" className="btn btn-outline-primary">
                    Back to home
                  </Link>
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
